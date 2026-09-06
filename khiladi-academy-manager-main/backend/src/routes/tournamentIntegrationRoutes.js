import express from "express";

import {
  connectTournamentIntegration,
  getTournamentIntegrationStatus,
  disconnectTournamentIntegration,
  regenerateTournamentIntegrationKey,
  getTournamentIntegrationLogs,
} from "../controllers/tournamentIntegrationController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  requireAcademyOwner,
  allowRoles,
} from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  connectTournamentIntegrationValidator,
  listIntegrationLogsValidator,
} from "../validators/tournamentIntegrationValidator.js";

const router = express.Router();

router.use(protect);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post(
  "/connect",
  requireAcademyOwner,
  connectTournamentIntegrationValidator,
  validateRequest,
  connectTournamentIntegration
);

router.get(
  "/status",
  allowRoles("academy_owner", "assistant_coach", "super_admin"),
  getTournamentIntegrationStatus
);

router.patch(
  "/disconnect",
  requireAcademyOwner,
  disconnectTournamentIntegration
);

router.post(
  "/regenerate-key",
  requireAcademyOwner,
  regenerateTournamentIntegrationKey
);

router.get(
  "/logs",
  allowRoles("academy_owner", "super_admin"),
  listIntegrationLogsValidator,
  validateRequest,
  getTournamentIntegrationLogs
);

export default router;