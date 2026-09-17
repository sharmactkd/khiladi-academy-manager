import mongoose from "mongoose";
import env from "../src/config/env.js";

const apply = process.argv.includes("--apply");
const cutoff = (days) => new Date(Date.now() - days * 86400000);

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  const db = mongoose.connection.db;
  const importFilter = { updatedAt: { $lt: cutoff(env.IMPORT_SESSION_RETENTION_DAYS) }, status: { $in: ["completed", "failed"] } };
  const oldSessions = await db.collection("importsessions").find(importFilter, { projection: { _id: 1 } }).toArray();
  const sessionIds = oldSessions.map((item) => item._id);
  const enquiryFilter = { status: "closed", updatedAt: { $lt: cutoff(env.CLOSED_ENQUIRY_RETENTION_DAYS) } };
  const summary = {
    mode: apply ? "apply" : "dry-run",
    importSessions: sessionIds.length,
    importChunks: sessionIds.length ? await db.collection("importchunks").countDocuments({ session: { $in: sessionIds } }) : 0,
    closedEnquiries: await db.collection("academyenquiries").countDocuments(enquiryFilter),
  };
  if (apply) {
    if (sessionIds.length) await db.collection("importchunks").deleteMany({ session: { $in: sessionIds } });
    await db.collection("importsessions").deleteMany({ _id: { $in: sessionIds } });
    await db.collection("academyenquiries").deleteMany(enquiryFilter);
  }
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) console.log("Dry-run only. Review legal/contract retention requirements and take a backup before --apply.");
  await mongoose.disconnect();
};

run().catch(async (error) => { console.error(error); await mongoose.disconnect().catch(() => {}); process.exitCode = 1; });
