# Attendance fee metadata import fix

Root cause: monthly register seeds blank Student rows before reading attendance
documents. Imported attendance statuses were merged, but linked Excel identity
metadata was discarded because the Student row already existed.

The monthly service now enriches that row with imported due date, paid date,
fee status and related source metadata. Import also backfills blank metadata
when duplicate mode is Skip existing, without changing saved attendance status
or overwriting non-blank metadata.

Apply both backend files together. The test file is included for verification.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-attendance-fee-metadata-fix.zip" -DestinationPath "." -Force
cd backend
npm run dev
```

After backend restart, refresh the attendance page. If metadata was already
stored, it should display without reimporting. If fields remain blank, import
the same workbook again using Skip existing: attendance marks remain unchanged
and only blank metadata is completed.

Verification: 5 targeted tests, 7 security tests, syntax checks and diff check
passed. No real workbook/database was available for end-to-end verification.
