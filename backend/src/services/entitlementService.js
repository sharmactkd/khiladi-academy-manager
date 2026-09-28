import AddOnDefinition from "../models/AddOnDefinition.js";
import Entitlement from "../models/Entitlement.js";
import { getEffectivePlan } from "./planService.js";

export const DEFAULT_ADD_ONS = [
  { code: "student_capacity_500", name: "Additional 500 Students", description: "Adds capacity for 500 retained students.", price: 100, unitSize: 500, scope: "academy", stackable: true, sortOrder: 1 },
  { code: "additional_academy", name: "Additional Academy", description: "Adds one independent academy with one primary branch.", price: 1000, unitSize: 1, scope: "account", stackable: true, sortOrder: 2 },
  { code: "additional_branch", name: "Additional Branch", description: "Adds one branch to the selected academy.", price: 300, unitSize: 1, scope: "academy", stackable: true, sortOrder: 3 },
  { code: "id_card_studio", name: "ID Card Studio", description: "Print-ready ID cards with a 5,000 export monthly fair-use limit.", price: 1000, unitSize: 1, scope: "academy", stackable: false, fairUseLimit: 5000, sortOrder: 4 },
  { code: "certificate_studio", name: "Certificate Studio", description: "Print-ready certificates with a 5,000 export monthly fair-use limit.", price: 1000, unitSize: 1, scope: "academy", stackable: false, fairUseLimit: 5000, sortOrder: 5 },
  { code: "document_studio_bundle", name: "Document Studio Bundle", description: "ID Card Studio and Certificate Studio together.", price: 1699, unitSize: 1, scope: "academy", stackable: false, fairUseLimit: 5000, sortOrder: 6 },
];

export const seedDefaultAddOns = async ({ userId = null } = {}) => Promise.all(
  DEFAULT_ADD_ONS.map((item) => AddOnDefinition.findOneAndUpdate(
    { code: item.code },
    { $set: { ...item, currency: "INR", billingCycle: "monthly", isActive: true, updatedBy: userId }, $setOnInsert: { createdBy: userId } },
    { new: true, upsert: true, runValidators: true }
  ))
);

export const getActiveEntitlements = async ({ ownerId, academyId = null, session = null }) => {
  const now = new Date();
  const filter = {
    owner: ownerId,
    status: { $in: ["active", "grace"] },
    $or: [{ endDate: { $gte: now } }, { graceEndsAt: { $gte: now } }],
  };
  if (academyId) filter.$and = [{ $or: [{ academy: academyId }, { academy: null }] }];
  return Entitlement.find(filter).populate("addOn").session(session);
};

export const summarizeEntitlements = async ({ ownerId, academyId, session = null }) => {
  const entitlements = await getActiveEntitlements({ ownerId, academyId, session });
  const summary = {};
  for (const item of entitlements) summary[item.code] = (summary[item.code] || 0) + Number(item.quantity || 0);
  if (summary.document_studio_bundle) {
    summary.id_card_studio = Math.max(1, summary.id_card_studio || 0);
    summary.certificate_studio = Math.max(1, summary.certificate_studio || 0);
  }
  return { entitlements, summary };
};

export const getAcademyEntitlementSnapshot = async ({ ownerId, academyId }) => {
  const [plan, result] = await Promise.all([
    getEffectivePlan({ academyId }),
    summarizeEntitlements({ ownerId, academyId }),
  ]);
  const baseStudents = plan?.limits?.students === "unlimited" ? Number.MAX_SAFE_INTEGER : Number(plan?.limits?.students || 100);
  const branchBase = plan?.limits?.branches === "unlimited" ? Number.MAX_SAFE_INTEGER : Number(plan?.limits?.branches || 1);
  return {
    plan,
    entitlements: result.entitlements,
    summary: result.summary,
    limits: {
      students: baseStudents === Number.MAX_SAFE_INTEGER ? "unlimited" : baseStudents + (result.summary.student_capacity_500 || 0) * 500,
      branches: branchBase === Number.MAX_SAFE_INTEGER ? "unlimited" : branchBase + (result.summary.additional_branch || 0),
      idCardStudio: Boolean(result.summary.id_card_studio),
      certificateStudio: Boolean(result.summary.certificate_studio),
    },
  };
};

export const getAccountAcademyLimit = async ({ ownerId }) => {
  const { summary } = await summarizeEntitlements({ ownerId });
  return 1 + Number(summary.additional_academy || 0);
};

export const activateEntitlement = async ({ ownerId, academyId = null, addOn, quantity = 1, payment = null, source = "razorpay", actorId = null, startDate = new Date(), session = null }) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  const graceEndsAt = new Date(endDate);
  graceEndsAt.setDate(graceEndsAt.getDate() + 7);
  const [record] = await Entitlement.create([{
    owner: ownerId,
    academy: addOn.scope === "academy" ? academyId : null,
    addOn: addOn._id,
    code: addOn.code,
    quantity,
    startDate,
    endDate,
    graceEndsAt,
    source,
    unitPrice: addOn.price,
    priceVersion: addOn.version,
    currency: addOn.currency,
    payment: payment?._id || null,
    createdBy: actorId,
    updatedBy: actorId,
  }], { session });
  return record;
};
