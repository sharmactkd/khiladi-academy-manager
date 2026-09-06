# Attendance import actions

Based on main ab8fa6d (Attendance3). Only attendance import UI/helpers changed.

## Changes

- Selecting a student is now a pending choice. Confirm match / Cancel controls
  show the chosen name and identifier before changing the match.
- A persistent confirmation message explains which student was matched and
  provides View matched. Pending choices survive searching/paging/tab changes.
- Import matched only imports confirmed groups and skips unresolved groups for
  this request without permanently excluding them. The result includes the
  deferred count and Back to student matching.
- Confirmed IDs are pinned in the import request; each network chunk includes
  only its own source resolutions to avoid oversized request bodies.
- Create records for all unmatched requires a bulk confirmation. It creates
  one inactive, incomplete profile per non-excluded unmatched group through the
  existing Student API, then links every source row in that group.
- Progress and a created/remaining/error summary are shown. Creation stops on
  the first API/validation error. Earlier successful records remain saved.
  No automatic retry is made; check Student Records before retrying an uncertain
  network failure. Existing subscription and rate limits still apply.
- Bulk creation covers ALL unmatched groups, including those hidden by search.
  Confirm pending dropdown choices first if those students already exist.

## Important limitation: later merging

You can edit created profiles later using Edit Student, or select a different
existing student and confirm the match BEFORE attendance import. This patch
does NOT implement merging already-saved student records or transferring saved
attendance/fees to another student. Renaming a profile does not merge it.
Creating records may create duplicates; review before confirming bulk creation.
New records remain saved even if attendance import is cancelled.

## Apply (PowerShell)

Stop the frontend with Ctrl+C and back up local edits before replacing files.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-attendance-import-actions.zip" -DestinationPath "." -Force
cd frontend
npm run dev
```

Refresh with Ctrl+Shift+R and reselect the workbook. No dependency changes or
backend restart required.

## Verification

15 helper tests and frontend production build passed. Existing bundle size
warnings remain. Live database creation, authenticated UI interactions and
the user's actual workbook were not available for end-to-end verification.

Manual checks:
1. Choose an existing student: the row must stay until Confirm match is clicked.
2. Import matched only with unmatched rows present; verify only confirmed
   students' attendance after refresh.
3. Return to matching; unresolved groups must still be available.
4. Confirm bulk creation on a small test group, check Student Records and the
   matched list, then import a small period and verify.
5. If creation stops, inspect saved records before continuing to avoid duplicates.
