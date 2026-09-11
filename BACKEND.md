# Gerald Holdings website backend

The website includes a dependency-free Node.js backend for secure form intake.

## Run locally

```bash
npm start
```

Open `http://localhost:8080`.

## Forms connected

- Homepage appointment form
- Contact-page booking form
- Referring-doctor referral form
- CME registration form
- Clinical Pulse newsletter form

All forms submit to `POST /api/forms`. Submissions are validated, rate-limited, protected by a honeypot and saved as newline-delimited JSON in `data/submissions.ndjson` with restrictive file permissions.

> `data/submissions.ndjson` may contain personal and clinical information. Do not commit, email, or expose it publicly. Restrict access to authorised personnel, define a retention period, and deploy behind HTTPS.

## Production configuration

Environment variables:

- `PORT` — HTTP port; defaults to `8080`
- `IP_HASH_SALT` — private random value used when hashing source IPs
- `FORM_WEBHOOK_URL` — optional HTTPS workflow endpoint receiving validated submissions

Example:

```bash
PORT=8080 IP_HASH_SALT='replace-with-a-long-random-secret' npm start
```

Recommended production controls:

1. Terminate TLS/HTTPS at a trusted reverse proxy.
2. Add authenticated staff access or route submissions into an approved clinical CRM/workflow.
3. Encrypt stored data and backups; restrict filesystem permissions.
4. Establish consent, access, retention and deletion procedures.
5. Replace in-memory rate limiting with a shared store when deploying multiple instances.
6. Review the security headers and privacy wording with legal/clinical governance before launch.

## Health check

Request the homepage:

```bash
curl -I http://localhost:8080/
```

Test a newsletter submission:

```bash
curl -sS http://localhost:8080/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"formType":"newsletter","email":"test@example.com","website":""}'
```
