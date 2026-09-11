/**
 * Adds missing cross-page anchor targets by placing ids directly on the
 * corresponding heading/section elements. Idempotent.
 * Run: node scripts/fix-anchors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** [file, id, matcherRegex] — matcher locates the element to receive the id */
const TASKS = [
  ['about.html', 'story', /<h2[^>]*>(?=[^<]*Purpose, Policy)/],
  ['about.html', 'timeline', /<h2[^>]*>(?=[^<]*Corporate Timeline)/],
  ['about.html', 'leadership', /<h2[^>]*>(?=[^<]*Executive)/],
  ['about.html', 'esg', /<h2[^>]*>(?=[^<]*Empowering Citizens)/],
  ['about.html', 'careers', /<h2[^>]*(?=[^>]*>)[^>]*>(?=[^<]*(?:Standards|Careers))/],
  ['about.html', 'accreditations', /<h3[^>]*>(?=[^<]*BHPC Regulated)/],
  ['about.html', 'privacy', /<h2[^>]*>(?=[^<]*Clear responsibilities)/],
  ['services.html', 'mri', /<h2[^>]*>(?=[^<]*3T MAGNETOM Vida)/],
  ['services.html', 'ct', /<h2[^>]*>(?=[^<]*128-Slice SOMATOM)/],
  ['services.html', 'xray', /<h2[^>]*>(?=[^<]*Digital X-Ray)/],
  ['services.html', 'ultrasound', /<h3[^>]*>(?=[^<]*4D Ultrasound Imaging)/],
  ['services.html', 'enterprise', /<h3[^>]*>(?=[^<]*Mining Occupational Health)/],
  ['services.html', 'teleradiology', /<h3[^>]*>(?=[^<]*Hospital Teleradiology)/],
  ['contact.html', 'book', /<h2[^>]*>(?=[^<]*Schedule Your Scan)/]
];

const log = [];
const counts = {};
for (const [file, id, re] of TASKS) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  if (new RegExp(`id="${id}"`).test(html)) { log.push(`${file}: #${id} already present`); continue; }
  const m = re.exec(html);
  if (!m) { log.push(`${file}: #${id} matcher NOT FOUND — manual fix needed`); continue; }
  const tagStart = html.lastIndexOf('<', m.index);
  const tagEnd = html.indexOf('>', tagStart);
  const tag = html.slice(tagStart, tagEnd + 1);
  if (/\sid="/.test(tag)) { log.push(`${file}: element before #${id} matcher already has an id, skipped`); continue; }
  const patched = tag.replace(/^<(\w+)/, `<$1 id="${id}"`);
  html = html.slice(0, tagStart) + patched + html.slice(tagEnd + 1);
  fs.writeFileSync(p, html);
  counts[file] = (counts[file] || 0) + 1;
  log.push(`${file}: id="${id}" added to <${html.slice(tagStart + 1, tagStart + 8).split(/[\s>]/)[0]}>`);
}

/* doctor.html: referral form section */
{
  const p = path.join(ROOT, 'doctor.html');
  let html = fs.readFileSync(p, 'utf8');
  if (!/id="referral-form"/.test(html)) {
    const i = html.search(/data-gerald-form="referral"/);
    if (i !== -1) {
      const s = html.lastIndexOf('<section', i);
      const tagEnd = html.indexOf('>', s);
      const tag = html.slice(s, tagEnd + 1);
      if (!/\sid="/.test(tag)) {
        html = html.slice(0, s) + tag.replace(/^<section/, '<section id="referral-form"') + html.slice(tagEnd + 1);
        fs.writeFileSync(p, html);
        log.push('doctor.html: id="referral-form" added to enclosing <section>');
      } else log.push('doctor.html: referral form section already has an id');
    } else log.push('doctor.html: referral form not found');
  } else log.push('doctor.html: #referral-form already present');
}

console.log(log.join('\n'));
