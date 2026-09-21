'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { registerAccount, sendAuthPin, verifyAuthPin } from '@/lib/api';
import BrandLogo from '@/components/brand/BrandLogo';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import styles from './AuthOverlay.module.css';

const PIN_LENGTH = 6;

function PinInputs({ value, onChange, disabled }) {
  const refs = useRef([]);

  const setDigit = (index, digit) => {
    const next = value.split('');
    next[index] = digit;
    onChange(next.join('').slice(0, PIN_LENGTH));
    if (digit && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className={styles.pinRow} role="group" aria-label="Verification code">
      {Array.from({ length: PIN_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={node => {
            refs.current[index] = node;
          }}
          className={styles.pinBox}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[index] || ''}
          disabled={disabled}
          onChange={event => {
            const digit = event.target.value.replace(/\D/g, '').slice(-1);
            setDigit(index, digit);
          }}
          onKeyDown={event => {
            if (event.key === 'Backspace' && !value[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={event => {
            const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
            if (!text) return;
            event.preventDefault();
            onChange(text);
            refs.current[Math.min(text.length, PIN_LENGTH - 1)]?.focus();
          }}
        />
      ))}
    </div>
  );
}

export default function AuthOverlay({ open, mode, onModeChange, onClose }) {
  const { supabase, isConfigured } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const panelRef = useRef(null);

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = event => {
      if (event.key === 'Escape' && !busy) onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) {
      setStep('form');
      setPassword('');
      setPin('');
      setError('');
      setBusy(false);
      setShowPassword(false);
    }
  }, [open, mode]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const startCooldown = () => setCooldown(45);

  const finishSignIn = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      throw signInError;
    }

    onClose();
  }, [email, onClose, password, supabase]);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (!isConfigured) {
        throw new Error('Supabase is not configured yet.');
      }

      if (isSignup) {
        await registerAccount({ email, password });
        setStep('pin');
        startCooldown();
        return;
      }

      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!signInError) {
        onClose();
        return;
      }

      const message = signInError.message || '';
      if (/confirm|not confirmed|email not confirmed/i.test(message)) {
        await sendAuthPin({ email, purpose: 'signin' });
        setStep('pin');
        startCooldown();
        return;
      }

      throw signInError;
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await verifyAuthPin({ email, pin });
      await finishSignIn();
    } catch (verifyError) {
      setError(verifyError.message || 'Could not verify that code.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setError('');
    setBusy(true);

    try {
      await sendAuthPin({ email, purpose: isSignup ? 'signup' : 'signin' });
      startCooldown();
    } catch (resendError) {
      setError(resendError.message || 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className={styles.root} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className={styles.backdrop} aria-label="Close login" onClick={busy ? undefined : onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-overlay-title"
            className={styles.panel}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>

            <BrandLogo className={styles.mark} />
            <AnimatePresence mode="wait">
              {step === 'pin' ? (
                <motion.form
                  key="pin"
                  className={styles.form}
                  onSubmit={handleVerify}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                >
                  <h2 id="auth-overlay-title" className={styles.title}>
                    Enter your pin
                  </h2>
                  <p className={styles.subtitle}>
                    We sent a 6-digit code to <span>{email.trim()}</span>
                  </p>
                  <PinInputs value={pin} onChange={setPin} disabled={busy} />
                  {error ? <p className={styles.error}>{error}</p> : null}
                  <button type="submit" className={styles.submit} disabled={busy || pin.length !== PIN_LENGTH}>
                    {busy ? 'Verifying...' : 'Verify account'}
                  </button>
                  <button type="button" className={styles.ghost} onClick={handleResend} disabled={busy || cooldown > 0}>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    className={styles.switch}
                    onClick={() => {
                      setStep('form');
                      setPin('');
                      setError('');
                    }}
                  >
                    Use a different email
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="form"
                  className={styles.form}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                >
                  <h2 id="auth-overlay-title" className={styles.title}>
                    {isSignup ? 'Create your account' : 'Welcome back'}
                  </h2>
                  <p className={styles.subtitle}>
                    {isSignup
                      ? 'Sign up with email. We will send a pin to verify it is you.'
                      : 'Sign in with your email and password.'}
                  </p>

                  <div className={styles.tabs} role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isSignup}
                      className={`${styles.tab} ${!isSignup ? styles.tabActive : ''}`}
                      onClick={() => onModeChange('signin')}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isSignup}
                      className={`${styles.tab} ${isSignup ? styles.tabActive : ''}`}
                      onClick={() => onModeChange('signup')}
                    >
                      Create account
                    </button>
                  </div>

                  <label className={styles.field}>
                    <span>Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="you@email.com"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Password</span>
                    <div className={styles.passwordWrap}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                      />
                      <button type="button" className={styles.reveal} onClick={() => setShowPassword(value => !value)}>
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  {error ? <p className={styles.error}>{error}</p> : null}

                  <button type="submit" className={styles.submit} disabled={busy}>
                    {busy ? 'Please wait...' : isSignup ? 'Send verification pin' : 'Sign in'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
