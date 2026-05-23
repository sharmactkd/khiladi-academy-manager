import express from "express";

import {
  getStudentTimeline,
  createStudentTimeline,
} from "../controllers/studentTimelineController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  createStudentTimelineValidator,
  listStudentTimelineValidator,
} from "../validators/studentTimelineValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post("/", createStudentTimelineValidator, validateRequest, createStudentTimeline);

router.get(
  "/:studentId",
  listStudentTimelineValidator,
  validateRequest,
  getStudentTimeline
);

export default router;