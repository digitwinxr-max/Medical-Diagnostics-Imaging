/**
 * Gerald Holdings brand migration codemod.
 * Applies the official four-colour GH brand system over the legacy
 * navy/cyan palette, swaps the Tailwind CDN runtime for the locally
 * built stylesheet bundle, and upgrades page <head> metadata.
 *
 * Every replacement is a fixed, reviewable mapping — no heuristics.
 * Run: node scripts/rebrand-codemod.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, c) => fs.writeFileSync(p, c);

/* ------------------------------------------------------------------ */
/* 1. Colour value migration map (legacy navy/cyan -> GH brand system) */
/* ------------------------------------------------------------------ */
const HEX_MAP = {
  '#062c5a': '#0A3D5C', // legacy primary-navy  -> GH blue deep surface
  '#021329': '#06202F', // legacy navy-dark     -> GH blue ink
  '#021124': '#04121C',
  '#020813': '#04121C',
  '#020e1e': '#05141F',
  '#030c19': '#05141F',
  '#041021': '#051A27',
  '#0d4c92': '#1088C8', // legacy secondary-blue -> GH BLUE (official)
  '#00c2ff': '#38B4E8', // legacy accent-cyan    -> GH blue bright tint
  '#0f172a': '#1F2933',
  '#64748b': '#667085',
  '#f8fafc': '#FAF9F5',
  '#f1f5f9': '#F3F1EA',
  '#94a3b8': '#9AA7B4',
  '#7ddfff': '#8ED4F2',
  '#86efac': '#CDE7AE',
  '#22c55e': '#81A54D', // generic green -> GH GREEN (official)
  '#34c759': '#81A54D',
  '#7eeaff': '#8ED4F2',
  '#e9f8ff': '#EAF4FB',
  '#b9eafa': '#C4E3F4',
  '#dce6f0': '#E3DFD6',
  '#f7f9fb': '#FAF9F5',
  '#102238': '#1F2933',
  '#5f7082': '#667085',
  '#dbe5ec': '#E5E1D8',
  '#c7d6df': '#D8D3C7',
  '#e8f5f8': '#F1F6E8',
  '#0ea5e9': '#1088C8',
  '#0284c7': '#0D6EA3',
  '#1a2e4a': '#0A3D5C',
  '#f0f7ff': '#EDF5FA',
  '#e8eef5': '#EDF5FA',
  '#1e293b': '#263543',
  '#334155': '#3A4A57'
};

const RGBA_MAP = [
  ['rgba(6, 44, 90', 'rgba(10, 61, 92'],
  ['rgba(6,44,90', 'rgba(10,61,92'],
  ['rgba(2, 19, 41', 'rgba(6, 32, 47'],
  ['rgba(2,19,41', 'rgba(6,32,47'],
  ['rgba(13, 76, 146', 'rgba(16, 136, 200'],
  ['rgba(13,76,146', 'rgba(16,136,200'],
  ['rgba(0, 194, 255', 'rgba(56, 180, 232'],
  ['rgba(0,194,255', 'rgba(56,180,232'],
  ['rgba(4, 16, 33', 'rgba(5, 26, 39'],
  ['rgba(4,16,33', 'rgba(5,26,39'],
  ['rgba(2, 15, 33', 'rgba(6, 32, 47'],
  ['rgba(2,15,33', 'rgba(6,32,47'],
  ['rgba(3, 12, 25', 'rgba(5, 21, 31'],
  ['rgba(3,12,25', 'rgba(5,21,31'],
  ['rgba(10, 25, 47', 'rgba(6, 32, 47'],
  ['rgba(10,25,47', 'rgba(6,32,47'],
  ['rgba(13, 30, 56', 'rgba(10, 61, 92'],
  ['rgba(13,30,56', 'rgba(10,61,92'],
  ['rgba(34, 197, 94', 'rgba(129, 165, 77'],
  ['rgba(34,197,94', 'rgba(129,165,77']
];

