# KHILADI Academy Manager — premium Imports page redesign

## Changes

- `What do you want to import?` and `Destination` are now the first setup row.
- Desktop: one row with two equal columns.
- Tablet/mobile: responsive single-column layout.
- Workbook Upload now appears after both setup choices.
- Import-mode choices redesigned as clear interactive cards.
- Destination readiness and refresh controls improved.
- Workbook dropzone, file-ready state, recovery control, progress steps and analysis action redesigned.
- Existing import parsing, matching, recovery and save behavior is unchanged.

## Apply with PowerShell

```powershell
$ZipPath = "$env:USERPROFILE\Downloads\khiladi-import-page-premium-redesign-v1.zip"
$TempPath = "$env:TEMP\khiladi-import-page-premium-redesign-v1"
$ProjectPath = "D:\Website\Khiladi Project\khiladi-academy-manager"

if (Test-Path $TempPath) { Remove-Item $TempPath -Recurse -Force }
Expand-Archive -Path $ZipPath -DestinationPath $TempPath -Force

robocopy "$TempPath\khiladi-import-page-premium-redesign-v1" $ProjectPath /E /XD ".git" "node_modules" "dist" /XF ".env" ".env.local" /R:2 /W:1
if ($LASTEXITCODE -ge 8) { throw "Patch copy failed: $LASTEXITCODE" }

Set-Location "$ProjectPath\frontend"
npm install
npm test
npm run build

Set-Location $ProjectPath
git add frontend/src/pages/imports
git commit -m "Redesign Imports setup experience"
git push origin main
```

After deployment, hard-refresh once with `Ctrl + Shift + R`.

## Validation

- Frontend full tests: passed.
- Production build: passed.
