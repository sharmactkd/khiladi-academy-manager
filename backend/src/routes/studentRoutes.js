import express from "express";

import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  studentIdValidator,
  createStudentValidator,
  updateStudentValidator,
  listStudentsValidator,
} from "../validators/studentValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createStudentValidator, validateRequest, createStudent)
  .get(listStudentsValidator, validateRequest, getStudents);

router
  .route("/:id")
  .get(studentIdValidator, validateRequest, getStudentById)
  .patch(updateStudentValidator, validateRequest, updateStudent)
  .delete(studentIdValidator, validateRequest, deleteStudent);

export default router;