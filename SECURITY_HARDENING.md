# KHILADI Security Hardening Deployment

## Required production secrets

Create independent random values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`INTEGRATION_ENCRYPTION_KEY`, and `DATA_ENCRYPTION_KEY`. Never reuse or commit
them. Changing either encryption key after data is written makes the associated
encrypted values unreadable, so keep them in the deployment secret manager.

Set `TRUST_PROXY=1` only when exactly one trusted reverse proxy sits in front of
the API. Configure `TOURNAMENT_API_ALLOWED_ORIGINS` as exact HTTPS origins.

## One-time migration

Back up MongoDB, deploy the new secrets, then run:

```powershell
cd backend
npm ci
npm run security:migrate-sensitive-data
cd ..
```

This encrypts existing Aadhaar and medical fields and replaces the legacy
Aadhaar index with the keyed lookup index.

## Tournament integration rotation

Existing integrations contain only the old hash and cannot verify a webhook
correctly. Regenerate each integration's credentials once and update Tournament
Manager. Each webhook must include:

- `x-academy-id`: academy ObjectId
- `x-khiladi-event-id`: unique immutable event ID
- `x-khiladi-timestamp`: Unix time in milliseconds, no older/newer than 5 minutes
- `x-khiladi-signature`: lowercase hexadecimal HMAC-SHA256

The signed bytes are exactly:

```text
<timestamp>.<eventId>.<raw HTTP request body bytes>
```

The API rejects duplicate event IDs and old timestamps.

## Repository cleanup

Run from the repository root after extracting the updated code:

```powershell
git rm -r --cached --ignore-unmatch backend/node_modules
git rm -r --ignore-unmatch backend/uploads
New-Item -ItemType Directory -Force backend/uploads | Out-Null
New-Item -ItemType File -Force backend/uploads/.gitkeep | Out-Null
git rm --cached --ignore-unmatch *.zip
git rm --ignore-unmatch backend/src/nnn.txt
git add -A
```

The removed upload files contained real/private data. Purge them from Git
history before publishing the repository, and rotate any credential that has
ever been committed.

## Verification

```powershell
cd backend
npm ci
npm audit --omit=dev
cd ../frontend
npm ci
npm run build
npm audit --omit=dev
cd ..
git status --short
```

Dependency advisories without an upstream fix still require monitoring. In
particular, replace the npm `xlsx` package with a maintained SheetJS distribution
or another workbook library before treating untrusted workbooks as fully safe.
