import mongoose from "mongoose";
import env from "../src/config/env.js";
import Student from "../src/models/Student.js";

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  const cursor = Student.find({})
    .select("+aadhaarNumber medicalConditions medicalInfo")
    .cursor();

  let migrated = 0;
  for await (const student of cursor) {
    // Model setters and validation hooks transparently encrypt legacy plaintext.
    student.markModified("aadhaarNumber");
    student.markModified("medicalConditions");
    student.markModified("medicalInfo");
    await student.save();
    migrated += 1;
  }

  await Student.syncIndexes();
  console.log(`Encrypted sensitive fields for ${migrated} students.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
