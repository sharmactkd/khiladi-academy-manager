import express from "express";

import {
  createMembershipAdjustment,
  getMembership,
  reverseAdjustment,
} from "../controllers/membershipController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import { allowFeeManagement } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(allowFeeManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.get("/student/:studentId", getMembership);
router.post("/student/:studentId/adjustments", createMembershipAdjustment);
router.post("/adjustments/:adjustmentId/reverse", reverseAdjustment);

export default router;
