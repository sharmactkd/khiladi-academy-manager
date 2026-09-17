import mongoose from "mongoose";

import Academy from "../models/Academy.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import FeePlan from "../models/FeePlan.js";
import FeePayment from "../models/FeePayment.js";
import StudentMembership from "../models/StudentMembership.js";
import Sequence from "../models/Sequence.js";
import { getCurrencySymbol } from "../utils/currency.js";
import { addBillingMonthsClamped, calculateAccruedUnpaidMonths } from "../utils/membershipMonthlyDue.js";
import { resolveFeeStatus } from "../utils/feeStatus.js";
import { getMembershipMap, serializeMembership } from "./membershipService.js";

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

export const generateReceiptNumber = async (academyId, session = null) => {
  const year = new Date().getFullYear();
  const prefix = `KAM-${year}`;

  const counter = await Sequence.findOneAndUpdate(
    { scope: `fee-receipt:${academyId}:${year}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );

  return `${prefix}-${String(counter.value).padStart(5, "0")}`;
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
  }).populate("batch", "batchName martialArt isActive monthlyFee quarterlyFee annualFee feeDueDay").populate("branch", "branchName currencyCode currencySymbol currencyCountryCode");
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

export const getBatchMonthlyFeeAmount = async (student) => {
  if (!student?.batch) return 0;

  if (typeof student.batch === "object" && student.batch.monthlyFee !== undefined) {
    return Number(student.batch.monthlyFee || 0);
  }

  const batch = await Batch.findOne({
    _id: student.batch,
    academy: student.academy,
  }).select("monthlyFee");

  return Number(batch?.monthlyFee || 0);
};

export const getBatchFeeDueDay = async (student) => {
  if (!student?.batch) return null;

  if (typeof student.batch === "object" && student.batch.feeDueDay !== undefined) {
    return Number(student.batch.feeDueDay || 10);
  }

  const batch = await Batch.findOne({
    _id: student.batch,
    academy: student.academy,
  }).select("feeDueDay");

  return batch?.feeDueDay || null;
};

export const resolveStudentFeeConfig = async (student) => {
  const feePlan = await getActiveFeePlanForStudent(student);
  const academyDefaultAmount = await getAcademyDefaultFeeAmount(student.academy);
  const batchMonthlyAmount = await getBatchMonthlyFeeAmount(student);
  const batchDueDay = await getBatchFeeDueDay(student);

  const hasStudentOverride =
    student.monthlyFeeOverride !== null &&
    student.monthlyFeeOverride !== undefined &&
    Number(student.monthlyFeeOverride) > 0;

  const hasBatchFee = Number(batchMonthlyAmount || 0) > 0;

  const hasFeePlanAmount =
    feePlan &&
    Number(feePlan.monthlyAmount || feePlan.amount || 0) > 0;

  const baseAmount = hasStudentOverride
    ? Number(student.monthlyFeeOverride || 0)
    : hasBatchFee
      ? Number(batchMonthlyAmount || 0)
      : hasFeePlanAmount
        ? Number(feePlan.monthlyAmount || feePlan.amount || 0)
        : academyDefaultAmount;

  const dueDay =
    student.feeDueDay ||
    batchDueDay ||
    feePlan?.dueDay ||
    10;

  const scholarshipAmount = Number(student.scholarshipAmount || 0);
  const discountPercent = Number(student.discountPercent || 0);
  const percentDiscount = Math.round((baseAmount * discountPercent) / 100);
  const discount = Math.min(baseAmount, scholarshipAmount + percentDiscount);

  return {
    feePlan,
    baseAmount,
    batchMonthlyAmount,
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

  return resolveFeeStatus({ payableAmount: safePayable, paidAmount: safePaid }).code;
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
  const membershipDocument = await StudentMembership.findOne({ academy: academyId, student: student._id }).lean();
  const membership = membershipDocument ? serializeMembership(membershipDocument) : null;
  const dueDate = buildDueDate(month, year, feeConfig.dueDay);

  const paymentSummary = await getStudentMonthPaymentSummary({
    academyId,
    studentId: student._id,
    month,
    year,
  });

  const ledgerStatus = calculateFeeStatus({
    payableAmount: feeConfig.finalAmount,
    paidAmount: paymentSummary.amountPaid,
    dueDate,
  });
  const status = membership?.feeStatusSummary?.code || ledgerStatus;

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
      branch: student.branch || null,
      status: student.status,
    },
    feePlan: feeConfig.feePlan || null,
    month,
    year,
    monthKey: buildFeeMonthKey(month, year),
    monthName: getMonthName(month),
    monthlyFee: feeConfig.baseAmount,
    batchMonthlyFee: feeConfig.batchMonthlyAmount,
    discount: feeConfig.discount,
    payableAmount: feeConfig.finalAmount,
    paidAmount: paymentSummary.amountPaid,
    pendingAmount,
    dueDay: feeConfig.dueDay,
    dueDate: membership?.effectiveDueDate || dueDate,
    paidDate: paymentSummary.latestPayment?.paymentDate || null,
    paymentMode: paymentSummary.latestPayment?.paymentMode || "",
    receiptNumber: paymentSummary.latestPayment?.receiptNumber || "",
    paymentId: paymentSummary.latestPayment?._id || null,
    status,
    feeStatusSummary: membership?.feeStatusSummary || null,
    membership,
  };
};

export const buildStudentsFeeStatuses = async ({
  academyId,
  students = [],
  month,
  year,
}) => {
  if (!students.length) return [];

  const studentIds = students.map((student) => student._id);
  const [academy, plans, payments, membershipMap] = await Promise.all([
    Academy.findById(academyId)
      .select("settings.defaultMonthlyFee defaultMonthlyFee")
      .lean(),
    FeePlan.find({ academy: academyId, isActive: true })
      .sort({ createdAt: -1 })
      .lean(),
    FeePayment.find({
      academy: academyId,
      student: { $in: studentIds },
      feeMonth: Number(month),
      feeYear: Number(year),
      status: { $ne: "cancelled" },
    })
      .sort({ paymentDate: -1 })
      .lean(),
    getMembershipMap({ academyId, studentIds }),
  ]);

  const defaultAmount = Number(
    academy?.settings?.defaultMonthlyFee || academy?.defaultMonthlyFee || 0
  );
  const planByBatch = new Map();
  let defaultPlan = null;
  plans.forEach((plan) => {
    const batchId = plan.batch ? String(plan.batch) : "";
    if (batchId && !planByBatch.has(batchId)) planByBatch.set(batchId, plan);
    if (!batchId && plan.isDefault && !defaultPlan) defaultPlan = plan;
  });

  const paymentsByStudent = new Map();
  payments.forEach((payment) => {
    const key = String(payment.student);
    const current = paymentsByStudent.get(key) || { payments: [], amountPaid: 0 };
    current.payments.push(payment);
    current.amountPaid += Number(payment.amountPaid || 0);
    paymentsByStudent.set(key, current);
  });

  return students.map((student) => {
    const batch = student.batch || null;
    const batchId = batch?._id || batch;
    const feePlan = planByBatch.get(String(batchId || "")) || defaultPlan;
    const batchMonthlyAmount = Number(
      typeof batch === "object" ? batch.monthlyFee || 0 : 0
    );
    const hasStudentOverride = Number(student.monthlyFeeOverride || 0) > 0;
    const feePlanAmount = Number(feePlan?.monthlyAmount || feePlan?.amount || 0);
    const baseAmount = hasStudentOverride
      ? Number(student.monthlyFeeOverride)
      : batchMonthlyAmount > 0
        ? batchMonthlyAmount
        : feePlanAmount > 0
          ? feePlanAmount
          : defaultAmount;
    const dueDay = Number(
      student.feeDueDay ||
      (typeof batch === "object" ? batch.feeDueDay : null) ||
      feePlan?.dueDay ||
      10
    );
    const scholarshipAmount = Number(student.scholarshipAmount || 0);
    const discountPercent = Number(student.discountPercent || 0);
    const percentDiscount = Math.round((baseAmount * discountPercent) / 100);
    const discount = Math.min(baseAmount, scholarshipAmount + percentDiscount);
    const payableAmount = Math.max(baseAmount - discount, 0);
    const paymentSummary = paymentsByStudent.get(String(student._id)) || {
      payments: [],
      amountPaid: 0,
    };
    const latestPayment = paymentSummary.payments[0] || null;
    const dueDate = buildDueDate(month, year, dueDay);
    const ledgerStatus = calculateFeeStatus({
      payableAmount,
      paidAmount: paymentSummary.amountPaid,
      dueDate,
    });
    const membership = membershipMap.get(String(student._id)) || null;
    const status = membership?.feeStatusSummary?.code || ledgerStatus;

    return {
      student: {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        name: getStudentFullName(student),
        phone: student.phone,
        email: student.email,
        batch,
        branch: student.branch || null,
        status: student.status,
      },
      feePlan: feePlan || null,
      month,
      year,
      monthKey: buildFeeMonthKey(month, year),
      monthName: getMonthName(month),
      monthlyFee: baseAmount,
      batchMonthlyFee: batchMonthlyAmount,
      discount,
      payableAmount,
      paidAmount: paymentSummary.amountPaid,
      pendingAmount: Math.max(payableAmount - paymentSummary.amountPaid, 0),
      dueDay,
      dueDate: membership?.effectiveDueDate || dueDate,
      paidDate: latestPayment?.paymentDate || null,
      paymentMode: latestPayment?.paymentMode || "",
      receiptNumber: latestPayment?.receiptNumber || "",
      paymentId: latestPayment?._id || null,
      status,
      feeStatusSummary: membership?.feeStatusSummary || null,
      membership,
    };
  });
};

export const collectStudentFee = async ({
  academyId,
  userId,
  payload,
  session = null,
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
  const idempotencyKey = String(payload.idempotencyKey || "").trim();
  if (!idempotencyKey) throw new Error("Idempotency key is required");
  const collectionKey = `${idempotencyKey}:${feeYear}-${String(feeMonth).padStart(2, "0")}`;
  const branch = student.branch && typeof student.branch === "object" ? student.branch : null;
  const currencyCode = branch?.currencyCode || "INR";
  const currencySymbol = branch?.currencySymbol || getCurrencySymbol(currencyCode);

  const replay = await FeePayment.findOne({
    academy: academyId,
    student: student._id,
    $or: [{ collectionKey }, { "installments.idempotencyKey": idempotencyKey, feeMonth, feeYear }],
  }).session(session);
  if (replay) return { payment: replay, becamePaid: false, replayed: true };
  const receiptNumber = await generateReceiptNumber(academyId, session);

  const existing = await FeePayment.findOne({
    academy: academyId,
    student: student._id,
    feeMonth,
    feeYear,
    status: {
      $ne: "cancelled",
    },
  }).session(session);

  const paymentDate = payload.paymentDate || new Date();
  const paymentMode = payload.paymentMode || "cash";
  const installmentCash = paymentMode === "cash"
    ? amountPaid
    : Number(payload.cashAmount || 0);
  const installmentOnline = paymentMode === "online"
    ? amountPaid
    : Number(payload.onlineAmount || 0);
  const installment = {
    idempotencyKey,
    receiptNumber,
    amountPaid,
    cashAmount: installmentCash,
    onlineAmount: installmentOnline,
    paymentMode,
    paymentDate,
    notes: payload.notes || payload.note || "",
    collectedBy: userId,
  };

  if (existing) {
    const wasPaid = existing.status === "paid";
    existing.amount = Math.max(Number(existing.amount || 0), amount);
    existing.discount = Math.max(Number(existing.discount || 0), discount);
    existing.finalAmount = finalAmount;
    // Legacy rows may predate installment history. Preserve their already
    // received amount as a synthetic immutable opening installment.
    if (!existing.installments?.length && Number(existing.amountPaid || 0) > 0) {
      existing.installments = [{
        idempotencyKey: `legacy:${existing._id}`,
        receiptNumber: existing.receiptNumber || `LEGACY-${existing._id}`,
        amountPaid: Number(existing.amountPaid || 0),
        cashAmount: Number(existing.cashAmount || 0),
        onlineAmount: Number(existing.onlineAmount || 0),
        paymentMode: existing.paymentMode || "cash",
        paymentDate: existing.paymentDate || existing.createdAt || new Date(),
        notes: existing.notes || existing.note || "",
        collectedBy: existing.collectedBy || userId,
      }];
    }
    existing.installments.push(installment);
    existing.collectionId = idempotencyKey;
    existing.collectionKey = collectionKey;
    existing.dueDate = dueDate;
    existing.notes = payload.notes || payload.note || existing.notes || "";
    existing.note = payload.notes || payload.note || existing.note || "";
    existing.batch = student.batch?._id || student.batch || null;
    existing.branch = branch?._id || student.branch || null;
    existing.currencyCode = currencyCode;
    existing.currencySymbol = currencySymbol;
    existing.feePlan = feeConfig.feePlan?._id || null;
    existing.updatedBy = userId;

    await existing.save({ session });
    return { payment: existing, becamePaid: !wasPaid && existing.status === "paid", replayed: false };
  }

 const feePayment = new FeePayment({
  academy: academyId,
  student: student._id,
  batch: student.batch?._id || student.batch || null,
  branch: branch?._id || student.branch || null,
  currencyCode,
  currencySymbol,
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
  cashAmount: Number(payload.cashAmount || 0),
  onlineAmount: Number(payload.onlineAmount || 0),
  receiptNumber,
  collectionId: idempotencyKey,
  collectionKey,
  installments: [installment],
  notes: payload.notes || payload.note || "",
  note: payload.notes || payload.note || "",
  collectedBy: userId,
  updatedBy: userId,
});

await feePayment.save({ session });

return { payment: feePayment, becamePaid: feePayment.status === "paid", replayed: false };
};

export const deriveMembershipCollectionState = ({
  membership,
  completedPeriods = 0,
  latestStatus = "due",
  latestDueDate = null,
  now = new Date(),
}) => {
  const completed = Math.max(0, Number(completedPeriods || 0));
  const accrued = calculateAccruedUnpaidMonths(membership, now);
  const unpaidMonths = Math.max(0, accrued - completed);
  const unpaidDays = Math.max(0, Number(membership?.unpaidDays || 0));
  const anchor = membership?.effectiveDueDate || membership?.originalDueDate || latestDueDate;
  const effectiveDueDate = completed > 0
    ? addBillingMonthsClamped(anchor, completed)
    : anchor ? new Date(anchor) : null;
  const stillDue = unpaidMonths > 0 || unpaidDays > 0;
  const feeStatus = latestStatus === "partial"
    ? "partial"
    : latestStatus === "paid" && !stillDue
      ? "paid"
      : stillDue ? "due" : latestStatus || membership?.feeStatus || "due";
  return { unpaidMonths, unpaidDays, effectiveDueDate, feeStatus };
};

export const reconcileMembershipAfterCollection = async ({
  academyId,
  student,
  completedPeriods = 0,
  latestPayment,
  session = null,
}) => {
  let membership = await StudentMembership.findOne({ academy: academyId, student: student._id }).session(session);
  if (!membership) {
    membership = new StudentMembership({
      academy: academyId,
      student: student._id,
      batch: student.batch?._id || student.batch || null,
      status: student.status === "active" ? "active" : "paused",
      startDate: student.joiningDate || student.createdAt || new Date(),
      originalDueDate: latestPayment?.dueDate || student.joiningDate || new Date(),
      effectiveDueDate: latestPayment?.dueDate || student.joiningDate || new Date(),
      feeRequired: true,
    });
  }
  membership.batch = student.batch?._id || student.batch || null;
  const nextState = deriveMembershipCollectionState({
    membership,
    completedPeriods,
    latestStatus: latestPayment?.status,
    latestDueDate: latestPayment?.dueDate,
  });
  membership.unpaidMonths = nextState.unpaidMonths;
  membership.unpaidDays = nextState.unpaidDays;
  membership.autoMonthlyDue = true;
  membership.effectiveDueDate = nextState.effectiveDueDate;
  membership.feeStatus = nextState.feeStatus;
  membership.feeRequired = true;
  await membership.save({ session });
  return membership;
};

export const applyPaymentStatusTransitionToMembership = async ({
  academyId,
  studentId,
  oldStatus,
  newStatus,
  payment,
  session = null,
}) => {
  let membership = await StudentMembership.findOne({ academy: academyId, student: studentId }).session(session);
  if (!membership) return null;
  const wasPaid = oldStatus === "paid";
  const isPaid = newStatus === "paid";
  if (wasPaid !== isPaid) {
    membership.unpaidMonths = Math.max(0, Number(membership.unpaidMonths || 0) + (isPaid ? -1 : 1));
  }
  const stillDue = Number(membership.unpaidMonths || 0) > 0 || Number(membership.unpaidDays || 0) > 0;
  membership.feeStatus = stillDue ? "due" : isPaid ? "paid" : (newStatus === "cancelled" ? "due" : newStatus);
  if (!stillDue && isPaid && payment) {
    const next = Number(payment.feeMonth) === 12
      ? { month: 1, year: Number(payment.feeYear) + 1 }
      : { month: Number(payment.feeMonth) + 1, year: Number(payment.feeYear) };
    const sourceDue = new Date(payment.dueDate || 0);
    membership.effectiveDueDate = buildDueDate(next.month, next.year, Number.isNaN(sourceDue.getTime()) ? 10 : sourceDue.getUTCDate());
  }
  await membership.save({ session });
  return membership;
};
