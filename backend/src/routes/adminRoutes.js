import express from "express";

import { getAcademies, getAdminOverview, getSubscriptions, getUsers, updateAcademyPlatformStatus, updateUserPlatformStatus } from "../controllers/adminController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  getAdminAddOns,
  getAdminEntitlements,
  getAdminPlans,
  grantAdminEntitlement,
  revokeAdminEntitlement,
  updateAdminAddOn,
} from "../controllers/adminEntitlementController.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("super_admin"));

router.get("/users", getUsers);
router.get("/overview", getAdminOverview);
router.get("/academies", getAcademies);
router.get("/subscriptions", getSubscriptions);
router.patch("/users/:id/status", updateUserPlatformStatus);
router.patch("/academies/:id/status", updateAcademyPlatformStatus);
router.get("/add-ons", getAdminAddOns);
router.get("/plans", getAdminPlans);
router.get("/entitlements", getAdminEntitlements);
router.post("/entitlements", grantAdminEntitlement);
router.patch("/entitlements/:id/revoke", revokeAdminEntitlement);
router.patch("/add-ons/:id", updateAdminAddOn);

export default router;
