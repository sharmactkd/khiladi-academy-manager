# Expense Manager — Complete Category Flow

Expense categories include Rent, Salary, Electricity, Equipment, Championship, Marketing, Travel, Maintenance, Food, Medical, Subscription, Movie and Parking. Tiles use respective icons and preserve the complete selection/custom flow.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-two-ledger-v29.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply frontend and backend files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-two-ledger-v29\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force

Copy-Item `
  ".\expense-manager-two-ledger-v29\backend\src\*" `
  ".\backend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```
