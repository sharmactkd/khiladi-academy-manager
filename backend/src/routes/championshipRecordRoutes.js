import express from "express";

import {
  createChampionshipRecord,
  getChampionshipRecords,
  getChampionshipRecordById,
  getStudentChampionshipRecords,
  updateChampionshipRecord,
  deleteChampionshipRecord,
} from "../controllers/championshipRecordController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  championshipRecordIdValidator,
  championshipStudentIdValidator,
  createChampionshipRecordValidator,
  updateChampionshipRecordValidator,
  listChampionshipRecordsValidator,
} from "../validators/championshipRecordValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(
    createChampionshipRecordValidator,
    validateRequest,
    createChampionshipRecord
  )
  .get(
    listChampionshipRecordsValidator,
    validateRequest,
    getChampionshipRecords
  );

router.get(
  "/student/:studentId",
  championshipStudentIdValidator,
  validateRequest,
  getStudentChampionshipRecords
);

router
  .route("/:id")
  .get(championshipRecordIdValidator, validateRequest, getChampionshipRecordById)
  .patch(
    updateChampionshipRecordValidator,
    validateRequest,
    updateChampionshipRecord
  )
  .delete(
    championshipRecordIdValidator,
    validateRequest,
    deleteChampionshipRecord
  );

export default router;