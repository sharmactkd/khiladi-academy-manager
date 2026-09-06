import express from "express";
import {
  getMyPortalStudents,
  getPortalStudentProfile,
  getPortalStudentAttendance,
  getPortalStudentFees,
  getPortalStudentProgress,
  getPortalStudentDocuments,
} from "../controllers/parentPortalController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { parentLinkStudentIdValidator } from "../validators/parentLinkValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("parent", "student"));

router.get("/my-students", getMyPortalStudents);

router.get(
  "/students/:studentId/profile",
  parentLinkStudentIdValidator,
  validateRequest,
  getPortalStudentProfile
);

router.get(
  "/students/:studentId/attendance",
  parentLinkStudentIdValidator,
  validateRequest,
  getPortalStudentAttendance
);

router.get(
  "/students/:studentId/fees",
  parentLinkStudentIdValidator,
  validateRequest,
  getPortalStudentFees
);

router.get(
  "/students/:studentId/progress",
  parentLinkStudentIdValidator,
  validateRequest,
  getPortalStudentProgress
);

router.get(
  "/students/:studentId/documents",
  parentLinkStudentIdValidator,
  validateRequest,
  getPortalStudentDocuments
);

export default router;