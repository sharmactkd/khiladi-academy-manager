import express from "express";

import {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  getBatchAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  markAttendanceValidator,
  attendanceListValidator,
  studentAttendanceValidator,
  batchAttendanceValidator,
} from "../validators/attendanceValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post("/mark", markAttendanceValidator, validateRequest, markAttendance);

router.get("/", attendanceListValidator, validateRequest, getAttendance);

router.get(
  "/student/:studentId",
  studentAttendanceValidator,
  validateRequest,
  getStudentAttendance
);

router.get(
  "/batch/:batchId",
  batchAttendanceValidator,
  validateRequest,
  getBatchAttendance
);

export default router;