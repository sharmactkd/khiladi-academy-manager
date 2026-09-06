import express from "express";
import {
  sendFeeReminder,
  sendAttendanceReminder,
} from "../controllers/reminderController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement, allowRoles } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  feeReminderValidator,
  attendanceReminderValidator,
} from "../validators/reminderValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post(
  "/fee",
  allowRoles("super_admin", "academy_owner"),
  feeReminderValidator,
  validateRequest,
  sendFeeReminder
);

router.post(
  "/attendance",
  attendanceReminderValidator,
  validateRequest,
  sendAttendanceReminder
);

export default router;