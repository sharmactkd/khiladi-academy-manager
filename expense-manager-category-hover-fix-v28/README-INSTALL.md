# Expense Manager — Complete Category Flow

Expense categories include Rent, Salary, Electricity, Equipment, Championship, Marketing, Travel, Maintenance, Food, Medical, Subscription, Movie and Parking. Tiles use respective icons and preserve the complete selection/custom flow.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-category-hover-fix-v28.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply frontend and backend files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-category-hover-fix-v28\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force

Copy-Item `
  ".\expense-manager-category-hover-fix-v28\backend\src\*" `
  ".\backend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```
