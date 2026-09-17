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
import {
  allowAcademyManagement,
  requireAcademyOwner,
} from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { attendanceImportRateLimiter } from "../middlewares/rateLimiter.js";
import { requireAssistantAttendanceScope } from "../middlewares/assistantAttendanceScopeMiddleware.js";
import { requireStepUp } from "../middlewares/stepUpMiddleware.js";
import { applyImportedFees, previewImportedFees } from "../controllers/importedFeeReconciliationController.js";

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

router.get("/monthly-register", requireAssistantAttendanceScope, getMonthlyRegister);
router.get("/yearly-register", requireAssistantAttendanceScope, getYearlyRegister);
router.post("/monthly-register", requireAssistantAttendanceScope, saveMonthlyRegister);
router.patch("/monthly-register/order", requireAssistantAttendanceScope, moveMonthlyRegisterRow);
router.put("/day-note", requireAssistantAttendanceScope, upsertAttendanceDayNote);
router.delete("/day-note", requireAssistantAttendanceScope, removeAttendanceDayNote);

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
  requireAcademyOwner,
  requireStepUp("attendance:import"),
  attendanceImportRateLimiter,
  validateAttendanceImportRows,
  previewAttendanceImport
);

router.get("/imported-fees/preview", requireAcademyOwner, requireStepUp("fees:reconcile"), previewImportedFees);
router.post(
  "/imported-fees/apply",
  requireAcademyOwner,
  requireStepUp("fees:reconcile"),
  attendanceImportRateLimiter,
  applyImportedFees
);

router.post(
  "/import",
  requireAcademyOwner,
  requireStepUp("attendance:import"),
  attendanceImportRateLimiter,
  validateAttendanceImportRows,
  importJournal,
  importOldAttendance
);

router.post(
  "/mark",
  markAttendanceValidator,
  validateRequest,
  requireAssistantAttendanceScope,
  markAttendance
);

router.get(
  "/",
  attendanceListValidator,
  validateRequest,
  requireAssistantAttendanceScope,
  getAttendance
);

router.get(
  "/student/:studentId/yearly-profile",
  requireAssistantAttendanceScope,
  getStudentYearlyProfile
);

router.get(
  "/student/:studentId",
  studentAttendanceValidator,
  validateRequest,
  requireAssistantAttendanceScope,
  getStudentAttendance
);

router.get(
  "/batch/:batchId",
  batchAttendanceValidator,
  validateRequest,
  requireAssistantAttendanceScope,
  getBatchAttendance
);

export default router;
