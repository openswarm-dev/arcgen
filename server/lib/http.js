import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 8000;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function curlBin() {
  return process.platform === 'win32' ? 'curl.exe' : 'curl';
}

export async function curlText(url, extraArgs = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { stdout } = await execFileAsync(
    curlBin(),
    [
      '-sS',
      '-L',
      '--max-time',
      String(Math.max(1, Math.ceil(timeoutMs / 1000))),
      '-A',
      BROWSER_UA,
      ...extraArgs,
      url,
    ],
    { timeout: timeoutMs + 1000, maxBuffer: 5_000_000, windowsHide: true }
  );

  return stdout.toString();
}

export async function curlJson(url, extraArgs = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
  const text = await curlText(url, extraArgs, timeoutMs);
  return JSON.parse(text);
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: options.accept || 'application/json, text/html;q=0.9, */*;q=0.8',
        ...options.headers,
      },
    });

    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function fetchText(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.text();
}

export function extractOg(html) {
  const read = property => {
    const named = new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`,
      'i'
    );
    const reversed = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`,
      'i'
    );
    return html.match(named)?.[1] || html.match(reversed)?.[1] || '';
  };

  return {
    title: decodeHtml(read('og:title') || read('twitter:title')),
    description: decodeHtml(read('og:description') || read('twitter:description') || read('description')),
    image: read('og:image') || read('twitter:image'),
  };
}

export function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ');
}

export function formatCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  if (number < 1000) return String(Math.round(number));
  if (number < 1_000_000) return `${(number / 1000).toFixed(number < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(number / 1_000_000).toFixed(number < 10_000_000 ? 1 : 0).replace(/\.0$/, '')}M`;
}

export function formatRelativeTime(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';

  const delta = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const cache = new Map();

export async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit?.promise) return hit.promise;
  if (hit && Date.now() < hit.expiresAt) return hit.value;

  const promise = Promise.resolve()
    .then(fn)
    .then(value => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch(error => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { promise, expiresAt: Date.now() + ttlMs });
  return promise;
}
