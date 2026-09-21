const INTERVAL_MS = 5 * 60 * 1000;

function normalizeHealthUrl(value) {
  if (!value) return 'https://insta-template-server.onrender.com/api/health';
  if (value.includes('/api/health')) return value;
  return `${value.replace(/\/$/, '')}/api/health`;
}

const TARGETS = [
  process.env.FRONTEND_URL || 'https://insta-template-frontend.onrender.com/',
  normalizeHealthUrl(process.env.SERVER_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL),
];

async function ping(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(90_000),
    });
    console.log(`keepalive ${response.status} ${url}`);
  } catch (error) {
    console.warn(`keepalive failed ${url}:`, error.message);
  }
}

export async function pingOnce() {
  await Promise.all(TARGETS.map(url => ping(url)));
}

export function startKeepalive() {
  const tick = () => {
    pingOnce();
  };

  setInterval(tick, INTERVAL_MS);
  console.log(`keepalive every 5m -> ${TARGETS.join(', ')}`);
}

if (process.argv[1]?.endsWith('keepalive.js')) {
  await pingOnce();
}

