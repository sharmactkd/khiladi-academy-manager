import mongoose from "mongoose";
import env from "../src/config/env.js";
import User from "../src/models/User.js";

const run = async () => {
  const cutoffValue = process.env.EXISTING_USER_VERIFICATION_CUTOFF;
  if (!cutoffValue || Number.isNaN(new Date(cutoffValue).getTime())) {
    throw new Error(
      "Set EXISTING_USER_VERIFICATION_CUTOFF to the deployment ISO timestamp"
    );
  }
  const cutoff = new Date(cutoffValue);
  await mongoose.connect(env.MONGO_URI);
  const result = await User.updateMany(
    {
      email: { $exists: true, $nin: [null, ""] },
      isEmailVerified: { $ne: true },
      createdAt: { $lt: cutoff },
    },
    {
      $set: { isEmailVerified: true },
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    }
  );
  console.log(`Marked ${result.modifiedCount} existing email accounts as verified.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
