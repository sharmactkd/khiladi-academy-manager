# Attendance review performance fix

Based on main commit 48dd6af (Attendance1).

This archive contains complete versions of the four changed/new frontend source
files, the regression test, and these instructions. Backend files and student
records are not changed.

## Apply in PowerShell

Stop the frontend dev server with Ctrl+C. Back up your current frontend changes
before extracting: extraction replaces the files with the same paths.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-attendance-review-fix.zip" -DestinationPath "." -Force
cd frontend
node --test scripts/testAttendanceMatchPreview.mjs
npm run dev
```

Refresh the browser with Ctrl+Shift+R and select the workbook again.
No dependency installation or backend restart is needed for this patch.

## Changes

- Matching preview sends identity fields only, not full attendance histories.
- Exact repeated source identities across months are previewed once; their
  attendance cell counts are accumulated. Names/phones alone are not dedup keys.
- Preparation yields every 500 rows so progress can paint.
- Review renders 25 rows per page, with Excel-row search and needs-review filter.
- Auto-matched rows render text instead of thousands of unused dropdown options.
- Manual student choices are bounded; use the existing-student search to find
  students beyond the first 50 results. Confirmed choices survive paging/search.
- Each preview request has a two-minute timeout and checks response completeness.
- The final import continues using the original attendance rows and server-side
  validation. Paging does not limit which rows are imported.

## Verification

Frontend production build passed. Four automated tests passed, including 36,000
synthetic monthly rows representing 1,116,000 attendance cells. Diff whitespace
check passed. Existing bundle-size warnings remain.

Actual Ground.xlsx, live MongoDB persistence, and an authenticated browser import
were not available for end-to-end verification.

## Manual check

1. Select the destination batch, workbook, worksheets and months.
2. Click Review student matches; confirm group progress appears and step 3 opens.
3. Search/filter/page through rows; resolve or exclude every ambiguous row.
4. Confirm choices persist after paging and Import stays blocked if unresolved.
5. Import a small known month first; refresh attendance to verify saved marks.
