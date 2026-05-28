import mongoose from "mongoose";

import Academy from "../models/Academy.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import FeePlan from "../models/FeePlan.js";
import FeePayment from "../models/FeePayment.js";

export const getMonthYearNow = () => {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

export const buildFeeMonthKey = (month, year) => {
  return `${year}-${String(month).padStart(2, "0")}`;
};

export const getMonthName = (month) => {
  return new Date(2000, Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
};

export const buildDueDate = (month, year, dueDay = 10) => {
  const safeMonth = Number(month);
  const safeYear = Number(year);
  const safeDueDay = Math.min(Math.max(Number(dueDay || 10), 1), 31);
  const lastDay = new Date(safeYear, safeMonth, 0).getDate();

  return new Date(safeYear, safeMonth - 1, Math.min(safeDueDay, lastDay));
};

export const generateReceiptNumber = async (academyId) => {
  const year = new Date().getFullYear();
  const prefix = `KAM-${year}`;
  const count = await FeePayment.countDocuments({
    academy: academyId,
    receiptNumber: {
      $regex: `^${prefix}`,
    },
  });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
};

export const getStudentFullName = (student) => {
  if (!student) return "";
  return `${student.firstName || ""} ${student.lastName || ""}`.trim();
};

export const validateStudentInAcademy = async (academyId, studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return null;
  }

  return Student.findOne({
    _id: studentId,
    academy: academyId,
  }).populate("batch", "batchName martialArt isActive");
};

export const validateBatchInAcademy = async (academyId, batchId) => {
  if (!batchId) return null;

  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    return null;
  }

  return Batch.findOne({
    _id: batchId,
    academy: academyId,
  });
};

