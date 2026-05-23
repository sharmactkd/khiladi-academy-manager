import express from "express";
import {
  validateCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
} from "../controllers/couponController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  validateCouponValidator,
  createCouponValidator,
  updateCouponValidator,
} from "../validators/couponValidator.js";

const router = express.Router();

router.post(
  "/validate",
  protect,
  allowRoles("academy_owner", "super_admin"),
  resolveUserAcademy,
  requireResolvedAcademy,
  validateCouponValidator,
  validateRequest,
  validateCoupon
);

router.post(
  "/",
  protect,
  allowRoles("super_admin"),
  createCouponValidator,
  validateRequest,
  createCoupon
);

router.get(
  "/",
  protect,
  allowRoles("super_admin"),
  getCoupons
);

router.patch(
  "/:id",
  protect,
  allowRoles("super_admin"),
  updateCouponValidator,
  validateRequest,
  updateCoupon
);

export default router;