# New / existing import choices

Restart both backend and frontend after extraction. Start a fresh import (do not
resume an old session). Select the workbook again.

Student matching tabs separate Existing app students, New students to create,
Identity needs review and Excluded. Ambiguous identities still need an explicit
choice. A shared phone with a different name is not silently linked.

Only new students (default): imports staged new profiles and their selected
attendance. Existing students and ALL their attendance are untouched.
New + existing: imports new profiles and updates selected existing profiles and
attendance according to the displayed policies. Overwrite replaces supplied
supported fields, not missing fields, names, admission IDs, status, or unselected
data. Attendance-only mode never updates existing profile fields. This is not
a database wipe. Review these policies before the final Import click.

Attendance-only profiles are inactive/incomplete. Check Students > All/Inactive.
Check failed counts and named errors if any row has no saved ID. No live MongoDB
write was performed in verification. Previously misattributed attendance is NOT
automatically removed by this patch.

Verification: 17 unit/regression tests; frontend production build; backend syntax.
