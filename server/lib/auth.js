import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { Resend } from 'resend';

import { getSupabaseAdmin } from './supabase.js';

const PIN_LENGTH = 6;
const PIN_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_SENDS_PER_HOUR = 8;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function hashPin(email, pin) {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'otp')
    .update(`${email}:${pin}`)
    .digest('hex');
}

function pinsMatch(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function generatePin() {
  return String(randomInt(100000, 1000000));
}

async function findUserByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw error;
  }

  return (data?.users || []).find(user => normalizeEmail(user.email) === email) || null;
}

function pinEmailHtml(pin) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#0a0a0a;color:#f4f4f5;font-family:Geist,Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height:100%;background:#0a0a0a;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:420px;background:#141414;border:1px solid #242428;border-radius:24px;padding:36px 32px;">
            <tr>
              <td>
                <div style="width:40px;height:40px;border-radius:999px;background:#fafafa;color:#0a0a0a;font-weight:700;text-align:center;line-height:40px;">J</div>
                <h1 style="margin:24px 0 8px;font-size:22px;letter-spacing:-0.03em;">Your verification code</h1>
                <p style="margin:0 0 28px;color:#a1a1aa;font-size:14px;line-height:1.6;">Enter this pin to finish setting up your account. It expires in 10 minutes.</p>
                <div style="letter-spacing:0.4em;font-size:32px;font-weight:700;text-align:center;padding:18px 0;border-radius:16px;background:#0a0a0a;border:1px solid #242428;">${pin}</div>
                <p style="margin:28px 0 0;color:#71717a;font-size:12px;line-height:1.5;">If you did not request this, you can ignore the email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendPinEmail(email, pin) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = new Error('Resend is not configured. Add RESEND_API_KEY to the server environment.');
    error.status = 503;
    throw error;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || 'Insta <beth.t@example.com>';
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${pin} is your verification code`,
    html: pinEmailHtml(pin),
    text: `Your verification code is ${pin}. It expires in 10 minutes.`,
  });

  if (error) {
    const next = new Error(error.message || 'Could not send verification email');
    next.status = 502;
    throw next;
  }
}

async function assertCanSend(supabase, email) {
  const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: hourly, error: hourlyError } = await supabase
    .from('email_otps')
    .select('id, created_at')
    .eq('email', email)
    .gte('created_at', sinceHour)
    .order('created_at', { ascending: false });

  if (hourlyError) {
    throw hourlyError;
  }

  if ((hourly || []).length >= MAX_SENDS_PER_HOUR) {
    const error = new Error('Too many codes requested. Try again in a bit.');
    error.status = 429;
    throw error;
  }

  const latest = hourly?.[0];
  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    const error = new Error('Please wait a moment before requesting another code.');
    error.status = 429;
    throw error;
  }
}

export async function issueVerificationPin(email, purpose = 'signup') {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    const error = new Error('Enter a valid email address.');
    error.status = 400;
    throw error;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const error = new Error('Supabase is not configured.');
    error.status = 503;
    throw error;
  }

  if (purpose === 'signin') {
    const user = await findUserByEmail(supabase, normalized);
    if (!user) {
      const error = new Error('No account found for that email.');
      error.status = 404;
      throw error;
    }
  }

  await assertCanSend(supabase, normalized);

  const pin = generatePin();
  const { error } = await supabase.from('email_otps').insert({
    email: normalized,
    pin_hash: hashPin(normalized, pin),
    purpose,
    expires_at: new Date(Date.now() + PIN_TTL_MS).toISOString(),
  });

  if (error) {
    throw error;
  }

  await sendPinEmail(normalized, pin);
  return { email: normalized };
}

export async function registerWithEmail({ email, password, displayName }) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    const error = new Error('Enter a valid email address.');
    error.status = 400;
    throw error;
  }

  if (!isValidPassword(password)) {
    const error = new Error('Password must be at least 8 characters.');
    error.status = 400;
    throw error;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const error = new Error('Supabase is not configured.');
    error.status = 503;
    throw error;
  }

  if (!process.env.RESEND_API_KEY) {
    const error = new Error('Resend is not configured. Add RESEND_API_KEY to the server environment.');
    error.status = 503;
    throw error;
  }

  const name = typeof displayName === 'string' ? displayName.trim().slice(0, 48) : '';
  const existing = await findUserByEmail(supabase, normalized);

  if (existing?.email_confirmed_at) {
    const error = new Error('An account with this email already exists. Sign in instead.');
    error.status = 409;
    throw error;
  }

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: name ? { display_name: name } : existing.user_metadata,
      email_confirm: false,
    });
    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: false,
      user_metadata: name ? { display_name: name } : undefined,
    });
    if (error) {
      throw error;
    }
  }

  await issueVerificationPin(normalized, 'signup');
  return { email: normalized, needsVerification: true };
}

export async function verifyEmailPin({ email, pin }) {
  const normalized = normalizeEmail(email);
  const code = String(pin || '').replace(/\D/g, '');

  if (!isValidEmail(normalized) || code.length !== PIN_LENGTH) {
    const error = new Error('Enter the 6-digit code from your email.');
    error.status = 400;
    throw error;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const error = new Error('Supabase is not configured.');
    error.status = 503;
    throw error;
  }

  const { data: rows, error: lookupError } = await supabase
    .from('email_otps')
    .select('*')
    .eq('email', normalized)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (lookupError) {
    throw lookupError;
  }

  const otp = rows?.[0];
  if (!otp) {
    const error = new Error('That code has expired. Request a new one.');
    error.status = 400;
    throw error;
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    const error = new Error('Too many attempts. Request a new code.');
    error.status = 429;
    throw error;
  }

  const matches = pinsMatch(otp.pin_hash, hashPin(normalized, code));
  if (!matches) {
    await supabase
      .from('email_otps')
      .update({ attempts: otp.attempts + 1 })
      .eq('id', otp.id);
    const error = new Error('That code is incorrect.');
    error.status = 400;
    throw error;
  }

  const { error: consumeError } = await supabase
    .from('email_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', otp.id);

  if (consumeError) {
    throw consumeError;
  }

  const user = await findUserByEmail(supabase, normalized);
  if (!user) {
    const error = new Error('No account found for that email.');
    error.status = 404;
    throw error;
  }

  const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (confirmError) {
    throw confirmError;
  }

  await supabase
    .from('profiles')
    .update({
      email: normalized,
      email_verified_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  return { verified: true, email: normalized };
}

export async function getUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return null;
  }

  return data.user || null;
}

export { isValidEmail, isValidPassword, normalizeEmail };
