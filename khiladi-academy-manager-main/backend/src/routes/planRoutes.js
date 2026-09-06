import express from "express";
import {
  getPlans,
  getPlanByCode,
  seedPlans,
  updatePlan,
} from "../controllers/planController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  planCodeValidator,
  updatePlanValidator,
} from "../validators/planValidator.js";

const router = express.Router();

router.get("/", getPlans);
router.get("/:code", planCodeValidator, validateRequest, getPlanByCode);

router.post(
  "/seed-defaults",
  protect,
  allowRoles("super_admin"),
  seedPlans
);

router.patch(
  "/:id",
  protect,
  allowRoles("super_admin"),
  updatePlanValidator,
  validateRequest,
  updatePlan
);

export default router;