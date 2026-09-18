/**
 * Safe External Fetch
 * ---------------------------------------------------------------
 * Used by the "import product from URL" feature. Since this fetches
 * whatever URL a staff member pastes in, it needs guardrails against
 * SSRF (Server-Side Request Forgery) — without these, the endpoint
 * could be used to make the server probe internal/private network
 * addresses (localhost, cloud metadata endpoints like 169.254.169.254,
 * internal service hostnames) rather than the intended public site.
 *
 * This only protects THIS feature's fetches — it's not a general-
 * purpose security layer for the rest of the app.
 * ---------------------------------------------------------------
 */

const dns = require('dns').promises;
const net = require('net');

const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 3 * 1024 * 1024; // 3MB cap while reading HTML/images

function isPrivateOrLoopbackIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 127) return true; // loopback
    if (parts[0] === 10) return true; // private
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // private
    if (parts[0] === 192 && parts[1] === 168) return true; // private
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local (cloud metadata lives here)
    if (parts[0] === 0) return true;
    return false;
  }
  // IPv6 loopback / link-local / unique-local
  const lower = ip.toLowerCase();
  return lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd');
}

/**
 * Validates a URL is safe to fetch server-side: http/https only, and
 * resolves to a public IP address (not localhost/private/link-local).
 * Throws with a user-facing message if the URL fails any check.
 */
async function assertSafeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('الرابط غير صالح.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('يجب أن يبدأ الرابط بـ http أو https.');
  }

  let addresses;
  try {
    addresses = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    throw new Error('تعذر الوصول إلى هذا الرابط.');
  }

  if (addresses.some((a) => isPrivateOrLoopbackIp(a.address))) {
    throw new Error('هذا الرابط غير مسموح به.');
  }

  return parsed;
}

/**
 * Fetch a URL with a timeout and a hard cap on how much of the response
 * body is read, regardless of what Content-Length claims.
 *
 * NOTE: assertSafeUrl()'s DNS check happens separately from this actual
 * fetch, which re-resolves the hostname itself. A sufficiently determined
 * attacker controlling DNS for the target domain could theoretically swap
 * the IP between the check and the fetch ("DNS rebinding"). This endpoint
 * is staff-authenticated (OPERATIONS role only), not public, which limits
 * real-world exposure — but this isn't a fully hardened SSRF defense, and
 * shouldn't be copied as-is into a public-facing endpoint.
 */
async function safeFetch(url, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`الموقع أعاد الحالة ${res.status}.`);

    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_RESPONSE_BYTES) {
        controller.abort();
        throw new Error('حجم الاستجابة كبير جدا.');
      }
      chunks.push(value);
    }

    return {
      buffer: Buffer.concat(chunks.map((c) => Buffer.from(c))),
      contentType: res.headers.get('content-type') || '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { assertSafeUrl, safeFetch, MAX_RESPONSE_BYTES };
