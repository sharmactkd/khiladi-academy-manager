import express from "express";

import {
  generateCertificate,
  getStudentCertificates,
  getCertificateById,
  updateCertificateStatus,
} from "../controllers/certificateController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  certificateIdValidator,
  certificateStudentIdValidator,
  generateCertificateValidator,
  updateCertificateStatusValidator,
} from "../validators/certificateValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post(
  "/generate",
  generateCertificateValidator,
  validateRequest,
  generateCertificate
);

router.get(
  "/student/:studentId",
  certificateStudentIdValidator,
  validateRequest,
  getStudentCertificates
);

router.get("/:id", certificateIdValidator, validateRequest, getCertificateById);

router.patch(
  "/:id/status",
  updateCertificateStatusValidator,
  validateRequest,
  updateCertificateStatus
);

export default router;