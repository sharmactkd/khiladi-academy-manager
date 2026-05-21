import Academy from "../models/Academy.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const SAFE_ACADEMY_UPDATE_FIELDS = [
  "academyName",
  "martialArts",
  "logo",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "branchesEnabled",
  "settings",
];

const buildSafeUpdatePayload = (body) => {
  const payload = {};

  SAFE_ACADEMY_UPDATE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });

  return payload;
};

const createAuditLog = async ({ req, actor, action, academy, metadata = {} }) => {
  try {
    await AuditLog.create({
      actor: actor || null,
      action,
      entityType: "academy",
      entityId: academy?._id || null,
      metadata,
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
    });
  } catch {
    // Audit log failure should not break main request.
  }
};

export const createAcademy = asyncHandler(async (req, res) => {
  if (!["academy_owner", "super_admin"].includes(req.user.role)) {
    return errorResponse(res, "Only academy owner can create an academy", 403);
  }

  const ownerId =
    req.user.role === "super_admin" && req.body.owner ? req.body.owner : req.user._id;

  const existingAcademy = await Academy.findOne({ owner: ownerId });

  if (existingAcademy) {
    return errorResponse(res, "This owner already has an academy", 409);
  }

  const academy = await Academy.create({
    owner: ownerId,
    academyName: req.body.academyName,
    martialArts: req.body.martialArts,
    logo: req.body.logo,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country || "India",
    pincode: req.body.pincode,
    branchesEnabled: req.body.branchesEnabled,
    settings: req.body.settings,
  });

  await createAuditLog({
    req,
    actor: req.user._id,
    action: "ACADEMY_CREATED",
    academy,
    metadata: {
      academyName: academy.academyName,
      owner: academy.owner,
    },
  });

  return successResponse(
    res,
    "Academy created successfully",
    { academy },
    201
  );
});

export const getMyAcademy = asyncHandler(async (req, res) => {
  const academy = await Academy.findOne({ owner: req.user._id });

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  return successResponse(res, "Academy fetched successfully", { academy });
});

export const updateMyAcademy = asyncHandler(async (req, res) => {
  if (!["academy_owner", "super_admin"].includes(req.user.role)) {
    return errorResponse(res, "Only academy owner can update academy", 403);
  }

  const academy = await Academy.findOne({ owner: req.user._id });

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  const safePayload = buildSafeUpdatePayload(req.body);

  Object.assign(academy, safePayload);

  await academy.save();

  await createAuditLog({
    req,
    actor: req.user._id,
    action: "ACADEMY_UPDATED",
    academy,
    metadata: {
      updatedFields: Object.keys(safePayload),
    },
  });

  return successResponse(res, "Academy updated successfully", { academy });
});