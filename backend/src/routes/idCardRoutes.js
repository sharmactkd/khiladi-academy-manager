import express from "express";

import {
  generateIdCard,
  getStudentIdCards,
  getIdCardById,
  updateIdCardStatus,
} from "../controllers/idCardController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  idCardIdValidator,
  idCardStudentIdValidator,
  generateIdCardValidator,
  updateIdCardStatusValidator,
} from "../validators/idCardValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post("/generate", generateIdCardValidator, validateRequest, generateIdCard);

router.get(
  "/student/:studentId",
  idCardStudentIdValidator,
  validateRequest,
  getStudentIdCards
);

router.get("/:id", idCardIdValidator, validateRequest, getIdCardById);

router.patch(
  "/:id/status",
  updateIdCardStatusValidator,
  validateRequest,
  updateIdCardStatus
);

export default router;