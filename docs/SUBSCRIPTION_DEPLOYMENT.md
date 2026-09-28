# Academy Manager modular subscriptions

## Production deployment order

1. Back up MongoDB and verify a restore point.
2. Deploy the backend code without routing user traffic to it yet.
3. Run `npm run migrate:multi-academy` once from `backend`.
4. Run `npm run billing:seed-catalog` from `backend` whenever the catalogue defaults are intentionally updated.
5. Confirm Razorpay keys and webhook secret are present in the backend environment.
6. Configure the Razorpay `payment.captured` webhook at `/api/billing/webhook/razorpay`.
7. Deploy the frontend and run smoke checks before enabling traffic.

Both migration commands are idempotent. Never copy `.env`, uploads, `node_modules`, or `dist` from this deliverable into production.

## Catalogue

- Free: 1 academy, 1 branch, 100 retained students, 3 batches, 5 lifetime trial exports per document type.
- Academy Base: INR 299/month and 500 retained students.
- Additional 500 students: INR 100/month per unit.
- Additional academy (one primary branch included): INR 1,000/month per unit.
- Additional branch: INR 300/month per unit.
- ID Card Studio: INR 1,000/month; 5,000 successful exports per UTC calendar month.
- Certificate Studio: INR 1,000/month; 5,000 successful exports per UTC calendar month.
- Document Studio Bundle: INR 1,699/month.

## Security invariants

- The browser never activates access. Only a captured Razorpay payment with a verified callback signature or webhook can do so.
- Every order uses a unique idempotency key; repeated callbacks return the existing result.
- Prices are read from the server-side versioned catalogue. Existing entitlements retain their recorded unit price/version.
- Academy owners can only select academies they own. Superadmins may select any academy, and mutation middleware records privileged writes.
- Active, inactive, and paused students count toward capacity. Only records with status `left` are excluded by the current retained-student rule.
- Expired capacity never deletes data. It blocks additional writes while records remain available.

## Required smoke checks

- Free academy can create students 1–100; student 101 is blocked.
- One student-capacity unit raises the effective limit to 600 on Free.
- First branch succeeds; second branch requires one branch entitlement.
- Second academy requires one account-scoped academy entitlement.
- ID/certificate trials stop after five lifetime generated records.
- Studio access uses the monthly fair-use counter.
- Switching academy changes the `X-Academy-Id` header and never exposes another owner's academy.
- Payment replay does not create a second entitlement or invoice.
- Superadmin grant and revoke actions appear in audit records.
