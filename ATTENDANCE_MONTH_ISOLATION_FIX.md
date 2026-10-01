# Attendance month isolation

## October 2026 baseline

When October 2026 has no saved order of its own, the monthly register reads the
exact saved September 2026 keys and uses them as October's initial visual order.
The inherited revision is intentionally reset to zero.

The first October reorder, attendance save, or active/inactive status change
creates/updates only this document:

`<academy>:<batch>:2026:10`

It never updates September's document:

`<academy>:<batch>:2026:9`

New students not present in September are appended without moving the inherited
students. Removed students are ignored without corrupting the stored keys.

## Isolation guarantees

- A historical GET is read-only.
- Historical months do not inherit an adjacent month when their own snapshot is
  absent.
- Attendance marks are scoped by academy, batch, and exact date.
- Row order and student state are scoped by academy, batch, year, and month.
- Current-month status changes wait for pending attendance saves and immediately
  persist a monthly order/status snapshot.
- Historical Membership Control and student-status actions remain disabled.
- Current fee display values are not written into historical imported metadata.

## Verification

Backend tests cover September-to-October inheritance, January year rollover,
October-only edits, historical non-inheritance, removed/new rows, mark identity,
metadata isolation, transaction safety, and concurrency revision checks.

Frontend tests cover exact order rendering, search/sort source identity, status
snapshot persistence, active counts, historical control blocking, autosave,
session continuity, imports, and attendance export. The Vite production build
must also complete before release.
