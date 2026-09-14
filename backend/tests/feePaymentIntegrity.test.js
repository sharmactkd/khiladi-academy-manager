import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import FeePayment from "../src/models/FeePayment.js";

const objectId = () => new mongoose.Types.ObjectId();

const payment = (overrides = {}) => new FeePayment({
  academy: objectId(),
  student: objectId(),
  feeMonth: 9,
  feeYear: 2026,
  amount: 1000,
  discount: 0,
  finalAmount: 1000,
  amountPaid: 0,
  paymentMode: "cash",
  receiptNumber: `TEST-${Math.random().toString(36).slice(2)}`,
  ...overrides,
});

test("installments accumulate without overwriting earlier receipts", async () => {
  const row = payment({
    installments: [
      { idempotencyKey: "installment-one", receiptNumber: "R-1", amountPaid: 400, cashAmount: 400, paymentMode: "cash", paymentDate: "2026-09-01" },
      { idempotencyKey: "installment-two", receiptNumber: "R-2", amountPaid: 600, onlineAmount: 600, paymentMode: "online", paymentDate: "2026-09-10" },
    ],
  });
  await row.validate();
  assert.equal(row.amountPaid, 1000);
  assert.equal(row.cashAmount, 400);
  assert.equal(row.onlineAmount, 600);
  assert.equal(row.paymentMode, "cash_online");
  assert.equal(row.status, "paid");
  assert.equal(row.installments.length, 2);
});

test("reversed installments are excluded from financial totals", async () => {
  const row = payment({
    installments: [
      { idempotencyKey: "active-payment", receiptNumber: "R-3", amountPaid: 400, cashAmount: 400, paymentMode: "cash", paymentDate: "2026-09-01" },
      { idempotencyKey: "reversed-payment", receiptNumber: "R-4", amountPaid: 600, onlineAmount: 600, paymentMode: "online", paymentDate: "2026-09-10", reversedAt: "2026-09-11", reversalReason: "Incorrect entry" },
    ],
  });
  await row.validate();
  assert.equal(row.amountPaid, 400);
  assert.equal(row.pendingAmount, 600);
  assert.equal(row.status, "partial");
});

test("a zero-payable fee is complete instead of due", async () => {
  const row = payment({ amount: 1000, discount: 1000, amountPaid: 0 });
  await row.validate();
  assert.equal(row.finalAmount, 0);
  assert.equal(row.pendingAmount, 0);
  assert.equal(row.status, "paid");
});

test("a cancelled ledger preserves original money for audit", async () => {
  const row = payment({
    status: "cancelled",
    amountPaid: 1000,
    reversedAt: "2026-09-12",
    reversalReason: "Duplicate entry",
    installments: [
      { idempotencyKey: "cancelled-payment", receiptNumber: "R-5", amountPaid: 1000, cashAmount: 1000, paymentMode: "cash", paymentDate: "2026-09-10", reversedAt: "2026-09-12", reversalReason: "Duplicate entry" },
    ],
  });
  await row.validate();
  assert.equal(row.amountPaid, 1000);
  assert.equal(row.status, "cancelled");
});
