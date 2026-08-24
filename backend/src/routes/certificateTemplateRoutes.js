import express from "express";

import {
  createCertificateTemplate,
  getCertificateTemplates,
  getCertificateTemplateById,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from "../controllers/certificateTemplateController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

import {
  certificateTemplateIdValidator,
  createCertificateTemplateValidator,
  updateCertificateTemplateValidator,
} from "../validators/certificateValidator.js";

const router = express.Router();
const templateUploads = uploadImage.fields([
  { name: "certificateBackground", maxCount: 1 },
  ...Array.from({ length: 6 }, (_, index) => ({ name: `signature${index}`, maxCount: 1 })),
]);
const parseMultipartTemplate = (req, _res, next) => {
  ["layoutJson", "customPageSize", "fields"].forEach((key) => {
    if (typeof req.body[key] === "string") {
      try { req.body[key] = JSON.parse(req.body[key]); } catch { /* validation handles malformed values */ }
    }
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
  .post(
    templateUploads,
    parseMultipartTemplate,
    createCertificateTemplateValidator,
    validateRequest,
    createCertificateTemplate
  )
  .get(getCertificateTemplates);

router
  .route("/:id")
  .get(
    certificateTemplateIdValidator,
    validateRequest,
    getCertificateTemplateById
  )
  .patch(
    templateUploads,
    parseMultipartTemplate,
    updateCertificateTemplateValidator,
    validateRequest,
    updateCertificateTemplate
  )
  .delete(
    certificateTemplateIdValidator,
    validateRequest,
    deleteCertificateTemplate
  );

export default router;
