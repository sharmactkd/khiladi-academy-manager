import CertificateTemplate from "../models/CertificateTemplate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const allowedFields = [
  "templateName",
  "certificateType",
  "status",
  "pageSize",
  "customPageSize",
  "orientation",
  "backgroundImage",
  "layoutJson",
  "fields",
  "isDefault",
];

const uploadedPath = (file) => file ? `/${file.path.replace(/\\/g, "/")}` : "";

const applyUploads = (payload, files = {}) => {
  const background = uploadedPath(files.certificateBackground?.[0]);
  if (background) payload.backgroundImage = background;

  const signatureFiles = Array.from({ length: 6 }, (_, index) => files[`signature${index}`]?.[0]);
  if (signatureFiles.some(Boolean)) {
    const layout = { ...(payload.layoutJson || {}) };
    const signatures = [...(layout.signatures || [])];
    signatureFiles.forEach((file, index) => {
      if (file && signatures[index]) signatures[index] = { ...signatures[index], imageUrl: uploadedPath(file) };
    });
    payload.layoutJson = { ...layout, signatures };
  }
};

const buildPayload = (body) => {
  const payload = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });

  return payload;
};

const unsetOtherDefaults = async ({ academyId, certificateType, templateId = null }) => {
  const filter = {
    academy: academyId,
    certificateType,
    isDeleted: false,
  };

  if (templateId) {
    filter._id = { $ne: templateId };
  }

  await CertificateTemplate.updateMany(filter, {
    $set: {
      isDefault: false,
    },
  });
};

export const createCertificateTemplate = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);
  applyUploads(payload, req.files);

  const certificateType = payload.certificateType || "custom";

  if (payload.isDefault === true) {
    payload.status = "published";
    await unsetOtherDefaults({
      academyId: req.academyId,
      certificateType,
    });
  }

  const template = await CertificateTemplate.create({
    ...payload,
    certificateType,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Certificate template created successfully", {
    template,
  }, 201);
});

export const getCertificateTemplates = asyncHandler(async (req, res) => {
  const filter = {
    academy: req.academyId,
    isDeleted: false,
  };

  if (req.query.certificateType) {
    filter.certificateType = req.query.certificateType;
  }

  const templates = await CertificateTemplate.find(filter).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return successResponse(res, "Certificate templates fetched successfully", {
    templates,
  });
});

export const getCertificateTemplateById = asyncHandler(async (req, res) => {
  const template = await CertificateTemplate.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!template) {
    return errorResponse(res, "Certificate template not found", 404);
  }

  return successResponse(res, "Certificate template fetched successfully", {
    template,
  });
});

export const updateCertificateTemplate = asyncHandler(async (req, res) => {
  const template = await CertificateTemplate.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!template) {
    return errorResponse(res, "Certificate template not found", 404);
  }

  const payload = buildPayload(req.body);
  applyUploads(payload, req.files);
  const certificateType = payload.certificateType || template.certificateType;

  if (payload.isDefault === true) {
    payload.status = "published";
    await unsetOtherDefaults({
      academyId: req.academyId,
      certificateType,
      templateId: template._id,
    });
  }

  Object.assign(template, payload, {
    version: Number(template.version || 1) + 1,
    updatedBy: req.user._id,
  });

  await template.save();

  return successResponse(res, "Certificate template updated successfully", {
    template,
  });
});

export const deleteCertificateTemplate = asyncHandler(async (req, res) => {
  const template = await CertificateTemplate.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!template) {
    return errorResponse(res, "Certificate template not found", 404);
  }

  const wasDefault = template.isDefault;
  template.status = "archived";
  template.isDefault = false;
  template.isDeleted = true;
  template.deletedAt = new Date();
  template.updatedBy = req.user._id;

  await template.save();

  if (wasDefault) {
    const replacement = await CertificateTemplate.findOne({
      academy: req.academyId,
      certificateType: template.certificateType,
      _id: { $ne: template._id },
      isDeleted: false,
    }).sort({ status: -1, updatedAt: -1 });

    if (replacement) {
      replacement.isDefault = true;
      replacement.status = "published";
      replacement.updatedBy = req.user._id;
      await replacement.save();
    }
  }

  return successResponse(res, "Certificate template deleted successfully", {
    template,
  });
});
