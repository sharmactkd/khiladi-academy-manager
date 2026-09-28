import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import { seedDefaultPlans } from "../src/services/planService.js";
import { seedDefaultAddOns } from "../src/services/entitlementService.js";

await connectDB();
const plans = await seedDefaultPlans();
const addOns = await seedDefaultAddOns();
console.log(`Subscription catalogue ready: ${plans.length} plans, ${addOns.length} add-ons.`);
await mongoose.disconnect();