export const getActiveFeePlanForStudent = async (student) => {
  if (!student?.academy) return null;

  if (student.batch?._id || student.batch) {
    const batchId = student.batch?._id || student.batch;

    const batchPlan = await FeePlan.findOne({
      academy: student.academy,
      batch: batchId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (batchPlan) {
      return batchPlan;
    }
  }

  return FeePlan.findOne({
    academy: student.academy,
    batch: null,
    isActive: true,
    isDefault: true,
  }).sort({ createdAt: -1 });
};

export const getAcademyDefaultFeeAmount = async (academyId) => {
  const academy = await Academy.findById(academyId).lean();

  return Number(
    academy?.settings?.defaultMonthlyFee ||
      academy?.defaultMonthlyFee ||
      0
  );
};

export const resolveStudentFeeConfig = async (student) => {
  const feePlan = await getActiveFeePlanForStudent(student);
  const academyDefaultAmount = await getAcademyDefaultFeeAmount(student.academy);

  const baseAmount =
    student.monthlyFeeOverride !== null &&
    student.monthlyFeeOverride !== undefined
      ? Number(student.monthlyFeeOverride || 0)
      : feePlan
        ? Number(feePlan.monthlyAmount || feePlan.amount || 0)
        : academyDefaultAmount;

  const dueDay =
    student.feeDueDay ||
    feePlan?.dueDay ||
    10;

  const scholarshipAmount = Number(student.scholarshipAmount || 0);
  const discountPercent = Number(student.discountPercent || 0);
  const percentDiscount = Math.round((baseAmount * discountPercent) / 100);
  const discount = Math.min(baseAmount, scholarshipAmount + percentDiscount);

  return {
    feePlan,
    baseAmount,
    dueDay,
    scholarshipAmount,
    discountPercent,
    discount,
    finalAmount: Math.max(baseAmount - discount, 0),
  };
};

export const calculateFeeStatus = ({
  payableAmount,
  paidAmount,
  dueDate,
}) => {
  const safePayable = Number(payableAmount || 0);
  const safePaid = Number(paidAmount || 0);

  if (safePayable > 0 && safePaid >= safePayable) {
    return "paid";
  }

  if (safePaid > 0 && safePaid < safePayable) {
    return "partial";
  }

  if (dueDate && new Date() > new Date(dueDate)) {
    return "overdue";
  }

  return "due";
};

export const getStudentMonthPaymentSummary = async ({
  academyId,
  studentId,
  month,
  year,
}) => {
  const payments = await FeePayment.find({
    academy: academyId,
    student: studentId,
    feeMonth: Number(month),
    feeYear: Number(year),
    status: {
      $ne: "cancelled",
    },
  }).sort({ paymentDate: -1 });

  const amountPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const latestPayment = payments[0] || null;

  return {
    payments,
    amountPaid,
    latestPayment,
  };
};

export const buildStudentFeeStatus = async ({
  academyId,
  student,
  month,
  year,
}) => {
  const feeConfig = await resolveStudentFeeConfig(student);
  const dueDate = buildDueDate(month, year, feeConfig.dueDay);

  const paymentSummary = await getStudentMonthPaymentSummary({
    academyId,
    studentId: student._id,
    month,
    year,
  });

  const status = calculateFeeStatus({
    payableAmount: feeConfig.finalAmount,
    paidAmount: paymentSummary.amountPaid,
    dueDate,
  });

  const pendingAmount = Math.max(
    feeConfig.finalAmount - paymentSummary.amountPaid,
    0
  );

  return {
    student: {
      _id: student._id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      name: getStudentFullName(student),
      phone: student.phone,
      email: student.email,
      batch: student.batch || null,
      status: student.status,
    },
    feePlan: feeConfig.feePlan || null,
    month,
    year,
    monthKey: buildFeeMonthKey(month, year),
    monthName: getMonthName(month),
    monthlyFee: feeConfig.baseAmount,
    discount: feeConfig.discount,
    payableAmount: feeConfig.finalAmount,
    paidAmount: paymentSummary.amountPaid,
    pendingAmount,
    dueDay: feeConfig.dueDay,
    dueDate,
    paidDate: paymentSummary.latestPayment?.paymentDate || null,
    paymentMode: paymentSummary.latestPayment?.paymentMode || "",
    receiptNumber: paymentSummary.latestPayment?.receiptNumber || "",
    paymentId: paymentSummary.latestPayment?._id || null,
    status,
  };
};

export const collectStudentFee = async ({
  academyId,
  userId,
  payload,
}) => {
  const student = await validateStudentInAcademy(academyId, payload.student);

  if (!student) {
    throw new Error("Student not found in your academy");
  }

  const feeMonth = Number(payload.feeMonth || payload.month);
  const feeYear = Number(payload.feeYear || payload.year);

  if (!feeMonth || !feeYear) {
    throw new Error("Fee month and year are required");
  }

  const feeConfig = await resolveStudentFeeConfig(student);

  const amount = Number(payload.amount ?? feeConfig.baseAmount ?? 0);
  const discount = Number(payload.discount ?? feeConfig.discount ?? 0);
  const finalAmount = Math.max(amount - discount, 0);
  const amountPaid = Number(payload.amountPaid ?? payload.paidAmount ?? finalAmount);
  const dueDay = Number(payload.dueDay || feeConfig.dueDay || 10);
  const dueDate = payload.dueDate || buildDueDate(feeMonth, feeYear, dueDay);
  const receiptNumber = await generateReceiptNumber(academyId);

  const existing = await FeePayment.findOne({
    academy: academyId,
    student: student._id,
    feeMonth,
    feeYear,
    status: {
      $ne: "cancelled",
    },
  });

  if (existing) {
    existing.amount = amount;
    existing.discount = discount;
    existing.finalAmount = finalAmount;
    existing.amountPaid = amountPaid;
    existing.pendingAmount = Math.max(finalAmount - amountPaid, 0);
    existing.paymentDate = payload.paymentDate || new Date();
    existing.paidDate = amountPaid >= finalAmount ? existing.paymentDate : null;
    existing.paymentMode = payload.paymentMode || existing.paymentMode || "cash";
    existing.dueDate = dueDate;
    existing.notes = payload.notes || payload.note || existing.notes || "";
    existing.note = payload.notes || payload.note || existing.note || "";
    existing.batch = student.batch?._id || student.batch || null;
    existing.feePlan = feeConfig.feePlan?._id || null;
    existing.updatedBy = userId;

    await existing.save();
    return existing;
  }

  return FeePayment.create({
    academy: academyId,
    student: student._id,
    batch: student.batch?._id || student.batch || null,
    feePlan: feeConfig.feePlan?._id || null,
    feeMonth,
    feeYear,
    month: buildFeeMonthKey(feeMonth, feeYear),
    amount,
    discount,
    finalAmount,
    amountPaid,
    pendingAmount: Math.max(finalAmount - amountPaid, 0),
    dueDate,
    paymentDate: payload.paymentDate || new Date(),
    paidDate: amountPaid >= finalAmount ? payload.paymentDate || new Date() : null,
    paymentMode: payload.paymentMode || "cash",
    receiptNumber,
    notes: payload.notes || payload.note || "",
    note: payload.notes || payload.note || "",
    collectedBy: userId,
    updatedBy: userId,
  });
};