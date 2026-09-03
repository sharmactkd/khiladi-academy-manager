# Attendance search placement and Ctrl multi-sort

Latest adjustment: search is left-aligned immediately after the batch name; year/repeat stay right-aligned. Sorting applies only to status=active rows (not raw-import rows). Inactive/unknown/import-only rows retain their original positions and relative order. Search still finds all students. Ctrl multi-sort and ascending/descending/neutral remain unchanged.

Based on main commit 81f8839 (attendance5). This update assumes the central /imports page is already installed.

## Changes
- Remove Import buttons, modal mounts and obsolete import handlers from Students and Attendance. Central Imports and its API endpoints remain unchanged.
- Attendance search now sits between batch selection and year controls on desktop, wrapping cleanly on smaller screens. Supports student name, imported name, phone (with/without separators), admission number and student code when available in the register response.
- Each header cycles ascending -> descending -> neutral. Neutral restores original register order when no other sort remains.
- Normal click keeps only the clicked column's next sort. Ctrl+click (or Command+click on Mac) adds/cycles that column without clearing other sorts. Priority 1/2 is shown. Example: Fee Status, then Ctrl+Due Date sorts dates inside each fee-status group.
- Due Date uses membership effective due date where applicable. Historic day-only dates use the selected register month. Unknown/empty dates remain last within each sort level, in either direction.
- Fee Status uses alphabetical A-Z/Z-A ordering of displayed status.
- Search/sorting keeps full register state. Editing a visible row updates its original source position and retains hidden students and marks for autosave. Search/sort does not trigger a save by itself.
- Export Excel still exports the full register; print follows the displayed search and sorting. Clear search before printing the complete register.

## Install (Windows PowerShell)
Stop the frontend development server, download the ZIP to Downloads, then:

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\khiladi-attendance-active-sort.zip" `
  -DestinationPath "." `
  -Force
npm --prefix frontend run dev
```

No database migration, backend changes or new dependencies are required. ZIP contains complete changed/new files in their project-relative paths, not snippets. It overwrites only those listed files.

## Verification
- 14 search/sort/source-row-preservation regression tests passed.
- Frontend production build passed; existing large bundle size warnings remain.
- No live database changes or live authenticated browser end-to-end verification performed.

```powershell
node --test frontend/scripts/testAttendanceRowView.mjs
npm --prefix frontend run build
```

Check locally: search a student, change a past date mark, wait for autosave, clear search, and reload. Confirm all other students' marks remain. Click each sortable header three times and check ascending/descending/neutral order. Ctrl+click the second header to check priority and combined sorting; confirm sidebar Imports still opens.
