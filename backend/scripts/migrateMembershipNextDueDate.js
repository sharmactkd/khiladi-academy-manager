import mongoose from "mongoose";

import connectDB from "../src/config/db.js";
import MembershipAdjustment from "../src/models/MembershipAdjustment.js";
import FeePayment from "../src/models/FeePayment.js";
import StudentMembership from "../src/models/StudentMembership.js";
import { addBillingMonthsClamped, dueCyclesThrough } from "../src/utils/membershipMonthlyDue.js";

const apply = process.argv.includes("--apply");
const now = new Date();
const eligibleForAccrual = membership =>
  membership.autoMonthlyDue === true &&
  membership.status !== "paused" &&
  membership.status !== "complimentary" &&
  membership.feeRequired !== false &&
  Number(membership.remainingTrainingDays || 0) <= 0;

let examined = 0;
let migrated = 0;
let manualBalanceAnchors = 0;
let repairedDisplayDates = 0;

try {
  await connectDB();
  const memberships = await StudentMembership.find({
    nextDueDate: null,
    effectiveDueDate: { $ne: null },
  }).lean();

  for (const membership of memberships) {
    examined += 1;
    const effectiveDueDate = new Date(membership.effectiveDueDate);
    const cycles = eligibleForAccrual(membership)
      ? dueCyclesThrough(effectiveDueDate, now)
      : 0;
    const manualAdjustment = await MembershipAdjustment.findOne({
      membership: membership._id,
      type: { $in: ["set_due_date", "change_unpaid_months"] },
      reversedAt: null,
    }).sort({ createdAt: -1 }).lean();
    const adjustedDueDate = manualAdjustment?.nextState?.effectiveDueDate
      ? new Date(manualAdjustment.nextState.effectiveDueDate)
      : null;
    const isManualNextDueAnchor = adjustedDueDate &&
      !Number.isNaN(adjustedDueDate.getTime()) &&
      adjustedDueDate.getTime() === effectiveDueDate.getTime();
    const storedMonths = Math.max(0, Number(membership.unpaidMonths || 0));
    const unpaidMonths = isManualNextDueAnchor
      ? storedMonths + cycles
      : Math.max(storedMonths, cycles);
    const nextDueDate = addBillingMonthsClamped(effectiveDueDate, cycles);
    const displayedDueDate = unpaidMonths > 0 || Number(membership.unpaidDays || 0) > 0
      ? effectiveDueDate
      : nextDueDate;

    if (isManualNextDueAnchor) manualBalanceAnchors += 1;
    if (apply) {
      await StudentMembership.updateOne(
        { _id: membership._id, nextDueDate: null },
        { $set: { unpaidMonths, nextDueDate, effectiveDueDate: displayedDueDate } },
      );
    }
    migrated += 1;
  }

  // Repair records touched by the first next-due rollout: it moved the
  // visible overdue date forward together with the internal billing date.
  const repairCandidates = await StudentMembership.find({
    nextDueDate: { $ne: null },
    $or: [{ unpaidMonths: { $gt: 0 } }, { unpaidDays: { $gt: 0 } }],
  }).lean();
  for (const membership of repairCandidates) {
    const currentDue = new Date(membership.effectiveDueDate || 0);
    const nextDue = new Date(membership.nextDueDate || 0);
    if (Number.isNaN(currentDue.getTime()) || currentDue.getTime() !== nextDue.getTime()) continue;
    const balanceAdjustment = await MembershipAdjustment.findOne({
      membership: membership._id,
      type: "change_unpaid_months",
      reversedAt: null,
    }).sort({ createdAt: -1 }).lean();
    if (!balanceAdjustment) continue;
    const customAdjustment = await MembershipAdjustment.findOne({
      membership: membership._id,
      type: "set_due_date",
      reversedAt: null,
      createdAt: { $lte: balanceAdjustment.createdAt },
    }).sort({ createdAt: -1 }).lean();
    const customDueDate = customAdjustment?.nextState?.effectiveDueDate
      ? new Date(customAdjustment.nextState.effectiveDueDate)
      : null;
    if (!customDueDate || Number.isNaN(customDueDate.getTime()) || customDueDate >= nextDue) continue;
    const laterPayment = await FeePayment.exists({
      academy: membership.academy,
      student: membership.student,
      status: { $ne: "cancelled" },
      createdAt: { $gt: balanceAdjustment.createdAt },
    });
    if (laterPayment) continue;
    if (apply) {
      await StudentMembership.updateOne(
        { _id: membership._id, effectiveDueDate: membership.effectiveDueDate },
        { $set: { effectiveDueDate: customDueDate } },
      );
    }
    repairedDisplayDates += 1;
  }

  process.stdout.write(`${apply ? "Applied" : "Dry run"}: examined=${examined}, eligible=${migrated}, manualAnchors=${manualBalanceAnchors}, repairedDisplayDates=${repairedDisplayDates}\n`);
  if (!apply) process.stdout.write("No database changes made. Re-run with --apply after reviewing the counts.\n");
} finally {
  await mongoose.disconnect();
}
