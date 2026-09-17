import mongoose from "mongoose";
import env from "../src/config/env.js";
import { decryptSensitiveValue, encryptSensitiveValue, getSensitiveValueKeyId } from "../src/utils/fieldEncryption.js";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "../src/utils/integrationSecurity.js";

const apply = process.argv.includes("--apply");
const rotate = (value) => {
  if (!value) return value;
  const plain = decryptSensitiveValue(value);
  if (!plain && value) throw new Error("Unable to decrypt a sensitive value; previous key may be missing");
  return encryptSensitiveValue(plain);
};

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  const db = mongoose.connection.db;
  const summary = { mode: apply ? "apply" : "dry-run", users: 0, students: 0, integrations: 0 };

  for await (const item of db.collection("users").find({ $or: [{ mfaSecret: { $exists: true, $ne: "" } }, { pendingMfaSecret: { $exists: true, $ne: "" } }] })) {
    const update = {};
    for (const field of ["mfaSecret", "pendingMfaSecret"]) {
      if (item[field] && getSensitiveValueKeyId(item[field]) !== env.DATA_ENCRYPTION_KEY_ID) update[field] = rotate(item[field]);
    }
    if (Object.keys(update).length) {
      summary.users += 1;
      if (apply) await db.collection("users").updateOne({ _id: item._id }, { $set: update });
    }
  }

  for await (const item of db.collection("students").find({})) {
    const update = {};
    const scalarPaths = [["aadhaarNumber", item.aadhaarNumber], ["medicalInfo.notes", item.medicalInfo?.notes]];
    for (const [path, value] of scalarPaths) if (value && getSensitiveValueKeyId(value) !== env.DATA_ENCRYPTION_KEY_ID) update[path] = rotate(value);
    const arrays = [["medicalConditions", item.medicalConditions], ["medicalInfo.medicalConditions", item.medicalInfo?.medicalConditions]];
    for (const [path, values] of arrays) if (Array.isArray(values) && values.some((value) => getSensitiveValueKeyId(value) !== env.DATA_ENCRYPTION_KEY_ID)) update[path] = values.map(rotate);
    if (Object.keys(update).length) {
      summary.students += 1;
      if (apply) await db.collection("students").updateOne({ _id: item._id }, { $set: update });
    }
  }

  for await (const item of db.collection("tournamentintegrations").find({ webhookSecretEncrypted: { $exists: true, $ne: "" } })) {
    if (String(item.webhookSecretEncrypted).startsWith(`v2.${env.INTEGRATION_ENCRYPTION_KEY_ID}.`)) continue;
    const rotated = encryptIntegrationSecret(decryptIntegrationSecret(item.webhookSecretEncrypted));
    summary.integrations += 1;
    if (apply) await db.collection("tournamentintegrations").updateOne({ _id: item._id }, { $set: { webhookSecretEncrypted: rotated } });
  }

  console.log(JSON.stringify(summary, null, 2));
  if (!apply) console.log("Dry-run only. Back up the database, verify previous keys, then rerun with --apply.");
  await mongoose.disconnect();
};

run().catch(async (error) => { console.error(error.message); await mongoose.disconnect().catch(() => {}); process.exitCode = 1; });
