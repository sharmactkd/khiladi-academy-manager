import express from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  notificationIdValidator,
  listNotificationsValidator,
} from "../validators/notificationValidator.js";

const router = express.Router();

router.use(protect);

router.get("/", listNotificationsValidator, validateRequest, getNotifications);

router.patch("/read-all", markAllNotificationsRead);

router.patch(
  "/:id/read",
  notificationIdValidator,
  validateRequest,
  markNotificationRead
);

export default router;