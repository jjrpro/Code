'use strict';

// Lightweight single-password gate for when the app is exposed beyond
// localhost (cloud hosting). A correct password mints a signed, httpOnly
// session cookie (HMAC-SHA256) — no database, no extra dependency.
//
// If CM_PASSWORD is unset, auth is DISABLED (fine for local-only use on your
// Mac). The server refuses to bind to a non-loopback address without a
// password, so you can't accidentally expose your financial data unprotected.

const crypto = require('crypto');
const config = require('./config');

const COOKIE = 'cm_session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function enabled() {
  return Boolean(config.auth.password);
}

function secret() {
  if (config.auth.sessionSecret) return config.auth.sessionSecret;
  // Derive a stable secret from the password (+ encryption key if present) so
  // cookies survive restarts without requiring a separate env var.
  return crypto
    .createHash('sha256')
    .update('cm-session|' + config.auth.password + '|' + (config.encryptionKey || ''))
    .digest('hex');
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payloadObj) {
  const payload = b64url(JSON.stringify(payloadObj));
  const mac = b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${mac}`;
}

function verify(token) {
  if (!token || token.indexOf('.') === -1) return null;
  const [payload, mac] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    if (!obj.iat || Date.now() - obj.iat > MAX_AGE_MS) return null;
    return obj;
  } catch (_) {
    return null;
  }
}

function checkPassword(input) {
  if (!enabled()) return false;
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(config.auth.password);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const i = pair.indexOf('=');
    if (i > -1) out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}

function isSecure(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function setSession(req, res) {
  const token = sign({ iat: Date.now() });
  const parts = [
    `${COOKIE}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`,
  ];
  if (isSecure(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function isAuthed(req) {
  if (!enabled()) return true;
  return verify(parseCookies(req)[COOKIE]) !== null;
}

// Paths reachable without a session (so the login page can load + submit).
const OPEN = new Set(['/login', '/login.html', '/styles.css', '/manifest.webmanifest', '/sw.js', '/health', '/api/login', '/favicon.ico']);
function isOpenPath(p) {
  return OPEN.has(p) || p.startsWith('/icons/');
}

// Express middleware: gate everything unless authed or on an open path.
function middleware(req, res, next) {
  if (!enabled() || isAuthed(req) || isOpenPath(req.path)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'unauthorized' });
  return res.redirect('/login');
}

module.exports = { enabled, middleware, checkPassword, setSession, clearSession, isAuthed };
