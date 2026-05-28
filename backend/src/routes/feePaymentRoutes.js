import express from "express";

import {
  collectFee,
  getFeePayments,
  getFeesDashboard,
  getStudentsFeeStatus,
  getPendingFees,
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

router.get("/dashboard", getFeesDashboard);

router.get(
  "/students-status",
  listFeePaymentsValidator,
  validateRequest,
  getStudentsFeeStatus
);

router.get(
  "/pending",
  listFeePaymentsValidator,
  validateRequest,
  getPendingFees
);

router.post(
  "/collect",
  createFeePaymentValidator,
  validateRequest,
  collectFee
);

router
  .route("/")
  .post(
    createFeePaymentValidator,
    validateRequest,
    collectFee
  )
  .get(
    listFeePaymentsValidator,
    validateRequest,
    getFeePayments
  );

router.get(
  "/payments",
  listFeePaymentsValidator,
  validateRequest,
  getFeePayments
);

router.get("/student/:studentId", getStudentFeePayments);

router.get(
  "/receipt/:id",
  feePaymentIdValidator,
  validateRequest,
  getFeePaymentById
);

router
  .route("/:id")
  .get(
    feePaymentIdValidator,
    validateRequest,
    getFeePaymentById
  )
  .put(
    updateFeePaymentValidator,
    validateRequest,
    updateFeePayment
  )
  .patch(
    updateFeePaymentValidator,
    validateRequest,
    updateFeePayment
  )
  .delete(
    feePaymentIdValidator,
    validateRequest,
    deleteFeePayment
  );

export default router;