# Expense Manager — Add Transaction Rewrite

This package rewrites the complete Add Transaction section into AddTransactionForm.jsx while preserving the existing UI and features.
The category hover cascade is also corrected so unselected category tiles visibly respond on hover.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-hover-final-complete-v21.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-hover-final-complete-v21\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```

Stop the old Vite process with Ctrl+C before restarting it.
