# Publish Medical Diagnostic Imaging on Netlify

The package is ready for static Netlify deployment and retains the local Node server for local or VPS hosting.

## Fast deployment

1. Extract `gerald-holdings-medical-imaging-site.zip`.
2. Sign in to Netlify and choose **Add new site → Deploy manually**.
3. Drag the extracted website folder into Netlify Drop.
4. Netlify reads `netlify.toml`, publishes the root folder, and discovers the five native forms.
5. In **Forms**, enable notifications for booking, referrals, CME registrations and newsletter submissions.
6. Connect the production domain and enforce HTTPS.

## Git deployment

- Build command: leave empty
- Publish directory: `.`
- Functions directory: `netlify/functions`

## Forms and backend

Production HTTPS submissions use Netlify Forms and appear in the Netlify dashboard. Forms include honeypot protection and accessible status messaging.

The `/api/forms` redirect points to `netlify/functions/forms.js` for API clients and Netlify Dev. Set `FORM_WEBHOOK_URL` in **Site configuration → Environment variables** if the serverless endpoint should forward validated records into an approved CRM or clinical workflow.

The original dependency-free `server.js` remains available for local/VPS deployment:

```bash
npm start
```

## Launch checklist

- Configure form notification recipients.
- Add `FORM_WEBHOOK_URL` only if an approved secure workflow is available.
- Review privacy, consent, retention and access policies.
- Confirm the Google Map and custom domain over HTTPS.
- Perform a booking, referral and CME test after deployment.
- Never expose exported submissions publicly.
