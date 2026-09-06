# Attendance unmatched history

Based on origin/main ab8fa6d (Attendance3). Only student-matching review files
are changed.

## Updated behavior

- Selecting an existing student applies the mapping immediately; the extra
  pending/Confirm match/Cancel panel has been removed.
- The mapped student appears in Matched students immediately.
- Every row that was initially unmatched remains in Unmatched history.
- Resolved history rows are faded and read-only, and show `Matched with`, the
  selected Student Record name, plus phone/admission identifier when available.
- The tab shows both total unmatched history and the number still pending.
- Truly unresolved history rows retain the dropdown and Create student record.
- Automatically matched rows are not incorrectly added to unmatched history.
- Search, grouped source-row totals, pagination, bulk creation and matched-only
  import continue to work.

The shadow row is UI history inside the current workbook review session. It
does not duplicate the student or attendance data sent to the server.

## Apply in PowerShell

Stop the frontend with Ctrl+C and back up local edits before extracting.

```powershell
cd D:\KHILADI-Academy-Manager

Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\khiladi-attendance-unmatched-history.zip" `
  -DestinationPath "." `
  -Force

cd frontend
npm run dev
```

Refresh the browser with Ctrl+Shift+R and select the workbook again. No new
dependency or backend restart is required.

## Verification

- Frontend production build passed.
- 17 helper tests passed, including unmatched-to-matched history preservation,
  source row/cell totals, large repeated history and automatic-match exclusion.
- Existing bundle-size warnings remain.
- Actual workbook and authenticated live-database flow were not available for
  end-to-end testing.
