# Expense Manager — Complete Category Flow

Expense categories include Rent, Salary, Electricity, Equipment, Championship, Marketing, Travel, Maintenance, Food, Medical, Subscription, Movie and Parking. Tiles use respective icons and preserve the complete selection/custom flow.

The transaction ledger is split into two panels: Income transactions on the left and Expense transactions on the right.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-income-expense-split-v30.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply frontend and backend files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-income-expense-split-v30\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force

Copy-Item `
  ".\expense-manager-income-expense-split-v30\backend\src\*" `
  ".\backend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```
