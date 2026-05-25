import express from "express";

import {
  importTournamentResultManually,
  getTournamentResultSyncs,
  getStudentTournamentResultSyncs,
  tournamentResultWebhook,
} from "../controllers/tournamentResultSyncController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { tournamentWebhookRateLimiter } from "../middlewares/rateLimiter.js";

import {
  importTournamentResultValidator,
  webhookTournamentResultValidator,
  listTournamentResultSyncValidator,
  tournamentResultSyncStudentIdValidator,
} from "../validators/tournamentResultSyncValidator.js";

const router = express.Router();

router.post(
  "/webhook",
  tournamentWebhookRateLimiter,
  webhookTournamentResultValidator,
  validateRequest,
  tournamentResultWebhook
);

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post(
  "/import",
  importTournamentResultValidator,
  validateRequest,
  importTournamentResultManually
);

router.get(
  "/",
  listTournamentResultSyncValidator,
  validateRequest,
  getTournamentResultSyncs
);

router.get(
  "/student/:studentId",
  tournamentResultSyncStudentIdValidator,
  validateRequest,
  getStudentTournamentResultSyncs
);

export default router;