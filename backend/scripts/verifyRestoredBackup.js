import mongoose from "mongoose";

const restoreUri = String(process.env.BACKUP_RESTORE_URI || "");
const productionUri = String(process.env.MONGO_URI || "");
if (!restoreUri) throw new Error("BACKUP_RESTORE_URI is required");
if (restoreUri === productionUri) throw new Error("Refusing to test a restore against the production database");
if (/mongodb\.net/i.test(restoreUri) && !/restore|drill|staging|test/i.test(restoreUri)) {
  throw new Error("BACKUP_RESTORE_URI must clearly identify an isolated restore/drill database");
}

const criticalCollections = ["users", "academies", "branches", "batches", "students", "attendances", "feepayments", "auditlogs"];
try {
  const connection = await mongoose.connect(restoreUri, { serverSelectionTimeoutMS: 10000 });
  const existing = new Set((await connection.connection.db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name));
  const missing = criticalCollections.filter((name) => !existing.has(name));
  const counts = {};
  for (const name of criticalCollections.filter((item) => existing.has(item))) {
    counts[name] = await connection.connection.db.collection(name).estimatedDocumentCount();
  }
  if (missing.length) throw new Error(`Restore is missing critical collections: ${missing.join(", ")}`);
  if (!counts.users || !counts.academies) throw new Error("Restore has no users or academies");
  console.log(JSON.stringify({ status: "restore-verified", database: connection.connection.name, counts }, null, 2));
} finally {
  await mongoose.disconnect();
}
