# Expense Manager Category Hover Fix

Complete related source files copied from repository main.
The only functional change is the final hover cascade in ExpenseManagerPremium.css.

## Windows PowerShell / VS Code terminal

Run this from the repository root after extracting the ZIP:

```powershell
Copy-Item ".\expense-manager-hover-fix\frontend\src\pages\expenses\ExpenseManager.jsx" ".\frontend\src\pages\expenses\ExpenseManager.jsx" -Force
Copy-Item ".\expense-manager-hover-fix\frontend\src\pages\expenses\ExpenseManager.module.css" ".\frontend\src\pages\expenses\ExpenseManager.module.css" -Force
Copy-Item ".\expense-manager-hover-fix\frontend\src\pages\expenses\ExpenseManagerPremium.css" ".\frontend\src\pages\expenses\ExpenseManagerPremium.css" -Force
Copy-Item ".\expense-manager-hover-fix\frontend\src\components\common\iconOptions\IconOptionGrid.jsx" ".\frontend\src\components\common\iconOptions\IconOptionGrid.jsx" -Force
Copy-Item ".\expense-manager-hover-fix\frontend\src\components\common\iconOptions\IconOptionGrid.module.css" ".\frontend\src\components\common\iconOptions\IconOptionGrid.module.css" -Force
Copy-Item ".\expense-manager-hover-fix\frontend\src\components\common\iconOptions\optionIconRegistry.jsx" ".\frontend\src\components\common\iconOptions\optionIconRegistry.jsx" -Force
```

Then restart Vite:

```powershell
cd frontend
npm run dev
```
