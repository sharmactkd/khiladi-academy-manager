import IdCardTemplate from "../models/IdCardTemplate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const allowedFields = [
  "templateName",
  "frontDesign",
  "backDesign",
  "logo",
  "backgroundColor",
  "textColor",
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

const unsetOtherDefaults = async ({ academyId, templateId = null }) => {
  const filter = {
    academy: academyId,
    isDeleted: false,
  };

  if (templateId) {
    filter._id = { $ne: templateId };
  }

  await IdCardTemplate.updateMany(filter, {
    $set: {
      isDefault: false,
    },
  });
};

export const createIdCardTemplate = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  if (payload.isDefault === true) {
    await unsetOtherDefaults({
      academyId: req.academyId,
    });
  }

  const template = await IdCardTemplate.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "ID card template created successfully", {
    template,
  }, 201);
});

export const getIdCardTemplates = asyncHandler(async (req, res) => {
  const templates = await IdCardTemplate.find({
    academy: req.academyId,
    isDeleted: false,
  }).sort({ isDefault: -1, createdAt: -1 });

  return successResponse(res, "ID card templates fetched successfully", {
    templates,
  });
});

export const getIdCardTemplateById = asyncHandler(async (req, res) => {
  const template = await IdCardTemplate.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!template) {
    return errorResponse(res, "ID card template not found", 404);
  }

  return successResponse(res, "ID card template fetched successfully", {
    template,
  });
});

export const updateIdCardTemplate = asyncHandler(async (req, res) => {
  const template = await IdCardTemplate.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!template) {
    return errorResponse(res, "ID card template not found", 404);
  }

  const payload = buildPayload(req.body);

  if (payload.isDefault === true) {
    await unsetOtherDefaults({
      academyId: req.academyId,
      templateId: template._id,
    });
  }

  Object.assign(template, payload, {
    updatedBy: req.user._id,
  });

  await template.save();

  return successResponse(res, "ID card template updated successfully", {
    template,
  });
});

export const deleteIdCardTemplate = asyncHandler(async (req, res) => {
  const template = await IdCardTemplate.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!template) {
    return errorResponse(res, "ID card template not found", 404);
  }

  template.isDeleted = true;
  template.deletedAt = new Date();
  template.updatedBy = req.user._id;

  await template.save();

  return successResponse(res, "ID card template deleted successfully", {
    template,
  });
});