import express from "express";

import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} from "../controllers/skillController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";

import {
  skillIdValidator,
  createSkillValidator,
  updateSkillValidator,
  listSkillsValidator,
} from "../validators/skillValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("analytics"));

router
  .route("/")
  .post(createSkillValidator, validateRequest, createSkill)
  .get(listSkillsValidator, validateRequest, getSkills);

router
  .route("/:id")
  .get(skillIdValidator, validateRequest, getSkillById)
  .patch(updateSkillValidator, validateRequest, updateSkill)
  .delete(skillIdValidator, validateRequest, deleteSkill);

export default router;