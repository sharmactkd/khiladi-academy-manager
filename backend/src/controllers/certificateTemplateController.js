import CertificateTemplate from "../models/CertificateTemplate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const allowedFields = [
  "templateName",
  "certificateType",
  "backgroundImage",
  "layoutJson",
  "fields",
  "isDefault",
];

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

  const certificateType = payload.certificateType || "custom";

  if (payload.isDefault === true) {
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
  const certificateType = payload.certificateType || template.certificateType;

  if (payload.isDefault === true) {
    await unsetOtherDefaults({
      academyId: req.academyId,
      certificateType,
      templateId: template._id,
    });
  }

  Object.assign(template, payload, {
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

  template.isDeleted = true;
  template.deletedAt = new Date();
  template.updatedBy = req.user._id;

  await template.save();

  return successResponse(res, "Certificate template deleted successfully", {
    template,
  });
});