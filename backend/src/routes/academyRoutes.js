import express from "express";

import {
  createAcademy,
  getMyAcademy,
  updateMyAcademy,
} from "../controllers/academyController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

import {
  createAcademyValidator,
  updateAcademyValidator,
} from "../validators/academyValidator.js";

const router = express.Router();

router.use(protect);

const normalizeMultipartAcademy = (req, res, next) => {
  if (typeof req.body.martialArts === "string") {
    req.body.martialArts = req.body.martialArts
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  next();
};

router.post(
  "/",
  allowRoles("academy_owner", "super_admin"),
  uploadImage.single("logo"),
  normalizeMultipartAcademy,
  createAcademyValidator,
  validateRequest,
  createAcademy
);

router.get("/my", getMyAcademy);

router.patch(
  "/my",
  allowRoles("academy_owner", "super_admin"),
  uploadImage.single("logo"),
  normalizeMultipartAcademy,
  updateAcademyValidator,
  validateRequest,
  updateMyAcademy
);

export default router;