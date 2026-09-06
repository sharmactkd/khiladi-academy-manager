# Student matching lists

Based on origin/main 2395f96 (Attendance2).

Only the attendance matching review UI and its grouping helper are changed.
Backend, workbook parser and final attendance import payload remain unchanged.

- Matched students and Unmatched / Needs review have separate lists.
- Each list has independent pagination (25 groups per page).
- Confirmed matches group by database student ID.
- Unverified rows group by exact normalized name, phone and admission number,
  across source rows/months. This grouping is not automatic identity verification.
- A manual group selection applies to every preserved source row key.
- Conflicting phone/admission details and different confirmed IDs stay separate.
- Excluded groups remain visible in the unmatched list, labeled Excluded.
- Attendance cells are totaled, not deleted. Import uses all original rows.

Important: identical names without identifiers are not proof of identity.
Review the displayed group before mapping it; a selection applies to all its
source rows. Source sheet/row locations are available in the row tooltip.

## Apply

Stop frontend with Ctrl+C. Back up any local changes to the matching modal first.

```powershell
cd D:\KHILADI-Academy-Manager
Expand-Archive -Path "$env:USERPROFILE\Downloads\khiladi-attendance-match-groups.zip" -DestinationPath "." -Force
cd frontend
npm run dev
```

Refresh with Ctrl+Shift+R and reselect the workbook.
No new dependencies or backend restart required.

## Tests

```powershell
cd D:\KHILADI-Academy-Manager\frontend
node --test scripts/testAttendanceReviewGroups.mjs scripts/testAttendanceMatchPreview.mjs
npm run build
```

11 tests and production build passed. Existing bundle-size warnings remain.
The actual user workbook and live database were not available for end-to-end testing.

Manual check: Prachi's identical source rows should appear as one unverified
group; confirm its student and it should move to Matched students. Check the
combined row/cell totals and verify a small imported period after refreshing.
