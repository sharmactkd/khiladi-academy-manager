# Fee collection and correction update (v18)

Based on GitHub main commit a7d489614158666cbd1463c2ac7c8343885e3369.

## Changes

- Two months at 800, total discount 200 and payment 1400 allocate as 800 gross / 100 discount / 700 paid for each month.
- Collection arithmetic uses integer cents, including cash/online splits and year rollover.
- Already-paid periods reject a fresh duplicate collection instead of silently inflating their amount. Partial top-ups are limited to the remaining monthly balance. Choose unpaid periods for a new collection.
- Transaction retries reset in-memory results; idempotent retries are checked against the original request fingerprint.
- Cancelled monthly ledgers can receive a replacement collection without violating the unique monthly index. Reversed installments stay in history.
- Collection requests allow Render cold-start time; fee configuration finishes before submission.
- Returning to Attendance fetches current values. Other open tabs refresh on focus/payment-change signals while unsaved attendance is protected.
- Real payment updates clear stale manual display overrides and take precedence over imported current-month fee metadata. Historical imports are preserved.
- Payment History pencil opens Edit Fee Payment: amount, discount, paid total, payment mode, split, payment date, due date and notes. Student/period/receipt identity stays fixed.
- Corrections retain the previous ledger and installment values. Monthly total corrections no longer add the total to earlier installments. Income updates in the same transaction; unchanged paid status preserves the membership anchor.
- Background integrity updates require the observed record timestamp so a stale background read cannot overwrite a newer collection/edit.

## Existing incorrect entries

This bundle does not rewrite production data. Before correcting the reported 800 / 2200 records, review prior receipts/installments to distinguish an earlier legitimate payment from duplication. For a genuinely new two-month 1400 collection, each monthly ledger should show amount 800, discount 100 and paid 700. Payment History -> pencil edits one monthly ledger at a time.

## Validation

Backend npm test, frontend npm test and Vite production build pass locally. Fee regressions exercise actual Mongoose validation and the collection service with a deterministic repository stub. These checks do not connect to production MongoDB or prove live deployment health.

## Install

Extract into the existing repository root, preserving .env and uploads (neither is included). Run backend npm test, frontend npm test and npm run build. Deploy both frontend and backend. No new npm dependency or data migration is required.
