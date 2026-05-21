import express from "express";

import {
  createAcademy,
  getMyAcademy,
  updateMyAcademy,
} from "../controllers/academyController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  createAcademyValidator,
  updateAcademyValidator,
} from "../validators/academyValidator.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  allowRoles("academy_owner", "super_admin"),
  createAcademyValidator,
  validateRequest,
  createAcademy
);

router.get("/my", getMyAcademy);

router.patch(
  "/my",
  allowRoles("academy_owner", "super_admin"),
  updateAcademyValidator,
  validateRequest,
  updateMyAcademy
);

export default router;