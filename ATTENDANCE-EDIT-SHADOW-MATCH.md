# Double-click to correct a matched name

Double-click the green matched name in Unmatched history to reopen the student
dropdown. The current selection is retained until another student is selected.
Selecting a new student immediately updates that source group's mapping and
shadow row. Escape or clicking away closes the editor without changing it.
Keyboard users can focus the green label and press Enter/Space.

Only review UI/CSS and a regression test are changed. Saved attendance is not
transferred between records by this action; correct the mapping before import.

Apply on top of the previous attendance-history-empty-fix update. Stop frontend
with Ctrl+C and back up local changes first.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-edit-shadow-match.zip" -DestinationPath "." -Force
cd frontend
npm run dev
```

Refresh with Ctrl+Shift+R and reopen the workbook.

Frontend production build and 21 helper tests passed, including correction of
only the selected source group's rows. Native picker interaction in your actual
browser and live workbook were not end-to-end tested. If showPicker is unsupported,
the focused dropdown remains available for normal mouse/keyboard selection.
