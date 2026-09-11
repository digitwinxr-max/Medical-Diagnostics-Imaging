# Gerald Holdings — Medical Diagnostic Imaging Website

Public-facing website for Gerald Holdings Medical Diagnostic Imaging
(Gaborone, Botswana). A static multi-page site with one Netlify Function
for JSON form intake. No framework, no runtime build, no database.

## Brand system

The site uses the official four-colour Gerald Holdings palette, declared
centrally in `css/style.css` (`--gh-*` tokens) and `css/input.css`
(Tailwind v4 `@theme`):

| Role      | Colour    | HEX       | Applied to                                        |
| --------- | --------- | --------- | ------------------------------------------------- |
| Corporate | GH Blue   | `#1088C8` | nav, primary buttons, links, controls, icons      |
| Clinical  | GH Purple | `#631E9F` | hero partner accents, closing CTA band            |
| Premium   | GH Gold   | `#C5A531` | eyebrow pills, active-nav indicator, section rules, badges |
| Healthcare| GH Green  | `#81A54D` | success/status elements, support accents          |

Supporting neutrals: ivory `#FAF9F5`, charcoal `#1F2933`, muted `#667085`.
Legacy utility class names (`bg-primary-navy`, `text-accent-cyan`, …) are
aliased in `css/input.css` to GH brand values so existing markup renders
on-brand without mass renames.

## Repository layout

- `*.html` — the public pages (index, about, services, patient, doctor,
  training, enterprise, knowledge, blog, contact, success)
- `css/style.css` — central GH design system (tokens + components + a11y)
- `css/input.css` — Tailwind v4 source (theme + design system)
- `css/bundle.min.css` — prebuilt utility bundle (committed; rebuilt with
  `npm run css:build` whenever markup gains new utility classes)
- `js/main.js` — nav, dark mode, modals, DICOM simulator, chat
- `js/translations.js` — language selector
- `netlify/functions/forms.js` — JSON form API (`POST /api/forms`)
- `server.js` — dependency-free local/VPS server (not used by Netlify)
- `scripts/` — brand migration, anchor-repair and validation scripts (see
  `rebrand-codemod.mjs` for the colour mapping, `validate.mjs` for checks)
- `netlify.toml` — publish/functions, redirects, security headers, CSP

## Forms

Booking, referral, CME, enterprise, newsletter and contact forms are
Netlify Forms in production (honeypot protected) and also available as
JSON via `POST /api/forms` → `netlify/functions/forms.js`. Set the
optional `FORM_WEBHOOK_URL` environment variable in the Netlify
dashboard to forward validated records to an approved workflow. Never
commit webhook URLs or submission data.

## Local development

```bash
npm install
npm start          # http://localhost:8080
npm run css:build  # rebuild css/bundle.min.css after markup/class changes
npm run check      # syntax-check all JavaScript
npm run validate   # full site validation (links, assets, colours, forms…)
```

## Deployment (Netlify)

Git-based: connect the repository, build command **empty**, publish
directory `.` (configured in `netlify.toml`). See `NETLIFY.md` for the
launch checklist (form notifications, optional webhook, domain, HTTPS).
