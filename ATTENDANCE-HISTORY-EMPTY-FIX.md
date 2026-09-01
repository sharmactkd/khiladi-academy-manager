# Empty unmatched history fix

Pending counts and history rows previously used separate data paths. If
historyItems metadata was missing/empty, the list could be empty despite pending
groups. The exact runtime state in the screenshot was not available locally.

History now derives directly from original preview rows and resolutions, with
fallback coverage for pending groups. The total history tab count is no longer
affected by search. Matches apply immediately; faded history remains.

All files in this archive must be extracted together. This is a frontend patch;
no backend, student-record or saved-attendance changes are made by installation.

Stop frontend with Ctrl+C. Back up local changes before overwriting files.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-attendance-history-empty-fix.zip" -DestinationPath "." -Force
cd frontend
npm run dev
```

Refresh with Ctrl+Shift+R, then close/reopen import and select the workbook again.
Old in-memory preview state is not reused.

Verification: production build and 20 helper tests passed, including 321 matched
and 239 pending synthetic records, missing metadata fallback, and mapping two
source identities to one existing student without losing their history rows.
Existing bundle-size warnings remain. Actual workbook/live database/browser
flow has not been end-to-end tested.
