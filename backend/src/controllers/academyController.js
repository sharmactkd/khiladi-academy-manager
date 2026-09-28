import Academy from "../models/Academy.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { uploadedFileReference } from "../services/mediaStorageService.js";
import { normalizeStringList } from "../utils/normalizeStringList.js";
import { getAccountAcademyLimit } from "../services/entitlementService.js";

const requestedAcademyId = (req) => req.headers?.["x-academy-id"] || req.query?.academyId || null;

const findOwnedAcademy = async (req) => {
  const requested = requestedAcademyId(req);
  if (req.user.role === "super_admin" && requested) return Academy.findById(requested);
  if (requested) return Academy.findOne({ _id: requested, owner: req.user._id });
  return Academy.findOne({ owner: req.user._id }).sort({ createdAt: 1 });
};

const SAFE_ACADEMY_UPDATE_FIELDS = [
  "ownerName",
  "academyName",
  "martialArts",
  "since",
  "about",
  "affiliations",
  "socialLinks",
  "logo",
  "countryCode",
  "phone",
  "phoneNumbers",
  "email",
  "address",
  "city",
  "state",
  "country",
  "branchesEnabled",
  "settings",
];

const getUploadedFilePath = (file) => {
  return uploadedFileReference(file);
};

const parseJsonIfNeeded = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeAffiliations = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      type: ["affiliation", "recognition", "registration", "other"].includes(item?.type)
        ? item.type
        : "affiliation",
      organizationName: String(item?.organizationName || "").trim(),
      registrationNumber: String(item?.registrationNumber || "").trim(),
    }))
    .filter((item) => item.organizationName || item.registrationNumber);
};

const normalizePhoneNumbers = (value, fallback = {}) => {
  const parsed = parseJsonIfNeeded(value, []);
  const source = Array.isArray(parsed) ? parsed : [];

  const normalized = source
    .slice(0, 4)
    .map((item, index) => ({
      countryCode: String(item?.countryCode || "+91").trim() || "+91",
      phone: String(item?.phone || "").trim(),
      isPrimary: index === 0,
    }))
    .filter((item, index) => index === 0 || item.phone);

  if (!normalized.length && (fallback.phone || fallback.countryCode)) {
    normalized.push({
      countryCode: String(fallback.countryCode || "+91").trim(),
      phone: String(fallback.phone || "").trim(),
      isPrimary: true,
    });
  }

  return normalized;
};

const normalizeSocialLinks = (value) => {
  const parsed = parseJsonIfNeeded(value, {});

  return {
    website: String(parsed?.website || "").trim(),
    instagram: String(parsed?.instagram || "").trim(),
    facebook: String(parsed?.facebook || "").trim(),
    youtube: String(parsed?.youtube || "").trim(),
  };
};

const normalizeAcademyPayload = (body = {}) => {
  const payload = {};

  SAFE_ACADEMY_UPDATE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(body, "martialArts")) {
    payload.martialArts = normalizeStringList(body.martialArts, { maxItems: 30, maxLength: 60 });
  }

  if (Object.prototype.hasOwnProperty.call(body, "affiliations")) {
    payload.affiliations = normalizeAffiliations(body.affiliations);
  }

  if (
    Object.prototype.hasOwnProperty.call(body, "phoneNumbers") ||
    Object.prototype.hasOwnProperty.call(body, "phone") ||
    Object.prototype.hasOwnProperty.call(body, "countryCode")
  ) {
    payload.phoneNumbers = normalizePhoneNumbers(body.phoneNumbers, body);

    if (payload.phoneNumbers[0]) {
      payload.countryCode = payload.phoneNumbers[0].countryCode;
      payload.phone = payload.phoneNumbers[0].phone;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "socialLinks")) {
    payload.socialLinks = normalizeSocialLinks(body.socialLinks);
  }

  if (Object.prototype.hasOwnProperty.call(body, "since")) {
    payload.since = body.since ? Number(body.since) : null;
  }

  return payload;
};

const createAuditLog = async ({
  req,
  user = null,
  academy = null,
  action,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      user,
      academy,
      action,
      module: "academy",
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
      metadata,
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
    req.user.role === "super_admin" && req.body.owner
      ? req.body.owner
      : req.user._id;

  const ownedAcademies = await Academy.countDocuments({ owner: ownerId, isActive: { $ne: false } });
  if (req.user.role !== "super_admin") {
    const academyLimit = await getAccountAcademyLimit({ ownerId });
    if (ownedAcademies >= academyLimit) {
      return errorResponse(res, `Academy limit reached (${academyLimit}). Add an Additional Academy subscription to continue.`, 403);
    }
  }

  const logo = getUploadedFilePath(req.file) || req.body.logo || "";
  const payload = normalizeAcademyPayload(req.body);

  const academy = await Academy.create({
    owner: ownerId,
    ...payload,
    logo,
    countryCode: payload.countryCode || "+91",
    country: payload.country || "India",
    branchesEnabled: payload.branchesEnabled,
    settings: payload.settings,
  });

  await createAuditLog({
    req,
    user: req.user._id,
    academy: academy._id,
    action: "ACADEMY_CREATED",
    metadata: {
      academyName: academy.academyName,
      owner: academy.owner,
    },
  });

  return successResponse(res, "Academy created successfully", { academy }, 201);
});

export const getMyAcademy = asyncHandler(async (req, res) => {
  const academy = await findOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  return successResponse(res, "Academy fetched successfully", { academy });
});

export const getMyAcademies = asyncHandler(async (req, res) => {
  const filter = req.user.role === "super_admin" ? {} : { owner: req.user._id };
  const academies = await Academy.find(filter).sort({ createdAt: 1 });
  return successResponse(res, "Academies fetched successfully", { academies });
});

export const updateMyAcademy = asyncHandler(async (req, res) => {
  if (!["academy_owner", "super_admin"].includes(req.user.role)) {
    return errorResponse(res, "Only academy owner can update academy", 403);
  }

  const academy = await findOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  const safePayload = normalizeAcademyPayload(req.body);

  if (req.file) {
    safePayload.logo = getUploadedFilePath(req.file);
  }

  Object.assign(academy, safePayload);

  await academy.save();

  await createAuditLog({
    req,
    user: req.user._id,
    academy: academy._id,
    action: "ACADEMY_UPDATED",
    metadata: {
      updatedFields: Object.keys(safePayload),
    },
  });

  return successResponse(res, "Academy updated successfully", { academy });
});
