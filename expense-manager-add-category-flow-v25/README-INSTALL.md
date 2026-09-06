# Expense Manager — Complete Category Flow

Includes basic Income and Expense categories as icon tiles, category-specific icons, selection/clear behavior, custom category add/delete, stable hover styling, and backend category validation.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\expense-manager-add-category-flow-v25.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply frontend and backend files

Run from the repository root:

```powershell
Copy-Item `
  ".\expense-manager-add-category-flow-v25\frontend\src\*" `
  ".\frontend\src\" `
  -Recurse -Force

Copy-Item `
  ".\expense-manager-add-category-flow-v25\backend\src\*" `
  ".\backend\src\" `
  -Recurse -Force
```

## Start

```powershell
cd frontend
npm run dev
```
