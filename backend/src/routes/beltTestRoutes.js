import express from "express";

import {
  createBeltTest,
  getBeltTests,
  getBeltTestById,
  getStudentBeltTests,
  updateBeltTest,
  deleteBeltTest,
} from "../controllers/beltTestController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  beltTestIdValidator,
  beltTestStudentIdValidator,
  createBeltTestValidator,
  updateBeltTestValidator,
  listBeltTestsValidator,
} from "../validators/beltTestValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createBeltTestValidator, validateRequest, createBeltTest)
  .get(listBeltTestsValidator, validateRequest, getBeltTests);

router.get(
  "/student/:studentId",
  beltTestStudentIdValidator,
  validateRequest,
  getStudentBeltTests
);

router
  .route("/:id")
  .get(beltTestIdValidator, validateRequest, getBeltTestById)
  .patch(updateBeltTestValidator, validateRequest, updateBeltTest)
  .delete(beltTestIdValidator, validateRequest, deleteBeltTest);

export default router;