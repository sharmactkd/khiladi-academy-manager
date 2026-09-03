# Attendance import: shared phone fix

Replace frontend/src/utils/attendanceExcelImport.js with the supplied complete file.
Different names no longer merge merely because they share a parent/contact number.
Repeated rows merge only when normalized name, phone and admission agree.

After extracting, restart the frontend and refresh the browser. Start a NEW import
and select the Excel file again so the worker reparses it. Do not resume an old
import session: its already-parsed chunks may contain merged identities.

This patch does not repair attendance already saved under the wrong student.
Review affected existing records before reimporting; reimport alone will not
remove incorrectly attributed marks. No database deletion/migration is included.
Unknown C, dot and backtick attendance values remain ignored; their meaning is
not assumed to be Present or Absent.

Tests: from frontend, run node --test scripts/testAttendanceSharedPhone.mjs.
