import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Attendance from "../src/models/Attendance.js";
import AttendanceMonthMetadata from "../src/models/AttendanceMonthMetadata.js";
import AttendanceRowOrder from "../src/models/AttendanceRowOrder.js";

const apply = process.argv.includes("--apply");
const fields = ["importedDueDate", "importedPaidDate", "importedFeePaid", "importedFeeStatus"];
const clean = (value) => String(value ?? "").trim();
const keyFor = ({ academy, batch, student, year, month }) =>
  `${academy}:${batch}:${student}:${year}:${month}`;

let documentsExamined = 0;
let documentsChanged = 0;
let linkedManualRecordsCleared = 0;
let importedRecordsRestored = 0;

try {
  await connectDB();
  const metadata = await AttendanceMonthMetadata.find({}).lean();
  const metadataMap = new Map(metadata.map((item) => [keyFor(item), item]));
  const cursor = Attendance.find({}).cursor();

  for await (const document of cursor) {
    documentsExamined += 1;
    const date = new Date(document.date);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    let changed = false;

    for (const record of document.records || []) {
      if (!record.student) continue;
      const metadataRow = metadataMap.get(keyFor({
        academy: document.academy,
        batch: document.batch,
        student: record.student,
        year,
        month,
      }));

      if (record.source === "excel-import" && metadataRow) {
        let restored = false;
        for (const field of fields) {
          const expected = clean(metadataRow[field]);
          if (clean(record[field]) === expected) continue;
          record[field] = expected;
          restored = true;
          changed = true;
        }
        if (restored) importedRecordsRestored += 1;
        continue;
      }

      if (record.source !== "excel-import" && fields.some((field) => clean(record[field]))) {
        fields.forEach((field) => { record[field] = ""; });
        linkedManualRecordsCleared += 1;
        changed = true;
      }
    }

    if (!changed) continue;
    documentsChanged += 1;
    if (apply) await document.save({ validateModifiedOnly: true });
  }

  const rowOrderAudit = await AttendanceRowOrder.aggregate([
    { $project: { year: 1, month: 1, revision: 1, statusCount: { $size: { $ifNull: ["$statuses", []] } }, createdAt: 1 } },
    { $match: { statusCount: { $gt: 0 } } },
    { $group: { _id: null, documents: { $sum: 1 }, statusSnapshots: { $sum: "$statusCount" } } },
  ]);

  process.stdout.write(`${apply ? "Applied" : "Dry run"}: attendanceDocuments=${documentsExamined}, documentsToRepair=${documentsChanged}, linkedManualRecordsToClear=${linkedManualRecordsCleared}, importedRecordsToRestore=${importedRecordsRestored}\n`);
  process.stdout.write(`Row-order audit only (never auto-deleted): ${JSON.stringify(rowOrderAudit[0] || { documents: 0, statusSnapshots: 0 })}\n`);
  if (!apply) process.stdout.write("No data changed. Take an Atlas backup, review these counts, then re-run with --apply only if approved.\n");
} finally {
  await mongoose.disconnect();
}
