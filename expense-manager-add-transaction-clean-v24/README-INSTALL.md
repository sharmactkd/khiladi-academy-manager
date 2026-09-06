# Expense Manager — Add Transaction Clean Update

The Add Transaction form now contains only Income/Expense, Amount, Mode, Description, Date and Save transaction. The transaction API/model no longer requires the removed field.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-add-transaction-clean-v24.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply frontend and backend files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-add-transaction-clean-v24\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force

Copy-Item `
  ".\expense-manager-add-transaction-clean-v24\backend\src\*" `
  ".\backend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```
