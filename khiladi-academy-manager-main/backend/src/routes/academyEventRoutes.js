import express from "express";

import {
  addEventParticipants,
  createAcademyEvent,
  deleteAcademyEvent,
  finalizeAcademyEvent,
  getAcademyEventById,
  getAcademyEvents,
  removeEventParticipant,
  updateAcademyEvent,
  updateEventParticipant,
} from "../controllers/academyEventController.js";
import { resolveUserAcademy, requireResolvedAcademy } from "../middlewares/academyAccessMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";

const router = express.Router();
router.use(protect, allowAcademyManagement, resolveUserAcademy, requireResolvedAcademy);

router.route("/").get(getAcademyEvents).post(createAcademyEvent);
router.route("/:id").get(getAcademyEventById).patch(updateAcademyEvent).delete(deleteAcademyEvent);
router.post("/:id/participants", addEventParticipants);
router.patch("/:id/participants/:participantId", updateEventParticipant);
router.delete("/:id/participants/:participantId", removeEventParticipant);
router.post("/:id/finalize", finalizeAcademyEvent);

export default router;
