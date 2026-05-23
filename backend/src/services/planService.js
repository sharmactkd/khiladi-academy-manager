import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

export const DEFAULT_PLANS = [
  {
    name: "Free",
    code: "free",
    description: "Starter plan for small academies.",
    price: 0,
    currency: "INR",
    billingCycle: "monthly",
    features: ["Basic academy management", "Students", "Batches"],
    limits: {
      students: 50,
      batches: 2,
      certificates: 0,
      idCards: 10,
      announcements: 5,
      parentPortal: false,
      whatsapp: false,
      analytics: false,
      multiBranch: false,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    name: "Basic",
    code: "basic",
    description: "Good for growing academies.",
    price: 499,
    currency: "INR",
    billingCycle: "monthly",
    features: ["Students", "Batches", "Fees", "Attendance"],
    limits: {
      students: 200,
      batches: 10,
      certificates: 100,
      idCards: 200,
      announcements: 50,
      parentPortal: false,
      whatsapp: false,
      analytics: false,
      multiBranch: false,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 2,
  },
  {
    name: "Pro",
    code: "pro",
    description: "Professional plan with parent portal and records.",
    price: 999,
    currency: "INR",
    billingCycle: "monthly",
    features: ["Parent Portal", "Certificates", "ID Cards", "Analytics Ready"],
    limits: {
      students: 1000,
      batches: 50,
      certificates: 1000,
      idCards: 1000,
      announcements: 500,
      parentPortal: true,
      whatsapp: false,
      analytics: true,
      multiBranch: false,
    },
    isActive: true,
    isPopular: true,
    sortOrder: 3,
  },
  {
    name: "Premium",
    code: "premium",
    description: "Premium plan for large academies.",
    price: 1999,
    currency: "INR",
    billingCycle: "monthly",
    features: ["WhatsApp Ready", "Multi-branch Ready", "Large limits"],
    limits: {
      students: 5000,
      batches: 200,
      certificates: 5000,
      idCards: 5000,
      announcements: 2000,
      parentPortal: true,
      whatsapp: true,
      analytics: true,
      multiBranch: true,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
  {
    name: "Enterprise",
    code: "enterprise",
    description: "Custom enterprise plan.",
    price: 0,
    currency: "INR",
    billingCycle: "custom",
    features: ["Unlimited usage", "Custom support", "Enterprise access"],
    limits: {
      students: "unlimited",
      batches: "unlimited",
      certificates: "unlimited",
      idCards: "unlimited",
      announcements: "unlimited",
      parentPortal: true,
      whatsapp: true,
      analytics: true,
      multiBranch: true,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 5,
  },
];

export const seedDefaultPlans = async ({ userId = null } = {}) => {
  const results = [];

  for (const plan of DEFAULT_PLANS) {
    const savedPlan = await Plan.findOneAndUpdate(
      { code: plan.code },
      {
        $set: {
          ...plan,
          updatedBy: userId,
        },
        $setOnInsert: {
          createdBy: userId,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    results.push(savedPlan);
  }

  return results;
};

export const getFreePlan = async () => {
  let plan = await Plan.findOne({ code: "free", isActive: true });

  if (!plan) {
    const seededPlans = await seedDefaultPlans();
    plan = seededPlans.find((item) => item.code === "free");
  }

  return plan;
};

export const getEffectiveSubscription = async ({ academyId }) => {
  const now = new Date();

  const subscription = await Subscription.findOne({
    academy: academyId,
    isCurrent: true,
    status: { $in: ["trial", "active", "lifetime", "admin_granted"] },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  }).populate("plan");

  if (subscription?.plan) {
    return subscription;
  }

  const freePlan = await getFreePlan();

  return {
    academy: academyId,
    plan: freePlan,
    planCode: "free",
    status: "active",
    isCurrent: true,
    source: "free",
  };
};

export const getEffectivePlan = async ({ academyId }) => {
  const subscription = await getEffectiveSubscription({ academyId });
  return subscription.plan;
};

export const hasFeature = async ({ academyId, featureName }) => {
  const plan = await getEffectivePlan({ academyId });
  return Boolean(plan?.limits?.[featureName]);
};

export const isLimitUnlimited = (limit) => {
  return limit === "unlimited";
};

export const getPlanLimit = async ({ academyId, resourceName }) => {
  const plan = await getEffectivePlan({ academyId });
  return plan?.limits?.[resourceName] ?? 0;
};