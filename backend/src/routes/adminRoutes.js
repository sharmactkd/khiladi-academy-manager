import express from "express";

import { getUsers } from "../controllers/adminController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("super_admin"));

router.get("/users", getUsers);

export default router;