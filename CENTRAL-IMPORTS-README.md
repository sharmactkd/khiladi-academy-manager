# Central Imports — source update

Base: c872087 (import1). Extract at the existing project root. This archive contains complete changed/new files, not the whole repository. Existing dependencies are reused. Restart BOTH backend and frontend.

## Implemented

- Sidebar Imports route `/imports`; Students and Attendance shortcuts lead to it.
- Workbook selection (60 MB XLSX/XLS/CSV), SHA-256 duplicate-file notice, sheet classification and background Web Worker analysis with cancellation.
- Students, Attendance, or Both. Existing destination branch/batch required; links open existing validated Add Branch/Add Batch forms in a new tab, then Refresh lists.
- Record mapping, first-five-row preview, Record-sheet priority, searchable all/individual/multiple selection and month selection.
- Combined directory includes record-only and attendance-only identities. Attendance-only creation retains available name/phone and is inactive/incomplete.
- Explicit matching: matched/review/new/excluded tabs. Phone-only and conflicting DOB do not auto-match. Same-name/no-identifier identities still require human review.
- Keep existing profiles, fill supported blank fields, or compare and explicitly select supported fields to replace. Non-empty values are never automatically replaced.
- Final preview, verified-only partial import, attendance skip/overwrite choice, selected IDs only.
- Server-side operator/academy-scoped session history and chunk response journal; deterministic MongoDB `_id` prevents concurrent duplicate chunk execution.
- Resume with exact original file and frozen settings. Confirmed chunks return cached responses. Running/uncertain chunks are blocked, not blindly retried.
- Opt-in IndexedDB browser drafts (including source workbook); mapping profiles persist locally for identical headers. Delete draft removes the local copy. These are browser/device-local, not cloud backups.
- Results, error CSV (formula-safe), history details, pause after current chunk. Importing attendance does not create FeePayment/receipt records.
- Existing attendance import counters are restored if a document save fails.

## Important limits / not yet implemented

- This is NOT a claim that every item in the earlier proposed roadmap is complete.
- Generic/custom attendance column mapping is not implemented. Attendance uses the existing historical monthly layout parser (A:AN, first 10,000 rows). Unsupported layouts warn/reject; do not import data outside this supported range.
- Record preview limit remains 200 columns / 100,000 rows, with warning.
- Review mode replaces only explicitly checked supported fields; identifiers and hidden medical arrays are excluded from the UI. Neither review nor fill-empty supports arbitrary arrays of guardians/phones or embedded photos.
- No automatic recovery of uncertain writes and no global rollback. A crash may leave some data saved; inspect it. A journal-confirmed row failure must be corrected and imported through a NEW reviewed session, not replayed as if it had succeeded.
- Same-name identities without phone/admission can group together. Automatic splitting/merging tools are not included; distinguish ambiguous students in the source and review before creation.
- History shows latest 50 sessions for the current operator in the current academy; no administrator-wide history UI yet.
- Fees/Belt Test/Championship bulk import and Tournament sync redesign are not included.
- Browser navigation while importing should be avoided; use Pause. Saved data is never undone by closing the page.

## Database changes

Normal application use creates `importsessions` and `importchunks`. No database deletion/reset/migration is required. History includes saved plan, per-chunk outcomes and operator identity. Source Excel bytes are not stored on the server by this feature. Existing student/attendance APIs still enforce authentication and academy context.

## Verification

Frontend production build and 37 automated checks passed locally (frontend import helpers, matching, chunking, fill-empty, reviewed replacement, CSV, backend journal replay and attendance metadata). Backend tests used dummy offline environment variables and mocked journal storage; no live database imports were run. End-to-end validation against your deployed MongoDB/browser remains required.

```powershell
cd D:\KHILADI-Academy-Manager
node --test frontend/scripts/testCentralImports.mjs
npm --prefix frontend run build
```

First verify 1–2 players in each mode, including a record-only and an attendance-only player. Verify an existing incomplete profile is enriched without changing non-empty values. Reopen the same session and confirm cached chunks are not written twice. Keep the original file unchanged for resume.
