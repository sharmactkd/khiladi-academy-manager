# Expense Manager — Category Fix v22

Income and Expense custom categories are now separate, persisted after refresh, and category matching is normalized. Existing UI, icons, selection, clear, delete, validation and responsive behavior are preserved.

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-categories-fixed-v22.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

From the repository root:

```powershell
Copy-Item `
  ".\expense-manager-categories-fixed-v22\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force
```

```powershell
cd frontend
npm run dev
```
