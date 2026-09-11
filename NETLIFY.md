# Publish Medical Diagnostic Imaging on Netlify

The site is a static multi-page repository with one Netlify Function and
deploys without a build step: `css/bundle.min.css` is prebuilt from
`css/input.css` (`npm run css:build`) and committed.

## Git deployment (recommended)

1. Connect the repository in Netlify (**Add new site → Import from Git**).
2. Netlify reads `netlify.toml`: publish directory `.` (empty build
   command) and functions directory `netlify/functions`.
3. In **Forms**, enable notifications for booking, referrals, CME,
   enterprise, newsletter and contact submissions.
4. Set `FORM_WEBHOOK_URL` in **Site configuration → Environment
   variables** only if a serverless endpoint should forward validated
   records into an approved CRM or clinical workflow.
5. Connect the production domain and enforce HTTPS.

## Forms and backend

Production HTTPS submissions use Netlify Forms and appear in the Netlify
dashboard. Forms include honeypot protection and accessible status
messaging. The `/api/forms` redirect points to `netlify/functions/forms.js`
for API clients and Netlify Dev.

The dependency-free `server.js` remains available for local/VPS hosting
(`npm start`, port 8080). It writes submissions to `data/submissions.ndjson`
outside the public site, and `netlify.toml` force-404s `/data/*`.

## Security

`netlify.toml` ships nosniff, referrer, frame, permissions-policy headers
and a CSP permitting only: self-hosted assets, inline styles/scripts
(inline page styles and the form handler), Google Fonts, and Google Maps
frames. Never put credentials in source, `netlify.toml`, HTML or docs —
use Netlify environment variables.

## Launch checklist

- Configure form notification recipients.
- Add `FORM_WEBHOOK_URL` only if an approved secure workflow is available.
- Review privacy, consent, retention and access policies.
- Confirm the Google Map and custom domain over HTTPS.
- Perform a booking, referral and CME test after deployment.
- Never expose exported submissions publicly.

