# Security Incident Response

## Severity and ownership

- **SEV-1:** confirmed account/tenant takeover, exposed secrets, payment manipulation, destructive data loss. Security lead and product owner respond immediately.
- **SEV-2:** suspected unauthorized access, refresh-token replay, audit integrity failure, widespread abuse. Respond within one hour.
- **SEV-3:** contained vulnerability or limited suspicious activity. Respond within one business day.

## Procedure

1. Open an incident record with UTC timestamps, reporter, systems and request IDs. Do not paste secrets or personal data into chat/tickets.
2. Preserve Render/Vercel/Atlas/Cloudflare logs and a database snapshot. Record hashes and access to evidence.
3. Contain: revoke affected sessions, disable compromised users/integrations, block abusive sources and pause risky bulk operations.
4. Eradicate: patch the root cause, rotate affected credentials using the rotation runbook, and review tenant boundaries.
5. Recover in stages. Verify audit integrity, headers, security tests and critical fee/attendance flows before full traffic.
6. Notify affected users and regulators according to applicable contracts and law; legal counsel decides deadlines and wording.
7. Complete a blameless post-incident report with root cause, impact, timeline and tracked corrective actions.

Never delete evidence, test destructively on production, or announce an unverified impact estimate.
