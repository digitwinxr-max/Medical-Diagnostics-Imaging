'use strict';

/**
 * Gerald Holdings static site + secure form intake API.
 * No third-party runtime dependencies are required.
 */
const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { URLSearchParams } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = path.join(ROOT, 'data');
const SUBMISSION_FILE = path.join(DATA_DIR, 'submissions.ndjson');
const MAX_BODY = 64 * 1024;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;
const rate = new Map();
const allowedTypes = new Set(['booking', 'referral', 'cme', 'newsletter', 'contact', 'enterprise']);

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; frame-src https://www.google.com https://maps.google.com; connect-src 'self'; base-uri 'self'; form-action 'self'",
  });
  res.end(body);
}

function json(res, status, value) { send(res, status, JSON.stringify(value)); }

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const current = (rate.get(ip) || []).filter(t => now - t < WINDOW_MS);
  current.push(now); rate.set(ip, current);
  return current.length > MAX_REQUESTS;
}

function clean(value, max = 3000) {
  if (Array.isArray(value)) value = value.join(', ');
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function requiredFor(type) {
  return {
    booking: ['fullName', 'phone'],
    referral: ['patientName', 'phone', 'modality', 'clinicalHistory'],
    cme: ['fullName', 'email', 'phone', 'course'],
    newsletter: ['email'],
    contact: ['fullName', 'phone'],
    enterprise: ['fullName', 'email']
  }[type] || [];
}

function validEmail(v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validPhone(v) { return !v || /^[+\d][\d\s()-]{6,24}$/.test(v); }

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Payload too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const type = String(req.headers['content-type'] || '');
        if (type.includes('application/json')) resolve(JSON.parse(raw || '{}'));
        else resolve(Object.fromEntries(new URLSearchParams(raw)));
      } catch { reject(Object.assign(new Error('Invalid request body'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

async function optionalWebhook(record) {
  const target = process.env.FORM_WEBHOOK_URL;
  if (!target || typeof fetch !== 'function') return;
  try {
    await fetch(target, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record), signal: AbortSignal.timeout(5000)
    });
  } catch (err) {
    console.error('Form webhook failed:', err.message);
  }
}

async function receiveForm(req, res) {
  const ip = clientIp(req);
  if (rateLimited(ip)) return json(res, 429, { error: 'Too many requests. Please wait and try again.' });
  try {
    const input = await parseBody(req);
    if (clean(input.website, 100)) return json(res, 200, { ok: true, reference: 'GH-RECEIVED' }); // honeypot
    const formType = clean(input.formType, 32).toLowerCase();
    if (!allowedTypes.has(formType)) return json(res, 400, { error: 'Unsupported form type.' });

    const fields = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === 'website' || key === 'formType') continue;
      const safeKey = clean(key, 50).replace(/[^a-zA-Z0-9_-]/g, '');
      if (safeKey) fields[safeKey] = clean(value, safeKey.toLowerCase().includes('clinical') ? 6000 : 1000);
    }
    const missing = requiredFor(formType).filter(name => !fields[name]);
    if (missing.length) return json(res, 422, { error: 'Please complete the required fields.', fields: missing });
    if (!validEmail(fields.email)) return json(res, 422, { error: 'Please enter a valid email address.', fields: ['email'] });
    if (!validPhone(fields.phone)) return json(res, 422, { error: 'Please enter a valid contact number.', fields: ['phone'] });

    const now = new Date();
    const reference = `GH-${now.toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record = {
      reference, formType, submittedAt: now.toISOString(),
      sourcePage: clean(fields.page || req.headers.referer || '', 300),
      fields,
      request: { ipHash: crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'gerald-local')).digest('hex').slice(0, 20), userAgent: clean(req.headers['user-agent'], 300) }
    };
    await fsp.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
    await fsp.appendFile(SUBMISSION_FILE, JSON.stringify(record) + '\n', { encoding: 'utf8', mode: 0o600 });
    optionalWebhook(record); // do not delay the patient-facing response
    return json(res, 201, { ok: true, reference, message: 'Your request has been received.' });
  } catch (err) {
    console.error('Form submission error:', err.message);
    return json(res, err.status || 500, { error: err.status ? err.message : 'Unable to store this request safely.' });
  }
}

async function serveStatic(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname); }
  catch { return send(res, 400, 'Bad request', 'text/plain; charset=utf-8'); }
  if (pathname === '/') pathname = '/index.html';
  // Local-only submission storage must never be served over HTTP (the
  // Netlify deployment force-404s /data/* in netlify.toml).
  if (pathname.startsWith('/data/')) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  const resolved = path.resolve(ROOT, '.' + pathname);
  if (!resolved.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  try {
    const stat = await fsp.stat(resolved);
    const file = stat.isDirectory() ? path.join(resolved, 'index.html') : resolved;
    const data = await fsp.readFile(file);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return send(res, 500, 'Server error', 'text/plain; charset=utf-8');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/forms') return receiveForm(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  res.setHeader('Allow', 'GET, HEAD, POST');
  return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Gerald Holdings website running at http://localhost:${PORT}`));
}
module.exports = { server };
