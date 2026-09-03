# Clear Imports workflow

This update changes the Imports frontend only. Existing backend import validation, record-first attendance linking, chunk journal, matching safety and resume logic remain in place.

1. File & sheets: choose file, Student Records / Attendance / Both, source sheet roles, branch and batch.
2. Match Excel columns: map personal detail fields; choose attendance months where applicable. This is separate from selecting students.
3. Select students: all, or search and select one/multiple Excel players.
4. New or existing?: refresh and validate the app student list. If truly empty, preselect Create new student for selected players, retaining explicit exclusions. A failed list request does not count as an empty database. Existing students continue to use safe matching and manual choices; A-Z options remain.
5. Review & import: show new/existing/pending/excluded counts and destination. These are the only buttons that execute the import. Records save first, then attendance for successful student identities. You may import ready students only and skip pending choices.
6. Result: confirmed counts, failures and error download. Saved records are not rolled back by closing the page.

"Details found in Excel" means Excel contains a mapped personal-details row, NOT that the app has a saved student. "Only attendance found in Excel" means the available attendance identity can create an inactive incomplete profile if the user chooses new. Complete missing details later.

Saved server-session decisions are preserved on resume; they are not automatically restaged as new. After deleting the database's operational records, always start a NEW import, not an old browser draft/history session.

## Install
Stop frontend, extract at project root, restart frontend. No backend changes/new dependencies.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\khiladi-import-simple-flow.zip" `
  -DestinationPath "." `
  -Force
npm --prefix frontend run dev
```

14 automated import tests and frontend production build passed. Live database/browser end-to-end verification was not performed. Existing historical attendance worksheet format support is unchanged.
