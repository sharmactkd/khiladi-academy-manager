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

import {
  certificateTemplateIdValidator,
  createCertificateTemplateValidator,
  updateCertificateTemplateValidator,
} from "../validators/certificateValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(
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