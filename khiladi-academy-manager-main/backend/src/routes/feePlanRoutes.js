import express from "express";

import {
  createFeePlan,
  getFeePlans,
  getFeePlanById,
  updateFeePlan,
  deleteFeePlan,
} from "../controllers/feePlanController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowFeeManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  feePlanIdValidator,
  createFeePlanValidator,
  updateFeePlanValidator,
} from "../validators/feeValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowFeeManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createFeePlanValidator, validateRequest, createFeePlan)
  .get(getFeePlans);

router
  .route("/:id")
  .get(feePlanIdValidator, validateRequest, getFeePlanById)
  .put(updateFeePlanValidator, validateRequest, updateFeePlan)
  .patch(updateFeePlanValidator, validateRequest, updateFeePlan)
  .delete(feePlanIdValidator, validateRequest, deleteFeePlan);

export default router;