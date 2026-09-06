# Attendance matching tabs and create record

Includes the previous grouped matching fix and the new top Matched / Unmatched
toggle buttons. Only the selected list is rendered; counts cover all groups.

Unmatched rows offer Create student record. Confirm/edit the name, select
Active or Inactive, and confirm you have checked existing records. Creation
uses the existing authenticated Student API and its validation/plan limits.
It creates a real student in the selected batch, generates the admission
number, and maps all grouped source row keys to the returned student ID.

Inactive is the default for historical students. Missing DOB/contact information
is not invented; complete the profile later through Edit Student.

The student record is saved immediately and remains even if attendance import
is cancelled. Attendance is saved only by the final Import button. If a network
error leaves creation uncertain, check Student Records before trying again.
No automatic retry or automatic mass creation is performed.

## Apply in PowerShell

Stop the frontend with Ctrl+C. Back up local edits before overwriting files.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-attendance-match-tabs.zip" -DestinationPath "." -Force
cd frontend
npm run dev
```

Refresh with Ctrl+Shift+R and reselect your workbook.
No new dependencies or backend restart are required.

Production build and 11 existing preview/grouping tests passed. A live database
creation/import round-trip and the actual workbook have not been tested here.
Test one missing historical student first, check its Student Record, then
import a small attendance period and verify after refresh.
