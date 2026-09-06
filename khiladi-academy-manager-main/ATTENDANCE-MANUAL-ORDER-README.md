# Manual attendance serial order

Double-click a serial number, enter a position from 1 to the complete register row count, and confirm. Example: moving row 8 to 2 shifts rows 2 through 7 down one place. Enter on a focused serial button is also supported.

- Order is saved in MongoDB per academy, batch, year and month in `attendanceroworders` (new collection). It is not a global student admission number change.
- Other months/batches stay unchanged. Imported original serial identifiers and attendance marks are not edited.
- Saved manual position numbers remain visible while searching/sorting. Successful moves clear the search and temporary fee/date sorting so the saved order is visible. Neutral sorting returns to manual order.
- Manual moves can include active, inactive and imported-only rows. Fee/date sorting still applies only to active rows.
- Wait for attendance autosave before moving. Editing controls are blocked while the move saves. Failed moves leave the displayed order unchanged.
- Revision checks reject stale reorder requests from other windows. Refresh before retrying after a conflict.
- Newly encountered rows append after saved rows; missing old keys are ignored. Editing an imported identity may make it a new row in this ordering.

## Installation
Stop frontend and backend. Extract this ZIP at the project root; it contains full updated source files (including current search/multisort support). No new dependencies or manual data migration.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\khiladi-attendance-manual-order.zip" `
  -DestinationPath "." `
  -Force
npm --prefix backend run dev
```

Start frontend in another PowerShell terminal:

```powershell
cd D:\KHILADI-Academy-Manager
npm --prefix frontend run dev
```

Backend restart is required to load the new endpoint and model. Frontend-only installation cannot persist order.

## Checks
19 ordering/search tests plus 7 existing attendance-identity tests passed. Frontend production build passed. No live MongoDB writes or authenticated browser end-to-end verification were performed.

Locally verify moving 8 to 2, refreshing, editing a mark and waiting for autosave, then refreshing again. Check shifted serials, unchanged marks, a separate month's unchanged order, invalid position rejection and Ctrl sorting returning to manual order when neutral.
