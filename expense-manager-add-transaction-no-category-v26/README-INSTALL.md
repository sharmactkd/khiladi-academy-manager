# Expense Manager — Add Transaction Without Category

The complete Category section and its flow have been removed. Income/Expense, Amount, Mode, Description, Date and Save transaction remain.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-add-transaction-no-category-v26.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply frontend and backend files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-add-transaction-no-category-v26\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force

Copy-Item `
  ".\expense-manager-add-transaction-no-category-v26\backend\src\*" `
  ".\backend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```
