import express from "express";

import {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  hardDeleteBatch,
} from "../controllers/batchController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { enforceLimit } from "../middlewares/planLimitMiddleware.js";

import {
  batchIdValidator,
  createBatchValidator,
  updateBatchValidator,
  listBatchesValidator,
} from "../validators/batchValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(
    createBatchValidator,
    validateRequest,
    enforceLimit("batches"),
    createBatch
  )
  .get(listBatchesValidator, validateRequest, getBatches);

router.delete(
  "/:id/hard-delete",
  batchIdValidator,
  validateRequest,
  hardDeleteBatch
);

router
  .route("/:id")
  .get(batchIdValidator, validateRequest, getBatchById)
  .patch(updateBatchValidator, validateRequest, updateBatch)
  .delete(batchIdValidator, validateRequest, deleteBatch);

export default router;