import express from "express";

import {
  studentsReport,
  attendanceReport,
  feesReport,
  beltTestsReport,
  championshipsReport,
  certificatesReport,
  idCardsReport,
  branchesReport,
} from "../controllers/reportController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";
import { reportFilterValidator } from "../validators/reportValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("analytics"));

router.get("/students", reportFilterValidator, validateRequest, studentsReport);

router.get(
  "/attendance",
  reportFilterValidator,
  validateRequest,
  attendanceReport
);

router.get("/fees", reportFilterValidator, validateRequest, feesReport);

router.get(
  "/belt-tests",
  reportFilterValidator,
  validateRequest,
  beltTestsReport
);

router.get(
  "/championships",
  reportFilterValidator,
  validateRequest,
  championshipsReport
);

router.get(
  "/certificates",
  reportFilterValidator,
  validateRequest,
  certificatesReport
);

router.get("/id-cards", reportFilterValidator, validateRequest, idCardsReport);

router.get("/branches", reportFilterValidator, validateRequest, branchesReport);

export default router;