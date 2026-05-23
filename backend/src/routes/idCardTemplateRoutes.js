import express from "express";

import {
  createIdCardTemplate,
  getIdCardTemplates,
  getIdCardTemplateById,
  updateIdCardTemplate,
  deleteIdCardTemplate,
} from "../controllers/idCardTemplateController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  idCardTemplateIdValidator,
  createIdCardTemplateValidator,
  updateIdCardTemplateValidator,
} from "../validators/idCardValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createIdCardTemplateValidator, validateRequest, createIdCardTemplate)
  .get(getIdCardTemplates);

router
  .route("/:id")
  .get(idCardTemplateIdValidator, validateRequest, getIdCardTemplateById)
  .patch(updateIdCardTemplateValidator, validateRequest, updateIdCardTemplate)
  .delete(idCardTemplateIdValidator, validateRequest, deleteIdCardTemplate);

export default router;