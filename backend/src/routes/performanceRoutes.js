import express from "express";

import {
  getStudentPerformance,
  getAcademyPerformance,
  getBatchPerformance,
} from "../controllers/performanceController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";

import {
  studentPerformanceValidator,
  batchPerformanceValidator,
  academyPerformanceValidator,
} from "../validators/performanceValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("analytics"));

router.get(
  "/student/:studentId",
  studentPerformanceValidator,
  validateRequest,
  getStudentPerformance
);

router.get(
  "/academy",
  academyPerformanceValidator,
  validateRequest,
  getAcademyPerformance
);

router.get(
  "/batch/:batchId",
  batchPerformanceValidator,
  validateRequest,
  getBatchPerformance
);

export default router;