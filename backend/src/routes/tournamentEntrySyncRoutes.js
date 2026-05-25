import express from "express";

import {
  createTournamentEntrySync,
  getTournamentEntrySyncs,
  getStudentTournamentEntrySyncs,
  cancelTournamentEntrySync,
} from "../controllers/tournamentEntrySyncController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  createTournamentEntrySyncValidator,
  listTournamentEntrySyncValidator,
  tournamentEntrySyncIdValidator,
  tournamentEntrySyncStudentIdValidator,
} from "../validators/tournamentEntrySyncValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createTournamentEntrySyncValidator, validateRequest, createTournamentEntrySync)
  .get(listTournamentEntrySyncValidator, validateRequest, getTournamentEntrySyncs);

router.get(
  "/student/:studentId",
  tournamentEntrySyncStudentIdValidator,
  validateRequest,
  getStudentTournamentEntrySyncs
);

router.patch(
  "/:id/cancel",
  tournamentEntrySyncIdValidator,
  validateRequest,
  cancelTournamentEntrySync
);

export default router;