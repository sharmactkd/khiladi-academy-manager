import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowFeeManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import {
  createExpense,
  listExpenses,
  reverseExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.use(
  protect,
  allowFeeManagement,
  resolveUserAcademy,
  requireResolvedAcademy,
);

router.get("/", listExpenses);
router.post("/", createExpense);
router.post("/:id/reverse", reverseExpense);

export default router;
