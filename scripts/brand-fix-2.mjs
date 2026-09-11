/**
 * Context-aware GH colour-role pass (FIXED: preserves all structural tags).
 * - On LIGHT page segments: cyan text -> AA-safe GH blue labels; cyan eyebrow
 *   pills -> GH gold pills; Tailwind green status pill -> GH green.
 * - On DARK segments (hero/nav/footer/premium): bright GH blue accents kept.
 * Segment boundaries are the page's <section>/<nav>/<header>/<footer>/<aside>
 * tags, and every tag is re-emitted verbatim (previous version dropped them).
 * Run: node scripts/brand-fix-2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TW = ['index.html', 'about.html', 'services.html', 'patient.html', 'doctor.html', 'training.html', 'blog.html', 'contact.html'];

const DARK_HINTS = ['bg-primary-navy', 'immersive-hero', 'pacs-workspace', 'glass-nav', 'bg-slate-900', 'bg-slate-800', 'gerald-nav', 'medical-artifact', 'pacs-hud', 'premium-dark', 'bg-gh-blue-ink'];

function isDarkTag(tag) {
  if (/^<(nav|header|footer)\b/i.test(tag)) return true;
  // ignore dark: modifier variants (bg-white dark:bg-slate-900 is a LIGHT section)
  const cls = tag.replace(/dark:[a-zA-Z0-9/_.\-%]+/g, ' ').toLowerCase();
  return DARK_HINTS.some((h) => cls.includes(h.toLowerCase()));
}

function processSegment(seg) {
  let t = seg.text;
  const c = { pill: 0, label: 0, hover: 0, green: 0 };
  if (!seg.dark) {
    const before = t;
    t = t.split('bg-accent-cyan/20 text-accent-cyan text-xs font-800 uppercase tracking-widest border border-accent-cyan/40')
      .join('bg-gh-gold/15 text-gh-gold-text dark:text-gh-gold text-xs font-800 uppercase tracking-widest border border-gh-gold/40');
    if (t !== before) c.pill++;
    const b2 = t;
    t = t.split('bg-accent-cyan/20 border border-accent-cyan/40')
      .join('bg-gh-gold/15 text-gh-gold-text dark:text-gh-gold border border-gh-gold/40');
    if (t !== b2) c.pill++;
    const b3 = t;
    t = t.split('bg-green-500/20 text-green-600 dark:text-green-400').join('bg-gh-green/20 text-gh-green-text dark:text-gh-green');
    if (t !== b3) c.green++;
    t = t.replace(/(?<![\w-])text-accent-cyan(?![\w-])/g, () => { c.label++; return 'text-gh-blue-hover dark:text-gh-blue-bright'; });
    t = t.replace(/hover:text-accent-cyan(?![\w-])/g, () => { c.hover++; return 'hover:text-gh-blue-hover dark:hover:text-gh-blue-bright'; });
  }
  return { text: t, counts: c };
}

const log = [];
for (const f of TW) {
  const p = path.join(ROOT, f);
  const html = fs.readFileSync(p, 'utf8');
  const re = /<\/?(?:section|nav|header|footer|aside)\b[^>]*>/gi;
  const totals = { pill: 0, label: 0, hover: 0, green: 0 };
  let dark = false;
  let idx = 0;
  let out = '';
  let m;
  while ((m = re.exec(html))) {
    const segText = html.slice(idx, m.index);
    const r = processSegment({ text: segText, dark });
    out += r.text;
    for (const k of Object.keys(totals)) totals[k] += r.counts[k];
    // update context, then ALWAYS re-emit the structural tag
    if (m[0].startsWith('</')) dark = false;
    else dark = isDarkTag(m[0]);
    out += m[0];
    idx = re.lastIndex;
  }
  const tail = processSegment({ text: html.slice(idx), dark });
  out += tail.text;
  for (const k of Object.keys(totals)) totals[k] += tail.counts[k];
  fs.writeFileSync(p, out);
  log.push(`${f}: gold-pills=${totals.pill} labels->AA-blue=${totals.label} hover=${totals.hover} green-status=${totals.green}`);
}
console.log(log.join('\n'));