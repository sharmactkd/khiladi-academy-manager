import express from "express";
import { importJournal } from "../middlewares/importJournal.js";

import {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  getStudentYearlyProfile,
  getBatchAttendance,
  getMonthlyRegister,
  getYearlyRegister,
  saveMonthlyRegister,
  moveMonthlyRegisterRow,
  previewAttendanceImport,
  importOldAttendance,
  upsertAttendanceDayNote,
  removeAttendanceDayNote,
} from "../controllers/attendanceController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { attendanceImportRateLimiter } from "../middlewares/rateLimiter.js";

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

router.get("/monthly-register", getMonthlyRegister);
router.get("/yearly-register", getYearlyRegister);
router.post("/monthly-register", saveMonthlyRegister);
router.patch("/monthly-register/order", moveMonthlyRegisterRow);
router.put("/day-note", upsertAttendanceDayNote);
router.delete("/day-note", removeAttendanceDayNote);

const validateAttendanceImportRows = (req, res, next) => {
    const rows = req.body?.rows;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: "rows must be an array" });
    }
    if (rows.length > 5000) {
      return res.status(413).json({ success: false, message: "A maximum of 5,000 attendance rows can be imported at once" });
    }
    return next();
};

router.post(
  "/import/preview",
  attendanceImportRateLimiter,
  validateAttendanceImportRows,
  previewAttendanceImport
);

router.post(
  "/import",
  attendanceImportRateLimiter,
  validateAttendanceImportRows,
  importJournal,
  importOldAttendance
);

router.post("/mark", markAttendanceValidator, validateRequest, markAttendance);

router.get("/", attendanceListValidator, validateRequest, getAttendance);

router.get("/student/:studentId/yearly-profile", getStudentYearlyProfile);

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
