# Authorized Penetration Test Scope

No external test is authorized merely by this document. The system owner must sign a rules-of-engagement record containing target URLs/IPs, dates, tester identities, emergency contacts and written authorization.

## Recommended coverage

- OWASP API Security Top 10: tenant IDOR/BOLA, broken authentication, property authorization, resource limits, SSRF, inventory and unsafe API consumption.
- MFA enrollment/recovery, refresh replay, step-up tokens and password reset.
- Assistant-coach branch escape and owner-only imports, fee repair and bulk deletion.
- Upload validation, private media authorization, webhook replay/signatures and public enquiry abuse.

## Prohibited without separate approval

Denial of service, destructive deletion, fee/payment mutation, real-user phishing, malware, cloud control-plane attacks, persistence, bulk personal-data extraction and testing third-party services.

Use dedicated test accounts and synthetic data. Rate-limit automation, attach a unique test header, stop on instability or unintended data access, and report evidence through an encrypted channel. Critical findings must be reported immediately, then retested after remediation.

The local smoke command is:

```powershell
$env:SECURITY_TEST_BASE_URL="http://localhost:5000"
npm run security:owasp-smoke
```

Remote execution additionally requires `SECURITY_TEST_AUTHORIZED=true` and written authorization.
