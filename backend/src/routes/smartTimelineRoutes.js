import express from "express";

import {
  getStudentSmartTimeline,
  generateStudentSmartTimeline,
} from "../controllers/smartTimelineController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";
import { smartTimelineStudentValidator } from "../validators/smartTimelineValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("analytics"));

router.get(
  "/student/:studentId",
  smartTimelineStudentValidator,
  validateRequest,
  getStudentSmartTimeline
);

router.post(
  "/generate/:studentId",
  smartTimelineStudentValidator,
  validateRequest,
  generateStudentSmartTimeline
);

export default router;