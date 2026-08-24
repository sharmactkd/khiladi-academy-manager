import express from "express";

import {
  createIdCardTemplate,
  getIdCardTemplates,
  getIdCardTemplateById,
  updateIdCardTemplate,
  deleteIdCardTemplate,
} from "../controllers/idCardTemplateController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

import {
  idCardTemplateIdValidator,
  createIdCardTemplateValidator,
  updateIdCardTemplateValidator,
} from "../validators/idCardValidator.js";

const router = express.Router();

const templateBackgroundUpload = uploadImage.fields([
  { name: "frontBackground", maxCount: 1 },
  { name: "backBackground", maxCount: 1 },
]);

const parseTemplateMultipart = (req, res, next) => {
  ["frontDesign", "backDesign", "customSize", "fields"].forEach((field) => {
    if (typeof req.body[field] !== "string") return;
    try { req.body[field] = JSON.parse(req.body[field]); } catch { /* validator handles invalid values */ }
  });
  if (typeof req.body.isDefault === "string") req.body.isDefault = req.body.isDefault === "true";
  next();
};

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(templateBackgroundUpload, parseTemplateMultipart, createIdCardTemplateValidator, validateRequest, createIdCardTemplate)
  .get(getIdCardTemplates);

router
  .route("/:id")
  .get(idCardTemplateIdValidator, validateRequest, getIdCardTemplateById)
  .patch(templateBackgroundUpload, parseTemplateMultipart, updateIdCardTemplateValidator, validateRequest, updateIdCardTemplate)
  .delete(idCardTemplateIdValidator, validateRequest, deleteIdCardTemplate);

export default router;
