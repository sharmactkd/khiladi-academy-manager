import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getMyAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { enforceLimit } from "../middlewares/planLimitMiddleware.js";
import {
  announcementIdValidator,
  createAnnouncementValidator,
  updateAnnouncementValidator,
  listAnnouncementsValidator,
} from "../validators/announcementValidator.js";

const router = express.Router();

router.use(protect);

router.get("/my", getMyAnnouncements);

router.get("/:id", announcementIdValidator, validateRequest, getAnnouncementById);

router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(
    createAnnouncementValidator,
    validateRequest,
    enforceLimit("announcements"),
    createAnnouncement
  )
  .get(listAnnouncementsValidator, validateRequest, getAnnouncements);

router
  .route("/:id")
  .patch(updateAnnouncementValidator, validateRequest, updateAnnouncement)
  .delete(announcementIdValidator, validateRequest, deleteAnnouncement);

export default router;