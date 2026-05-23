import express from "express";
import { getCommunicationLogs } from "../controllers/communicationLogController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { communicationLogsValidator } from "../validators/reminderValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.get("/", communicationLogsValidator, validateRequest, getCommunicationLogs);

export default router;