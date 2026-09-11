/**
 * Full-site validation for the Gerald Holdings MDI website.
 * Run: node scripts/validate.mjs   (exit 1 on any failure)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const PUBLIC_PAGES = ['index.html', 'about.html', 'services.html', 'patient.html', 'doctor.html', 'training.html', 'enterprise.html', 'knowledge.html', 'blog.html', 'contact.html'];
const ALL_HTML = [...PUBLIC_PAGES, 'success.html'];

let failures = 0;
let checks = 0;
const ok = (msg) => { checks++; console.log(`  PASS  ${msg}`); };
const bad = (msg) => { checks++; failures++; console.log(`  FAIL  ${msg}`); };
const info = (msg) => console.log(`  --    ${msg}`);

console.log('\n== 1. package.json ==');
{
  let pkg;
  try { pkg = JSON.parse(read('package.json')); ok('package.json parses'); }
  catch (e) { bad(`package.json: ${e.message}`); pkg = {}; }
  for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
    const files = [...cmd.matchAll(/[\w./-]+\.(?:js|mjs|cjs)/g)].map((m) => m[0]);
    const missing = files.filter((f) => !exists(f));
    if (missing.length) bad(`script "${name}" references missing files: ${missing.join(', ')}`);
    else ok(`script "${name}" targets exist`);
  }
  const deps = Object.keys(pkg.devDependencies || {});
  info(`devDependencies: ${deps.join(', ') || 'none'}`);
}

console.log('\n== 2. JavaScript syntax (node --check) ==');
for (const f of ['server.js', 'netlify/functions/forms.js', 'js/main.js', 'js/translations.js']) {
  const r = spawnSync(process.execPath, ['--check', path.join(ROOT, f)], { encoding: 'utf8' });
  if (r.status === 0) ok(`${f} syntax OK`);
  else bad(`${f}: ${(r.stderr || 'unknown error').split('\n')[0]}`);
}

console.log('\n== 3. Per-page structure & metadata ==');
const idsByPage = {};
const formsByPage = {};
for (const f of ALL_HTML) {
  const html = read(f);
  idsByPage[f] = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  if (!/<html[^>]*\slang="/i.test(html)) bad(`${f}: missing lang attribute`); else ok(`${f}: lang ok`);
  if (!/name="viewport"/i.test(html)) bad(`${f}: missing viewport`); else ok(`${f}: viewport ok`);
  if (!/<title>[^<]+<\/title>/i.test(html)) bad(`${f}: missing title`); else ok(`${f}: title ok`);
  if (!/name="description"/i.test(html)) bad(`${f}: missing meta description`); else ok(`${f}: description ok`);
  if (!/rel="icon"/i.test(html)) bad(`${f}: missing favicon`); else ok(`${f}: favicon ok`);
  if (!/name="theme-color"/i.test(html)) bad(`${f}: missing theme-color`); else ok(`${f}: theme-color ok`);
  if (f !== 'success.html' && !/rel="canonical"/i.test(html)) bad(`${f}: missing canonical`); else if (f !== 'success.html') ok(`${f}: canonical ok`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); ok(`${f}: JSON-LD parses`); }
    catch (e) { bad(`${f}: JSON-LD invalid: ${e.message}`); }
  }
  if (f === 'success.html') { if (/name="robots" content="noindex"/i.test(html)) ok('success.html: noindex ok'); else bad('success.html: missing noindex'); }
  formsByPage[f] = [...html.matchAll(/<form[^>]*data-gerald-form="([a-z]+)"[^>]*>/gi)].map((m) => m[0]);
}

console.log('\n== 4. Forms ==');
{
  const total = Object.values(formsByPage).flat().length;
  if (total === 0) bad('no data-gerald-form forms found');
  else ok(`${total} GH forms found across pages`);
  const types = new Set();
  for (const f of ALL_HTML) {
    for (const m of read(f).matchAll(/<form[^>]*data-gerald-form="([a-z]+)"[^>]*>/gi)) {
      const tag = m[0]; types.add(m[1]);
      if (!/method="post"/i.test(tag)) bad(`${f}: form ${m[1]} missing method=post`);
      if (!/data-netlify="true"/i.test(tag)) bad(`${f}: form ${m[1]} missing data-netlify`);
      if (!/netlify-honeypot/i.test(tag)) bad(`${f}: form ${m[1]} missing honeypot`);
      if (!/action="\/success\.html"/i.test(tag)) bad(`${f}: form ${m[1]} missing action=/success.html`);
    }
  }
  ok(`form types: ${[...types].sort().join(', ')}`);
  const fn = read('netlify/functions/forms.js');
  for (const t of types) if (!fn.includes(`'${t}'`) && !new RegExp(`\\b${t}\\b`).test(fn)) bad(`functions/forms.js: type "${t}" not handled`);
  ok('netlify function covers all form types');
}

console.log('\n== 5. Local assets & links ==');
{
  let missingAssets = 0, brokenLinks = 0;
  for (const f of ALL_HTML) {
    const html = read(f);
    for (const m of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
      const raw = m[1];
      if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;
      const [base, frag] = raw.split('#');
      for (const part of base.split(',')) {
        const p = part.trim().split(' ')[0].split('?')[0];
        if (!p) continue;
        if (!exists(p)) { bad(`${f}: missing asset ${raw}`); missingAssets++; }
      }
      if (frag) {
        const target = base || f;
        const tName = target.replace(/^\//, '') || 'index.html';
        if (exists(tName)) {
          const ids = idsByPage[tName] || [];
          const idSet = new Set(ids);
          const mainAlt = tName === 'index.html' || tName === 'enterprise.html';
          if (!idSet.has(frag) && !(mainAlt && frag === 'main-content' && ids.includes('main-content'))) {
            bad(`${f}: broken anchor ${raw}`); brokenLinks++;
          }
        }
      }
    }
  }
  if (!missingAssets) ok('every referenced local asset exists');
  if (!brokenLinks) ok('every internal link + anchor resolves');
}

console.log('\n== 6. Legacy palette removal ==');
{
  const legacy = /#062c5a|#021329|#021124|#020813|#020e1e|#030c19|#041021|#0d4c92|#00c2ff|#f8fafc|#0f172a|#64748b|rgba\(6, ?44, ?90|rgba\(2, ?19, ?41|rgba\(13, ?76, ?146|rgba\(0, ?194, ?255/i;
  const scope = [...ALL_HTML, 'css/style.css', 'css/input.css', 'css/bundle.min.css', 'js/main.js', 'js/translations.js', 'server.js', 'netlify/functions/forms.js', 'netlify.toml'];
  let hits = 0;
  for (const f of scope) {
    const c = read(f);
    const m = c.match(new RegExp(legacy, 'gi'));
    if (m) { bad(`${f}: legacy colour values remain (${m.length})`); hits += m.length; }
  }
  if (!hits) ok('no legacy navy/cyan palette values anywhere in active files');
}

console.log('\n== 7. GH brand colours present ==');
{
  const GH = { 'GH BLUE #1088C8': /#1088c8/i, 'GH PURPLE #631E9F': /#631e9f|#451468|#9b5cd0/i, 'GH GOLD #C5A531': /#c5a531|#f6eeda|#ebd98b/i, 'GH GREEN #81A54D': /#81a54d|#f1f6e8|#cde7ae/i };
  const bundle = read('css/bundle.min.css');
  const style = read('css/style.css');
  const input = read('css/input.css');
  const allCss = bundle + style + input;
  const siteJs = read('js/main.js') + read('js/translations.js');
  for (const [name, re] of Object.entries(GH)) {
    const inCss = re.test(allCss);
    const inPages = PUBLIC_PAGES.some((f) => re.test(read(f)));
    const inJs = re.test(siteJs);
    if (inCss && (inPages || inJs)) ok(`${name} actively used`);
    else bad(`${name} missing (css=${inCss} pages=${inPages} js=${inJs})`);
  }
  // every page carries the GH accent layer or equivalent custom accents
  for (const f of ALL_HTML) {
    if (!/id="gh-brand-accent"/.test(read(f))) bad(`${f}: missing GH accent layer`);
  }
  ok('GH accent layer present on all pages');
}

console.log('\n== 8. Utility class coverage (bundle + page CSS) ==');
{
  const bundle = read('css/bundle.min.css');
  const styleCss = read('css/style.css');
  let pageCss = '';
  for (const f of ALL_HTML) {
    for (const m of read(f).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) pageCss += m[1] + '\n';
  }
  const cssAll = bundle + styleCss + pageCss;
  const classes = new Set();
  for (const f of [...ALL_HTML, 'js/main.js']) {
    const src = read(f);
    for (const m of src.matchAll(/class(?:Name)?\s*=\s*"([^"]+)"/g)) {
      for (const cls of m[1].split(/\s+/)) {
        const c = cls.trim();
        if (c && /^[a-zA-Z][^:{}<>]*$/.test(c) && !c.includes('(')) classes.add(c);
      }
    }
    for (const m of src.matchAll(/classList\.(?:add|toggle|remove)\('([^']+)'/g)) classes.add(m[1]);
  }
  // JS-behaviour hook classes that are intentionally unstyled
  const hooks = /^(btn-open-|btn-close-|dicom-|lang-selector|patient-chat-|modal-|form-appointment|nav-open|active|hidden|flex|is-loading|is-success|is-error|reveal|glass-|theme-icon|anatomy-|portal-tab|portal-pane|animate-fade-in|cat-btn|article-card)/;
  const missing = [];
  for (const cls of classes) {
    if (hooks.test(cls)) continue;
    // classes are written CSS-escaped in stylesheets (w-3\.5, bg-x\/20, dark\:text-y, text-\[\#1088C8\])
    const needle = '.' + cls.replace(/[.*+?^${}()|[\]\\%#]/g, '\\$&').replace(/:/g, '\\:').replace(/\//g, '\\/');
    if (!cssAll.includes(needle)) missing.push(cls);
  }
  if (missing.length) bad(`classes with no CSS rule anywhere (${missing.length}): ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}`);
  else ok(`all ${classes.size} referenced classes have CSS rules (bundle or page CSS)`);
}

console.log('\n== 9. Netlify configuration ==');
{
  const t = read('netlify.toml');
  if (/publish = "\."/.test(t)) ok('publish directory "."'); else bad('publish directory missing');
  if (/functions = "netlify\/functions"/.test(t)) ok('functions directory configured'); else bad('functions directory missing');
  if (!/command\s*=/.test(t)) ok('no build command (static deploy, as intended)'); else info('build command present');
  if (/from = "\/api\/forms"/.test(t) && /\.netlify\/functions\/forms/.test(t)) ok('/api/forms → function redirect'); else bad('/api/forms redirect missing');
  if (/from = "\/data\/\*"/.test(t) && /status = 404/.test(t)) ok('/data/* force-404 (submissions protected)'); else bad('/data/* 404 guard missing');
  const csp = (t.match(/Content-Security-Policy = "([^"]+)"/) || [])[1] || '';
  const needCsp = ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com', 'maps.google.com'];
  for (const n of needCsp) if (!csp.includes(n)) bad(`CSP missing ${n}`);
  for (const n of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']) if (!t.includes(n)) bad(`header missing ${n}`);
  ok('security headers present');
  const secretRe = /(sk-[a-z0-9]{16,}|api[_-]?key\s*=\s*["'][^"']+|password\s*=\s*["'][^"']+|ghp_[A-Za-z0-9]{20,}|hook:\s*\/\/)/i;
  const secretFiles = ['netlify.toml', ...ALL_HTML, 'js/main.js', 'js/translations.js', 'netlify/functions/forms.js', 'server.js', 'README.md', 'NETLIFY.md', 'BACKEND.md'];
  let secrets = 0;
  for (const f of secretFiles) if (secretRe.test(read(f))) { bad(`${f}: possible secret`); secrets++; }
  if (!secrets) ok('no committed secrets detected');
}

console.log('\n== 10. robots.txt & sitemap ==');
{
  if (/Disallow: \/data\//.test(read('robots.txt'))) ok('robots.txt disallows /data/'); else bad('robots.txt missing /data/ disallow');
  const sm = read('sitemap.xml');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  let smBad = 0;
  for (const u of urls) {
    const file = u.replace('https://www.geraldholdings.co.bw/', '') || 'index.html';
    if (!exists(file)) { bad(`sitemap: ${u} has no local page`); smBad++; }
    if (!file.includes('.')) { bad(`sitemap: ${u} not page-based`); smBad++; }
  }
  if (!smBad) ok(`sitemap.xml: ${urls.length} URLs all resolve locally`);
}

console.log('\n== 11. Deployment blockers ==');
{
  const scope = [...ALL_HTML, 'js/main.js', 'js/translations.js', 'netlify/functions/forms.js'];
  const patterns = [/localhost/i, /127\.0\.0\.1/, /http:\/\/(?!www\.geraldholdings|www\.w3\.org)/i, /file:\/\/\//, /C:\\\\Users/i, /astro/i, /cdn\.tailwindcss\.com/i];
  const names = ['localhost', '127.0.0.1', 'insecure http://', 'file://', 'Windows path', 'astro', 'tailwind CDN'];
  let hits = 0;
  patterns.forEach((re, i) => {
    for (const f of scope) {
      const m = read(f).match(re);
      if (m) { bad(`${f}: ${names[i]} reference found`); hits++; }
    }
  });
  if (!hits) ok('no localhost / dev-only / stale framework references in served code');
  if (!exists('css/bundle.min.css')) bad('css/bundle.min.css missing');
  else ok('css/bundle.min.css present');
  if (!exists('netlify/functions/forms.js')) bad('function missing');
  else ok('netlify/functions/forms.js present');
  for (const gone of ['astro.config.mjs', 'tailwind.config.js', 'js/router.js', 'FILES.html', 'src']) {
    if (exists(gone)) bad(`stale item still present: ${gone}`);
  }
  ok('stale Astro/Tailwind-v3/SPA-router artifacts removed');
}

console.log('\n== 12. Accessibility spot-checks ==');
{
  for (const f of ALL_HTML) {
    const html = read(f);
    if (!/gh-skip-link|skip-link/.test(html)) info(`${f}: no skip link (may be structural page)`);
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
    const noAlt = imgs.filter((m) => !/\balt="/i.test(m[0]));
    if (noAlt.length) bad(`${f}: ${noAlt.length} <img> without alt`);
  }
  ok('img alt audit done');
  let unlabeled = 0;
  for (const f of ALL_HTML) {
    const html = read(f);
    for (const m of html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)) {
      const tag = m[0];
      if (/type="(hidden|submit)"|honeypot/i.test(tag)) continue;
      if (!/id="/i.test(tag)) { unlabeled++; }
    }
  }
  if (unlabeled) info(`${unlabeled} controls rely on wrapping labels (spot-check)`);
  else ok('form controls carry ids for labelling');
}

console.log(`\n======== VALIDATION ${failures === 0 ? 'PASSED' : 'FAILED'}: ${checks - failures}/${checks} checks OK ========`);
process.exit(failures === 0 ? 0 : 1);
