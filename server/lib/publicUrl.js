export function getPublicApiBase() {
  const base =
    process.env.PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 3001}`;

  return String(base).replace(/\/$/, '');
}

export function isLocalhostUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return true;
  }
}
