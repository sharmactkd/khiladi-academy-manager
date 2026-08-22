import mongoose from "mongoose";

import Branch from "../models/Branch.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Attendance from "../models/Attendance.js";
import FeePayment from "../models/FeePayment.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const OWNER_ROLES = ["academy_owner", "super_admin"];

const isOwnerRole = (user) => OWNER_ROLES.includes(user?.role);

const normalizeBranchCode = (value) => String(value || "").trim().toUpperCase();



const parseJsonIfNeeded = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeAdditionalCoaches = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((coach) => ({
      name: String(coach?.name || "").trim(),
      countryCode: String(coach?.countryCode || "+91").trim(),
      phone: String(coach?.phone || "").trim(),
      achievements: String(coach?.achievements || "").trim(),
    }))
    .filter((coach) => coach.name || coach.phone);
};

const normalizePhoneNumbers = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .slice(0, 4)
    .map((item, index) => ({
      countryCode: String(item?.countryCode || "+91").trim(),
      phone: String(item?.phone || "").trim(),
      isPrimary: index === 0,
    }))
    .filter((item, index) => index === 0 || item.phone);
};

const normalizeStringArray = (value) => {
  const parsed = parseJsonIfNeeded(value, value);

  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return Boolean(value);
};

const normalizeBranchPayload = (body = {}) => {
  const payload = {
    directorName: String(body.directorName || "").trim(),
    branchName: body.branchName,
    countryCode: body.countryCode || "+91",
    phone: body.phone || "",
    phoneNumbers: normalizePhoneNumbers(body.phoneNumbers),
    email: body.email || "",
    address: body.address || "",
    city: body.city || "",
    state: body.state || "",
    country: body.country || "India",
    currencyCode: String(body.currencyCode || "INR").trim().toUpperCase(),
    currencySymbol: String(body.currencySymbol || "₹").trim(),
    currencyCountryCode: String(body.currencyCountryCode || "IN").trim().toUpperCase(),

    headCoachName: body.headCoachName || "",
    headCoachCountryCode: body.headCoachCountryCode || "+91",
    headCoachPhone: body.headCoachPhone || "",
    headCoachAchievements: body.headCoachAchievements || "",

    assistantCoachName: body.assistantCoachName || "",
    assistantCoachCountryCode: body.assistantCoachCountryCode || "+91",
    assistantCoachPhone: body.assistantCoachPhone || "",
    assistantCoachAchievements: body.assistantCoachAchievements || "",

    additionalCoaches: normalizeAdditionalCoaches(body.additionalCoaches),
    branchSince: body.branchSince ? Number(body.branchSince) : null,

    facilities: normalizeStringArray(body.facilities),
    customFacilities: normalizeStringArray(body.customFacilities),
    languagesSpoken: normalizeStringArray(body.languagesSpoken),
    customLanguages: normalizeStringArray(body.customLanguages),

    isMainBranch: normalizeBoolean(body.isMainBranch, false),
    isActive: normalizeBoolean(body.isActive, true),
  };

  return payload;
};

const getAssignedBranchIdsForCoach = (user) => {
  const possibleValues = [
    user?.branch,
    user?.branchId,
    user?.assignedBranch,
    ...(Array.isArray(user?.branches) ? user.branches : []),
    ...(Array.isArray(user?.assignedBranches) ? user.assignedBranches : []),
  ].filter(Boolean);

  return possibleValues.map((value) => String(value));
};

const buildAssistantCoachBranchFilter = (req) => {
  if (req.user?.role !== "assistant_coach") return {};

  const assignedBranchIds = getAssignedBranchIdsForCoach(req.user);

  if (!assignedBranchIds.length) {
    return { _id: { $in: [] } };
  }

  return {
    _id: {
      $in: assignedBranchIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    },
  };
};

