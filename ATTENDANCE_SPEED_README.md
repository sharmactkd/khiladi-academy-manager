# Attendance speed update v24

Based on repository main c97e504 (birthday/fee reminders), fetched October 23, 2026. This bundle contains COMPLETE contents of all related changed files. It is an incremental update for the existing project, not a standalone copy of unrelated source.

## Changes
- Fetch the batch roster concurrently with initial register queries; only retrieve missing historical/previous-batch students afterward. Preserve the full roster, including inactive students.
- Keep the existing 40-document imported-history horizon and newest-nonblank value of each fee field, but reduce history to one row per student inside MongoDB before transmission to Node. Monthly attendance records and explicit historical blanks retain their existing policy.
- Sort metadata once instead of separately sorting five facets. Project just the latest-fee fields consumed by the register; retain full historical fee correction handling.
- The attendance frontend requests includeStudents=false, removing the unused duplicate student list. Row data remains intact. Other API callers keep the legacy payload by default.
- For a direct /attendance visit, the initial reminder request waits for the register's completion, with a 10-second fallback for canceled or failed loads. The existing daily flash/read/settings behavior continues. Shared birthday calendar calculations reduce repeated work.
- Add Server-Timing registerReads and registerRows alongside attendance to identify remaining bottlenecks.
- Extend the existing non-destructive index creation command to historical membership adjustments and notifications. It creates schema-declared indexes; it does not drop records or indexes.

## Evidence and limits
Your captured response was 1,417,179 JSON bytes. Removing only the unused students list yields 1,168,950 bytes, a 17.5% reduction in decoded JSON, measured offline from the supplied HAR. Compressed transfer savings and live response times may differ.

Backend tests: security 31, expenses 6 and main suite 96 pass. Frontend tests and production build pass. The new aggregation tests execute pipelines through Mingo (test-only dev dependency), including 552 synthetic students, independent fee fields, 40-document cutoff and blank/date/order/legacy-row regressions. A separate mocked full-register comparison against the unchanged baseline passed for current and previous months. This is not a live MongoDB explain/profile run. Live server timing, mobile rendering and production behavior require post-deployment verification. Existing >500KB bundle warnings remain.

## Install
Back up any local changes first. Extract to the EXISTING project root. Run backend npm ci --include=dev, npm test, npm run performance:indexes (with your normal backend .env), then frontend npm ci, npm test and npm run build. Index creation requires database permissions; inspect any error before proceeding. Commit only files listed in ATTENDANCE_SPEED_FIX_FILES.json. Deploy both Render backend and Vercel frontend. No environment changes or data migration are required.

## Verify
Use the same batch/month (552 students) and network settings. Record one first visit, one repeat visit and a month change. Compare monthly-register duration plus Server-Timing attendance/registerReads/registerRows. Check that rows have no missing students, imported historic fee blanks stay blank, order is preserved, fee changes remain fresh, attendance saves survive refresh, and birthday/due reminders appear after attendance on a direct visit. No stale register cache shortcut was enabled.

## v24 installation correction
The v23 lock file omitted MongoDB's optional gcp-metadata 7.0.1 peer package when generated with npm 11. npm 10 enforces that entry during npm ci. The lock was regenerated using npm 10.9.4, preserving the application dependency versions. A separate nested gcp-metadata 7.0.1 entry is now included alongside google-auth-library's existing 8.1.2. No attendance behavior changes in this revision.

Verified on clean dependency directories: npm 10.9.4 ci --include=dev and npm 11.9.0 ci --include=dev both succeed. Backend tests also pass using the freshly installed dependencies (31 security + 6 expense + 96 main tests). These checks ran on Linux; Windows was not available for direct testing.
