# Attendance Current State fix

`Current State` अब original due date और effective due date का accumulated difference नहीं दिखाएगा। इसलिए `+3045 Days` जैसी misleading value की जगह current membership status या actual effective due date दिखेगी। Backend की adjustment calculation और adjustment history unchanged रखी गई है.

## Extract

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\attendance-current-state-fix-v31.zip" `
  -DestinationPath "D:\KHILADI-Academy-Manager" `
  -Force
```

## Apply

Project root से:

```powershell
Copy-Item `
  ".\attendance-current-state-fix-v31\frontend\src\components\attendance\MembershipBadge.jsx" `
  ".\frontend\src\components\attendance\MembershipBadge.jsx" `
  -Force
```

फिर frontend restart करें.
