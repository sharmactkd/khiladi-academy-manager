import express from "express";

import {
  createSkillAssessment,
  getSkillAssessments,
  getStudentSkillProfile,
  getSkillAssessmentById,
  updateSkillAssessment,
  deleteSkillAssessment,
} from "../controllers/skillAssessmentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";

import {
  skillAssessmentIdValidator,
  studentSkillProfileValidator,
  listSkillAssessmentsValidator,
  createSkillAssessmentValidator,
  updateSkillAssessmentValidator,
} from "../validators/skillAssessmentValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("analytics"));

router
  .route("/")
  .post(createSkillAssessmentValidator, validateRequest, createSkillAssessment)
  .get(listSkillAssessmentsValidator, validateRequest, getSkillAssessments);

router.get(
  "/student/:studentId",
  studentSkillProfileValidator,
  validateRequest,
  getStudentSkillProfile
);

router
  .route("/:id")
  .get(skillAssessmentIdValidator, validateRequest, getSkillAssessmentById)
  .patch(
    updateSkillAssessmentValidator,
    validateRequest,
    updateSkillAssessment
  )
  .delete(skillAssessmentIdValidator, validateRequest, deleteSkillAssessment);

export default router;