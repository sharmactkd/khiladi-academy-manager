import express from "express";
import { importJournal } from "../middlewares/importJournal.js";

import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  updateAllStudentsStatus,
  deleteAllStudents,
  deleteStudent,
  importStudents,
} from "../controllers/studentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  allowAcademyManagement,
  requireAcademyOwner,
} from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { enforceLimit } from "../middlewares/planLimitMiddleware.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";
import { requireStepUp } from "../middlewares/stepUpMiddleware.js";
import {
  expensiveOperationRateLimiter,
  studentImportRateLimiter,
} from "../middlewares/rateLimiter.js";

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

router.post(
  "/import",
  requireAcademyOwner,
  requireStepUp("students:import"),
  studentImportRateLimiter,
  (req, res, next) => {
    const rows = req.body?.students;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: "students must be an array" });
    }
    if (rows.length > 2000) {
      return res.status(413).json({ success: false, message: "A maximum of 2,000 students can be imported at once" });
    }
    return next();
  },
  importJournal,
  importStudents
);

router.patch(
  "/bulk/status",
  requireAcademyOwner,
  expensiveOperationRateLimiter,
  updateAllStudentsStatus
);

router.delete(
  "/bulk/all",
  requireAcademyOwner,
  requireStepUp("students:delete-all"),
  expensiveOperationRateLimiter,
  deleteAllStudents
);

router.patch(
  "/:id/status",
  studentIdValidator,
  validateRequest,
  updateStudentStatus
);

router
  .route("/")
  .post(
    uploadImage.single("profilePhoto"),
    createStudentValidator,
    validateRequest,
    enforceLimit("students"),
    createStudent
  )
  .get(listStudentsValidator, validateRequest, getStudents);

router
  .route("/:id")
  .get(studentIdValidator, validateRequest, getStudentById)
  .patch(
    uploadImage.single("profilePhoto"),
    updateStudentValidator,
    validateRequest,
    updateStudent
  )
  .delete(
    requireAcademyOwner,
    requireStepUp("students:delete-one"),
    studentIdValidator,
    validateRequest,
    deleteStudent
  );

export default router;
