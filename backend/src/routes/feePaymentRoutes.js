import express from "express";

import {
  createFeePayment,
  getFeePayments,
  getStudentFeePayments,
  getFeePaymentById,
  updateFeePayment,
  deleteFeePayment,
} from "../controllers/feePaymentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowFeeManagement } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  feePaymentIdValidator,
  createFeePaymentValidator,
  updateFeePaymentValidator,
  listFeePaymentsValidator,
} from "../validators/feeValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowFeeManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createFeePaymentValidator, validateRequest, createFeePayment)
  .get(listFeePaymentsValidator, validateRequest, getFeePayments);

router.get("/student/:studentId", getStudentFeePayments);

router
  .route("/:id")
  .get(feePaymentIdValidator, validateRequest, getFeePaymentById)
  .patch(updateFeePaymentValidator, validateRequest, updateFeePayment)
  .delete(feePaymentIdValidator, validateRequest, deleteFeePayment);

export default router;