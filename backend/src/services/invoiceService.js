import Invoice from "../models/Invoice.js";
import env from "../config/env.js";
import Sequence from "../models/Sequence.js";

const padNumber = (value, size = 5) => {
  return String(value).padStart(size, "0");
};

export const generateInvoiceNumber = async ({ session = null } = {}) => {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

  const counter = await Sequence.findOneAndUpdate(
    { scope: `Invoice:invoiceNumber:${prefix}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
  return `${prefix}-${padNumber(counter.value)}`;
};

export const createInvoiceForPayment = async ({
  academy,
  subscription,
  payment,
  plan,
  billingUser,
  createdBy,
  session = null,
}) => {
  const gstPercentage = Number(env.GST_PERCENTAGE || 0);
  const amount = Number(payment.amount || 0);
  const tax = Math.round((amount * gstPercentage) / 100);
  const total = amount + tax;

  const invoiceNumber = await generateInvoiceNumber({ session });

  const [invoice] = await Invoice.create([{
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
  }], { session });
  return invoice;
};