const validateAcademyUser = async ({ userId, academyId, allowedRoles }) => {
  if (!userId) return null;

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("Selected user not found");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Selected user must have role: ${allowedRoles.join(", ")}`);
  }

  if (user.role !== "super_admin" && !user.isActive) {
    throw new Error("Selected user is inactive");
  }

  return user;
};

const validateBranchUsers = async ({ manager, coaches, academyId }) => {
  if (manager) {
    await validateAcademyUser({
      userId: manager,
      academyId,
      allowedRoles: ["academy_owner", "assistant_coach", "super_admin"],
    });
  }

  if (Array.isArray(coaches) && coaches.length) {
    const uniqueCoaches = [...new Set(coaches.map(String))];

    for (const coachId of uniqueCoaches) {
      await validateAcademyUser({
        userId: coachId,
        academyId,
        allowedRoles: ["assistant_coach", "academy_owner", "super_admin"],
      });
    }

    return uniqueCoaches;
  }

  return [];
};

const unsetOtherMainBranches = async ({ academyId, branchId = null }) => {
  const query = {
    academy: academyId,
    isMainBranch: true,
  };

  if (branchId) {
    query._id = { $ne: branchId };
  }

  await Branch.updateMany(query, { $set: { isMainBranch: false } });
};

const getBranchCounts = async ({ academyId, branchId }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const baseFilter = {
    academy: academyId,
    branch: branchId,
  };

  const [
    students,
    activeStudents,
    batches,
    todayAttendanceDocs,
    pendingFeesResult,
  ] = await Promise.all([
    Student.countDocuments(baseFilter),
    Student.countDocuments({ ...baseFilter, status: "active" }),
    Batch.countDocuments({ ...baseFilter, isActive: true }),
    Attendance.find({
      ...baseFilter,
      date: { $gte: today, $lt: tomorrow },
    }).lean(),
    FeePayment.aggregate([
      {
        $match: {
          academy: new mongoose.Types.ObjectId(academyId),
          branch: new mongoose.Types.ObjectId(branchId),
          status: { $in: ["pending", "partial"] },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$pendingAmount", "$amount"],
            },
          },
        },
      },
    ]),
  ]);

  let totalMarked = 0;
  let presentToday = 0;

  todayAttendanceDocs.forEach((doc) => {
    (doc.records || []).forEach((record) => {
      totalMarked += 1;
      if (record.status === "present") presentToday += 1;
    });
  });

  const todayAttendancePercentage =
    totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

  return {
    students,
    activeStudents,
    batches,
    todayAttendancePercentage,
    pendingFeesTotal: pendingFeesResult?.[0]?.total || 0,
  };
};

export const createBranch = asyncHandler(async (req, res) => {
  if (!isOwnerRole(req.user)) {
    return errorResponse(res, "Only academy owner can create branches", 403);
  }

  const academyId = req.academyId;
  const cleanBranchCode = normalizeBranchCode(req.body.branchCode);

  const existing = await Branch.findOne({
    academy: academyId,
    branchCode: cleanBranchCode,
  });

  if (existing) {
    return errorResponse(res, "Branch code already exists in this academy", 409);
  }

  const validatedCoaches = await validateBranchUsers({
    manager: req.body.manager,
    coaches: req.body.coaches,
    academyId,
  });

  const payload = normalizeBranchPayload(req.body);

  if (payload.isMainBranch) {
    await unsetOtherMainBranches({ academyId });
  }

  const branch = await Branch.create({
    academy: academyId,
    branchCode: cleanBranchCode,
    ...payload,
    manager: req.body.manager || null,
    coaches: validatedCoaches,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Branch created successfully", branch, 201);
});

export const getBranches = asyncHandler(async (req, res) => {
  const { search = "", status = "active" } = req.query;

  const query = {
    academy: req.academyId,
    ...buildAssistantCoachBranchFilter(req),
  };

  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;

  if (search) {
    query.$or = [
      { branchName: { $regex: search, $options: "i" } },
      { branchCode: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
      { headCoachName: { $regex: search, $options: "i" } },
      { assistantCoachName: { $regex: search, $options: "i" } },
    ];
  }

  const branches = await Branch.find(query)
    .populate("manager", "name email phone role")
    .populate("coaches", "name email phone role")
    .sort({ isMainBranch: -1, branchName: 1 });

  return successResponse(res, "Branches fetched successfully", branches);
});

export const getBranchById = asyncHandler(async (req, res) => {
  const query = {
    _id: req.params.id,
    academy: req.academyId,
    ...buildAssistantCoachBranchFilter(req),
  };

  const branch = await Branch.findOne(query)
    .populate("manager", "name email phone role")
    .populate("coaches", "name email phone role");

  if (!branch) {
    return errorResponse(res, "Branch not found", 404);
  }

  const counts = await getBranchCounts({
    academyId: req.academyId,
    branchId: branch._id,
  });

  return successResponse(res, "Branch fetched successfully", {
    branch,
    counts,
  });
});

export const updateBranch = asyncHandler(async (req, res) => {
  if (!isOwnerRole(req.user)) {
    return errorResponse(res, "Only academy owner can update branches", 403);
  }

  const branch = await Branch.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!branch) {
    return errorResponse(res, "Branch not found", 404);
  }

  if (req.body.branchCode !== undefined) {
    const cleanBranchCode = normalizeBranchCode(req.body.branchCode);

    const duplicate = await Branch.findOne({
      academy: req.academyId,
      branchCode: cleanBranchCode,
      _id: { $ne: branch._id },
    });

    if (duplicate) {
      return errorResponse(
        res,
        "Branch code already exists in this academy",
        409
      );
    }

    branch.branchCode = cleanBranchCode;
  }

  if (req.body.manager !== undefined || req.body.coaches !== undefined) {
    const validatedCoaches = await validateBranchUsers({
      manager: req.body.manager,
      coaches: req.body.coaches,
      academyId: req.academyId,
    });

    if (req.body.manager !== undefined) {
      branch.manager = req.body.manager || null;
    }

    if (req.body.coaches !== undefined) {
      branch.coaches = validatedCoaches;
    }
  }

  const payload = normalizeBranchPayload(req.body);

  // A partial update must never erase fields omitted by an older client.
  Object.keys(payload).forEach((field) => {
    if (req.body[field] === undefined) delete payload[field];
  });

  Object.assign(branch, payload);

  if (payload.isMainBranch === true) {
    await unsetOtherMainBranches({
      academyId: req.academyId,
      branchId: branch._id,
    });
  }

  branch.updatedBy = req.user._id;

  await branch.save();

  return successResponse(res, "Branch updated successfully", branch);
});

export const deleteBranch = asyncHandler(async (req, res) => {
  if (!isOwnerRole(req.user)) {
    return errorResponse(res, "Only academy owner can delete branches", 403);
  }

  const branch = await Branch.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!branch) {
    return errorResponse(res, "Branch not found", 404);
  }

  branch.isActive = false;
  branch.isMainBranch = false;
  branch.updatedBy = req.user._id;

  await branch.save();

  return successResponse(res, "Branch deactivated successfully", branch);
});
