# Historical attendance and membership safety fix

This release prevents current student or membership state from rewriting the
meaning of an older attendance register.

## Behaviour after this release

- Opening a register is read-only. It does not create row-order snapshots.
- A saved month keeps its own row order and active/inactive status snapshot.
- A new current month starts with the immediately previous month's exact saved
  order. Its first reorder, attendance save or status change creates a separate
  current-month snapshot; the previous month is never updated.
- Historical registers do not expose live Membership Control or student-status
  actions.
- Attendance saves do not copy the current membership due date, fee status or
  remaining balance into imported historical fields.
- Membership changes and their audit entries commit in one MongoDB transaction.
- A reversal is rejected if a later membership change would be overwritten.
- Reasons are optional for all membership adjustments and reversals.
- The attendance summary counts active students, not every loaded row.

## Existing-data audit

The repair command is dry-run by default:

```powershell
cd backend
npm run attendance:audit-repair-history
```

It reports suspected historical metadata contamination and changes nothing.
Take a MongoDB Atlas backup and review the counts before applying:

```powershell
npm run attendance:audit-repair-history -- --apply
```

The repair only restores linked Excel rows from exact monthly metadata and
clears imported financial metadata from linked manual attendance rows. It does
not delete P/A/L/LT marks or automatically delete row-order snapshots.

## Verification

Run both suites before deployment:

```powershell
cd backend
npm install
npm test

cd ..\frontend
npm install
npm test
npm run build
```
