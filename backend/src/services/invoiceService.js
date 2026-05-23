import Invoice from "../models/Invoice.js";
import env from "../config/env.js";

const padNumber = (value, size = 5) => {
  return String(value).padStart(size, "0");
};

export const generateInvoiceNumber = async () => {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

  const latestInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}-` },
  })
    .sort({ createdAt: -1 })
    .select("invoiceNumber")
    .lean();

  let nextNumber = 1;

  if (latestInvoice?.invoiceNumber) {
    const parts = latestInvoice.invoiceNumber.split("-");
    const lastPart = Number(parts[parts.length - 1]);

    if (!Number.isNaN(lastPart)) {
      nextNumber = lastPart + 1;
    }
  }

  return `${prefix}-${padNumber(nextNumber)}`;
};

export const createInvoiceForPayment = async ({
  academy,
  subscription,
  payment,
  plan,
  billingUser,
  createdBy,
}) => {
  const gstPercentage = Number(env.GST_PERCENTAGE || 0);
  const amount = Number(payment.amount || 0);
  const tax = Math.round((amount * gstPercentage) / 100);
  const total = amount + tax;

  const invoiceNumber = await generateInvoiceNumber();

  return Invoice.create({
    academy: academy._id || academy,
    subscription: subscription?._id || subscription || null,
    payment: payment._id || payment,
    invoiceNumber,
    amount,
    tax,
    total,
    currency: payment.currency || "INR",
    status: payment.status === "paid" ? "paid" : "issued",
    issuedAt: new Date(),
    paidAt: payment.status === "paid" ? payment.paidAt || new Date() : null,
    billingName: academy.academyName || billingUser?.name || "",
    billingEmail: academy.email || billingUser?.email || "",
    billingPhone: academy.phone || billingUser?.phone || "",
    billingAddress: academy.address || "",
    lineItems: [
      {
        name: `${plan.name} Plan`,
        description: `${plan.name} subscription (${plan.billingCycle})`,
        amount,
        quantity: 1,
        total: amount,
      },
    ],
    createdBy,
  });
};