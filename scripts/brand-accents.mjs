/**
 * Hand-tuned Gerald Holdings brand accents applied after the bulk codemod.
 * Deterministic replacements with logging.
 * Run: node scripts/brand-accents.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, c) => fs.writeFileSync(p, c);
const TW = ['index.html', 'about.html', 'services.html', 'patient.html', 'doctor.html', 'training.html', 'blog.html', 'contact.html'];

const GLOBAL_EXTRA = `
/* --- GH global refinements --- */
footer.border-t{border-top-color:rgba(197,165,49,.5) !important}
#navbar nav a.nav-link-underline.active{color:#C5A531 !important}
.nav-link-underline.active::after{background:#C5A531 !important}
.immersive-hero-veil:after{background:linear-gradient(0deg,rgba(6,32,47,.75),transparent 45%),radial-gradient(circle at 72% 38%,rgba(56,180,232,.14),transparent 28%),radial-gradient(circle at 24% 12%,rgba(99,30,159,.16),transparent 30%)}
`;

const log = [];
for (const f of TW) {
  const p = path.join(ROOT, f);
  let html = read(p);
  const i = html.indexOf('/* Gerald Holdings brand accents');
  if (i === -1) { log.push(`${f}: accent block missing, skipped`); continue; }
  if (html.includes('/* --- GH global refinements --- */')) { log.push(`${f}: already applied, skipped`); continue; }
  html = html.replace('/* Gerald Holdings brand accents', `${GLOBAL_EXTRA}/* Gerald Holdings brand accents`);
  write(p, html);
  log.push(`${f}: global GH refinements added`);
}

/* index.html: closing CTA band becomes the GH purple moment */
{
  const p = path.join(ROOT, 'index.html');
  let html = read(p);
  const targets = [
    '<section class="py-16 bg-primary-navy text-white relative overflow-hidden border-t border-white/10">',
    '<section class="py-24 bg-primary-navy text-white relative overflow-hidden">'
  ];
  let done = false;
  for (const t of targets) {
    const last = html.lastIndexOf(t);
    if (last !== -1) {
      const cls = t.replace('<section class="', '').replace('">', '');
      html = html.slice(0, last)
        + t.replace('">', '" style="background:linear-gradient(135deg,#451468,#631E9F)">')
        + html.slice(last + t.length);
      log.push(`index.html: closing CTA band (class="${cls}") -> GH purple gradient`);
      done = true;
      break;
    }
  }
  if (!done) log.push('index.html: CTA band pattern not found!');
  write(p, html);
}

/* main.js: chat + HUD accents aligned to GH palette */
{
  const p = path.join(ROOT, 'js/main.js');
  let js = read(p);
  const before = js;
  js = js.split('bg-green-500 animate-pulse').join('bg-gh-green animate-pulse');
  js = js.split('text-cyan-600 dark:text-cyan-400').join('text-gh-blue-hover dark:text-gh-blue-bright');
  js = js.split('border border-cyan-500/30').join('border border-gh-blue/40');
  if (js !== before) { write(p, js); log.push('js/main.js: chat accents -> GH green/blue'); }
}

console.log(log.join('\n') || '(no changes)');