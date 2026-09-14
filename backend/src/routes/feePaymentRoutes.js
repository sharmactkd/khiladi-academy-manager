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
  reverseFeePayment,
} from "../controllers/feePaymentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowFeeManagement } from "../middlewares/roleMiddleware.js";

import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";

import validateRequest from "../middlewares/validateRequest.js";
import { repairFeeIntegrity, scanFeeIntegrity } from "../controllers/feeIntegrityController.js";

import {
  feePaymentIdValidator,
  createFeePaymentValidator,
  updateFeePaymentValidator,
  reverseFeePaymentValidator,
  listFeePaymentsValidator,
} from "../validators/feeValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowFeeManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.get("/dashboard", getFeesDashboard);
router.get("/integrity/scan", scanFeeIntegrity);
router.post("/integrity/repair", repairFeeIntegrity);

router.get(
  "/students-status",
  listFeePaymentsValidator,
  validateRequest,
  getStudentsFeeStatus
);

router.post(
  "/:id/reverse",
  reverseFeePaymentValidator,
  validateRequest,
  reverseFeePayment
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
