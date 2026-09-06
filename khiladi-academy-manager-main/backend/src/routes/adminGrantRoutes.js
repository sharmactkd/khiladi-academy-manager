import express from "express";
import {
  createAdminGrant,
  getAdminGrants,
  revokeAdminGrant,
} from "../controllers/adminGrantController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  createAdminGrantValidator,
  adminGrantIdValidator,
} from "../validators/adminGrantValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("super_admin"));

router
  .route("/")
  .post(createAdminGrantValidator, validateRequest, createAdminGrant)
  .get(getAdminGrants);

router.patch(
  "/:id/revoke",
  adminGrantIdValidator,
  validateRequest,
  revokeAdminGrant
);

export default router;