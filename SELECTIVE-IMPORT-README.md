# Selected student record + attendance import

Based on repository commit 0f02273. Extract this archive into the existing project root. It contains complete changed source files (not the entire repository). Restart backend and frontend after extraction. No new dependencies or database migration are required.

## Usage

1. Students > Import Excel > select the destination branch/batch > upload workbook > choose sheet. Mapping, searchable player selection and both import actions appear directly below the sheet controls. The separate entry point previously added to Attendance has been removed.
2. Upload XLSX/XLS (up to 60 MB), choose the student-details sheet and correct header row.
3. Review all field mappings. Unmapped fields have red borders. Map available name, DOB, contact, education, belt, medical and other supported profile fields. Unknown/custom columns need a model extension and are not silently stored.
4. Search and click player rows to select one or multiple records. Selections persist across search/page changes. Separate same-name source rows remain separate; check identity before importing.
5. Import student records only saves the selected mapped profiles without attendance. Existing students are skipped, not overwritten. Missing DOB/joining dates remain empty; existing model defaults still apply to other fields. Incomplete profiles are allowed.
6. Import records + review attendance first saves profiles, then previews selected attendance sheets. Only server-confirmed IDs from the record import are eligible. Other/unmatched source rows are skipped unless you explicitly link them to a selected student. Review months and matches, then click Import selected students' attendance.

Closing after record creation does not undo saved students. Attendance import uses skip-existing by default. Partial successful chunks remain saved if a later chunk fails. Results report imported, skipped and failed rows; resolve errors before assuming all data was imported.

## Scope and checks

- Existing bulk attendance flow and the creation queue/unlinked student options are retained.
- Mapping uses the shared Student Import fields and existing backend validation.
- Destination batch/branch are selected in the application, not created from arbitrary workbook data.
- Preview is capped at 200 columns / 100,000 rows with an explicit warning.
- Embedded Excel photos and unsupported/custom fields are not imported.
- Tests: `node frontend/scripts/verifySelectiveStudentImport.mjs`
- Build: `npm --prefix frontend run build`
- Backend syntax: `node --check backend/src/controllers/studentController.js`
- No live database or user's actual 40+ MB workbook was used for testing.
