import express from "express";

import {
  dashboardAnalytics,
  studentAnalytics,
  attendanceAnalytics,
  feeAnalytics,
  performanceAnalytics,
} from "../controllers/analyticsController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";
import { analyticsFilterValidator } from "../validators/analyticsValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("analytics"));

router.get(
  "/dashboard",
  analyticsFilterValidator,
  validateRequest,
  dashboardAnalytics
);

router.get(
  "/students",
  analyticsFilterValidator,
  validateRequest,
  studentAnalytics
);

router.get(
  "/attendance",
  analyticsFilterValidator,
  validateRequest,
  attendanceAnalytics
);

router.get("/fees", analyticsFilterValidator, validateRequest, feeAnalytics);

router.get(
  "/performance",
  analyticsFilterValidator,
  validateRequest,
  performanceAnalytics
);

export default router;