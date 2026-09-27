import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Academy from "../src/models/Academy.js";
import PublicAcademyProfile from "../src/models/PublicAcademyProfile.js";
import { normalizeStringList } from "../src/utils/normalizeStringList.js";

const apply = process.argv.includes("--apply");
let examined = 0;
let changed = 0;

const different = (left, right) => JSON.stringify(left || []) !== JSON.stringify(right || []);

try {
  await connectDB();
  const academies = await Academy.find({}).select("academyName martialArts").lean();

  for (const academy of academies) {
    examined += 1;
    const normalized = normalizeStringList(academy.martialArts, { maxItems: 30, maxLength: 60 });
    if (!different(academy.martialArts, normalized)) continue;
    changed += 1;
    process.stdout.write(`${academy.academyName}: ${JSON.stringify(academy.martialArts)} -> ${JSON.stringify(normalized)}\n`);
    if (!apply) continue;
    await Promise.all([
      Academy.updateOne({ _id: academy._id }, { $set: { martialArts: normalized } }),
      PublicAcademyProfile.updateOne({ academy: academy._id }, { $set: { martialArts: normalized } }),
    ]);
  }

  process.stdout.write(`${apply ? "Applied" : "Dry run"}: examined=${examined}, changed=${changed}\n`);
  if (!apply) process.stdout.write("No data changed. Re-run with --apply after reviewing the output.\n");
} finally {
  await mongoose.disconnect();
}
