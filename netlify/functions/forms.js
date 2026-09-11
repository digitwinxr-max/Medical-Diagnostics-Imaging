'use strict';

const crypto = require('crypto');
const allowed = new Set(['booking', 'referral', 'cme', 'newsletter', 'contact', 'enterprise']);
const required = {
  booking: ['fullName', 'phone'],
  referral: ['patientName', 'phone', 'modality', 'clinicalHistory'],
  cme: ['fullName', 'email', 'phone', 'course'],
  newsletter: ['email'], contact: ['fullName', 'phone'], enterprise: ['fullName', 'email']
};
const clean = (v, max = 3000) => String(v == null ? '' : v).replace(/[\u0000-\u001F]/g, '').trim().slice(0, max);
const response = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed.' });
  try {
    const type = String(event.headers['content-type'] || '');
    let input;
    if (type.includes('application/json')) input = JSON.parse(event.body || '{}');
    else input = Object.fromEntries(new URLSearchParams(event.body || ''));
    if (clean(input.website, 100)) return response(200, { ok: true, reference: 'MDI-RECEIVED' });
    const formType = clean(input.formType, 32).toLowerCase();
    if (!allowed.has(formType)) return response(400, { error: 'Unsupported form type.' });
    const fields = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === 'website' || key === 'form-name') continue;
      const safeKey = clean(key, 50).replace(/[^a-zA-Z0-9_-]/g, '');
      if (safeKey) fields[safeKey] = clean(value, safeKey.toLowerCase().includes('clinical') ? 6000 : 1000);
    }
    const missing = (required[formType] || []).filter(k => !fields[k]);
    if (missing.length) return response(422, { error: 'Please complete the required fields.', fields: missing });
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return response(422, { error: 'Please enter a valid email address.' });
    const reference = `MDI-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record = { reference, formType, submittedAt: new Date().toISOString(), fields };
    if (process.env.FORM_WEBHOOK_URL) {
      const webhook = await fetch(process.env.FORM_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
      if (!webhook.ok) throw new Error('Submission workflow unavailable.');
    }
    return response(201, { ok: true, reference, message: 'Your request has been received.' });
  } catch (error) {
    console.error('Netlify form function:', error.message);
    return response(500, { error: 'Unable to process this request securely.' });
  }
};