function applyColours(text) {
  let out = text;
  for (const [from, to] of RGBA_MAP) out = out.split(from).join(to);
  for (const [from, to] of Object.entries(HEX_MAP)) {
    const re = new RegExp(from.replace('#', '#') + '(?=[0-9a-fA-F]{0,2}[^0-9a-fA-F]|[0-9a-fA-F]{0,2}$)', 'gi');
    out = out.replace(re, (m) => {
      const alpha = m.length > 7 ? m.slice(7) : ''; // preserve 8-digit hex alpha suffix
      return to + alpha;
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 2. Shared GH brand accent layer appended to every page              */
/* ------------------------------------------------------------------ */
const GH_ACCENT_BASE = `
<style id="gh-brand-accent">
/* Gerald Holdings brand accents - GH Blue #1088C8 / GH Purple #631E9F / GH Gold #C5A531 / GH Green #81A54D */
::selection{background:#1088C8;color:#fff}
:focus-visible{outline:3px solid #1088C8 !important;outline-offset:2px}
.gh-skip-link{position:absolute;left:-9999px;top:0;z-index:10001;background:#0A3D5C;color:#fff;padding:10px 16px;border-radius:0 0 10px 0;font-weight:700;font-size:13px}
.gh-skip-link:focus{left:0}
#navbar nav a{position:relative}
#navbar nav a[aria-current="page"]{color:#C5A531 !important}
#navbar nav a[aria-current="page"]::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:#C5A531;border-radius:2px}
#mobile-menu a[aria-current="page"]{color:#C5A531 !important}
[data-gerald-form] input:focus,[data-gerald-form] select:focus,[data-gerald-form] textarea:focus{border-color:#1088C8 !important;box-shadow:0 0 0 3px rgba(16,136,200,.20) !important}
.form-status.is-success{background:rgba(129,165,77,.16) !important;border:1px solid rgba(129,165,77,.42) !important;color:#CDE7AE !important}
</style>
`;

/* ------------------------------------------------------------------ */
/* 3. SEO head metadata per page                                       */
/* ------------------------------------------------------------------ */
const SITE = 'https://www.geraldholdings.co.bw';
const OG_IMAGE = {
  'index.html': 'images/4k/hero-home-provided.jpg',
  'about.html': 'images/4k/about-capability-reception.jpg',
  'services.html': 'images/4k/mri-serene-provided.jpg',
  'patient.html': 'images/4k/ultrasound-care-provided.jpg',
  'doctor.html': 'images/4k/doctor-reporting-generated.jpg',
  'training.html': 'images/4k/radiologist-expertise.jpg',
  'blog.html': 'images/4k/reporting-premium.jpg',
  'contact.html': 'images/4k/pacs-room-client-final.jpg',
  'enterprise.html': 'images/pacs-room.jpg',
  'knowledge.html': 'images/infographics/01_Licensed_To_See_The_Unseen.png'
};

function seoBlock(file, { title, description }) {
  const img = OG_IMAGE[file];
  const pageUrl = `${SITE}/${file === 'index.html' ? '' : file}`;
  const lines = [
    `  <link rel="canonical" href="${pageUrl}"/>`,
    `  <meta property="og:url" content="${pageUrl}"/>`,
    `  <meta property="og:type" content="website"/>`,
    `  <meta property="og:site_name" content="Gerald Holdings Medical Diagnostic Imaging"/>`
  ];
  if (title) lines.push(`  <meta property="og:title" content="${title}"/>`);
  if (description) lines.push(`  <meta property="og:description" content="${description}"/>`);
  if (img) {
    lines.push(`  <meta property="og:image" content="${SITE}/${img}"/>`);
    lines.push(`  <meta name="twitter:card" content="summary_large_image"/>`);
  }
  return lines.join('\n');
}

const changed = [];
function note(file, what) { changed.push(`${file}: ${what}`); }

/* ------------------------------------------------------------------ */
/* 4. Per-page processing helpers                                      */
/* ------------------------------------------------------------------ */
const TW_PAGES = ['index.html', 'about.html', 'services.html', 'patient.html', 'doctor.html', 'training.html', 'blog.html', 'contact.html', 'knowledge.html'];

function stripTailwindCdn(html, file) {
  let out = html.replace(/<!--\s*Tailwind CSS CDN\s*-->\s*/i, '');
  const before = out;
  out = out.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/g, '');
  if (out !== before) note(file, 'removed Tailwind CDN script');
  const b2 = out;
  out = out.replace(/<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>\s*/g, '');
  if (out !== b2) note(file, 'removed inline tailwind.config block');
  return out;
}

function insertBundleCss(html, file) {
  if (html.includes('css/bundle.min.css')) return html; // idempotent
  const bundleTag = '  <link rel="stylesheet" href="css/bundle.min.css"/>\n';
  if (html.includes('href="css/style.css"')) {
    note(file, 'linked local css/bundle.min.css ahead of css/style.css');
    return html.replace('<link rel="stylesheet" href="css/style.css"/>', bundleTag + '  <link rel="stylesheet" href="css/style.css"/>');
  }
  const idx = html.indexOf('<style>');
  if (idx !== -1) {
    note(file, 'linked local css/bundle.min.css before page styles');
    return html.slice(0, idx) + bundleTag + html.slice(idx);
  }
  return html;
}

function addThemeColor(html, file) {
  if (/name="theme-color"/i.test(html)) return html;
  const out = html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n  <meta name="theme-color" content="#1088C8"/>`);
  if (out !== html) note(file, 'added theme-color #1088C8');
  return out;
}

function addSeo(html, file) {
  let out = html;
  const title = (out.match(/<title>([^<]*)<\/title>/i) || [])[1];
  const desc = (out.match(/<meta name="description" content="([^"]*)"/i) || [])[1];
  if (/rel="canonical"/i.test(out) || !OG_IMAGE[file]) return out;
  const existingOgTitle = /property="og:title"/i.test(out);
  const existingOgDesc = /property="og:description"/i.test(out);
  const block = seoBlock(file, {
    title: existingOgTitle ? null : title,
    description: existingOgDesc ? null : desc
  });
  if (out.includes('</title>')) {
    out = out.replace(/<\/title>/i, `</title>\n${block}`);
  } else {
    out = out.replace(/<link rel="icon"[^>]*>/i, (m) => `${m}\n${block}`);
  }
  note(file, 'added canonical + Open Graph + Twitter card metadata');
  return out;
}

function addSkipTarget(html, file) {
  let out = html;
  if (!out.includes('gh-skip-link')) {
    const target = file === 'index.html' ? '#home-hero' : '#main-content';
    out = out.replace(/(<body[^>]*>)/i, `$1\n  <a class="gh-skip-link" href="${target}">Skip to main content</a>`);
    note(file, `added skip-to-content link -> ${target}`);
  } else if (file === 'index.html' && /gh-skip-link" href="#main-content"/.test(out) && /id="home-hero"/.test(out)) {
    out = out.replace(/gh-skip-link" href="#main-content"/, 'gh-skip-link" href="#home-hero"');
    note(file, 'skip-to-content retargeted to #home-hero');
  }
  if (/<main[\s>]/i.test(out) && !/id="main-content"/i.test(out)) {
    out = out.replace(/<main(\s|>)/i, '<main id="main-content"$1');
    note(file, 'gave <main> id="main-content"');
  } else if (file === 'enterprise.html' && !/id="main-content"/i.test(out)) {
    const b = out;
    out = out.replace(/<section([^>]*class="hero(?:\s|")[^>]*)/i, '<section id="main-content"$1');
    if (out !== b) note(file, 'gave hero <section> id="main-content"');
  }
  return out;
}

function appendAccent(html, file, extra = '') {
  if (html.includes('id="gh-brand-accent"')) return html;
  const block = GH_ACCENT_BASE.replace('</style>', `${extra}</style>`);
  const out = html.replace(/<\/head>/i, `${block}\n</head>`);
  note(file, 'appended GH brand accent layer');
  return out;
}

/* ---------------- page-specific extras ---------------- */
const ENTERPRISE_EXTRA = `
.links a[aria-current="page"],.links a:hover{color:#C5A531}
.eyebrow{background:rgba(197,165,49,.13);border:1px solid rgba(197,165,49,.55);color:#EBD98B}
.cta{background:linear-gradient(135deg,#451468,#631E9F)}
.footer{border-top:3px solid #C5A531}
.card:hover{border-color:rgba(197,165,49,.55)}
.icon{background:#F1F6E8}
.num{color:#55702F}
`;
const KNOWLEDGE_EXTRA = `
.ig-eyebrow{color:#7A5F10}
.c-card:hover{border-color:rgba(197,165,49,.5)}
`;
const SUCCESS_EXTRA = `
.check{background:#F1F6E8;color:#55702F}
.primary{background:#0D6EA3;color:#fff}
.primary:hover{background:#1088C8}
`;

/* ---------------- main loop ---------------- */
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const file of files) {
  const p = path.join(ROOT, file);
  let html = read(p);
  const orig = html;

  if (TW_PAGES.includes(file)) html = stripTailwindCdn(html, file);
  if (TW_PAGES.includes(file)) html = insertBundleCss(html, file);
  html = addThemeColor(html, file);
  html = addSeo(html, file);

  if (file === 'knowledge.html') {
    const b = html;
    html = html.replace('rel="canonical" href="https://geraldholdings.com/knowledge.html"', `rel="canonical" href="${SITE}/knowledge.html"`);
    html = html.replace('property="og:url" content="https://geraldholdings.com/knowledge.html"', `property="og:url" content="${SITE}/knowledge.html"`);
    if (html !== b) note(file, 'fixed canonical/og domain to www.geraldholdings.co.bw');
    if (!/rel="icon"/i.test(html)) {
      html = html.replace(/<\/title>/i, `</title>\n  <link rel="icon" type="image/png" href="images/favicon.png"/>`);
      note(file, 'added favicon');
    }
    if (!/property="og:image"/i.test(html)) {
      html = html.replace(/(<meta property="og:type" content="website">)/i, `$1\n  <meta property="og:image" content="${SITE}/${OG_IMAGE[file]}"/>\n  <meta name="twitter:card" content="summary_large_image"/>`);
      note(file, 'added og:image + twitter:card');
    }
  }

  if (file === 'index.html') {
    const b = html;
    html = html.replace('"image": "https://www.geraldholdings.co.bw/images/hero-home-provided.jpg"', '"image": "https://www.geraldholdings.co.bw/images/4k/hero-home-provided.jpg"');
    if (html !== b) note(file, 'fixed JSON-LD image path to existing asset');
  }

  if (file === 'success.html' && !/name="robots"/i.test(html)) {
    html = html.replace(/<title>([^<]*)<\/title>/i, `<title>$1</title>\n<meta name="robots" content="noindex"/>`);
    note(file, 'added noindex for transactional page');
  }

  html = addSkipTarget(html, file);

  if (file === 'enterprise.html') html = appendAccent(html, file, ENTERPRISE_EXTRA);
  else if (file === 'knowledge.html') html = appendAccent(html, file, KNOWLEDGE_EXTRA);
  else if (file === 'success.html') html = appendAccent(html, file, SUCCESS_EXTRA);
  else html = appendAccent(html, file);

  html = applyColours(html);

  if (html !== orig) { write(p, html); note(file, 'colour system migrated'); }
}

/* ---------------- shared assets ---------------- */
for (const rel of ['css/style.css', 'css/input.css', 'js/main.js', 'js/translations.js']) {
  const p = path.join(ROOT, rel);
  const before = read(p);
  const after = applyColours(before);
  if (after !== before) { write(p, after); note(rel, 'colour system migrated'); }
}

/* server.js CSP: the Tailwind CDN is gone, so the CSP must not allow it */
{
  const p = path.join(ROOT, 'server.js');
  let s = read(p);
  const b = s;
  s = s.replace(/script-src 'self' 'unsafe-inline' https:\/\/cdn\.tailwindcss\.com;/, "script-src 'self' 'unsafe-inline';");
  if (s !== b) { note('server.js', 'removed cdn.tailwindcss.com from local CSP'); write(p, s); }
}

console.log(changed.join('\n'));
console.log(`\n${changed.length} operations applied.`);
