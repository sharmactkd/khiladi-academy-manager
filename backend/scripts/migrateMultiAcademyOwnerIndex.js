import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Academy from "../src/models/Academy.js";

await connectDB();
const indexes = await Academy.collection.indexes();
const ownerIndex = indexes.find((item) => item.name === "owner_1" && item.unique);
if (ownerIndex) {
  await Academy.collection.dropIndex(ownerIndex.name);
  console.log("Dropped legacy unique owner_1 index; multiple academies are now supported.");
} else {
  console.log("No legacy unique owner index found; no change required.");
}
await Academy.collection.createIndex({ owner: 1 }, { name: "owner_1", background: true });
await mongoose.disconnect();
