import express from "express";

import { getAcademies, getAdminOverview, getSubscriptions, getUsers } from "../controllers/adminController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("super_admin"));

router.get("/users", getUsers);
router.get("/overview", getAdminOverview);
router.get("/academies", getAcademies);
router.get("/subscriptions", getSubscriptions);

export default router;
