import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import FeePayment from "../src/models/FeePayment.js";
import { allocateFeeCollection, correctPaymentInstallments, splitCents } from "../src/utils/feeCollection.js";

const payload = { student: new mongoose.Types.ObjectId(), amount: 1600, discount: 200, amountPaid: 1400,
  numberOfMonths: 2, feeMonth: 10, feeYear: 2026, paymentMode: "cash", idempotencyKey: "example-payment-key" };

test("800 per month, 200 total discount and 1400 payment create two 700 allocations", async () => {
  const rows = allocateFeeCollection(payload);
  assert.deepEqual(rows.map(row => [row.amount, row.discount, row.amountPaid]), [[800, 100, 700], [800, 100, 700]]);
  for (const row of rows) {
    const document = new FeePayment({ ...row, academy: new mongoose.Types.ObjectId(),
      finalAmount: row.amount - row.discount, installments: [{ ...row, receiptNumber: `TEST-${row.feeMonth}`, paymentDate: new Date() }] });
    await document.validate();
    assert.equal(document.status, "paid");
    assert.equal(document.pendingAmount, 0);
    assert.equal(document.amountPaid, 700);
  }
});

test("paise allocation conserves amount, discount, payments and split-mode components", () => {
  for (let count = 1; count <= 24; count += 1) {
    const rows = allocateFeeCollection({ ...payload, amount: 19200.03, discount: 200.01, amountPaid: 19000.02,
      numberOfMonths: count, paymentMode: "cash_online", cashAmount: 10000.01, onlineAmount: 9000.01 });
    for (const field of ["amount", "discount", "amountPaid", "cashAmount", "onlineAmount"]) {
      assert.equal(rows.reduce((sum, row) => sum + Math.round(row[field] * 100), 0), Math.round(({ amount: 19200.03, discount: 200.01, amountPaid: 19000.02, cashAmount: 10000.01, onlineAmount: 9000.01 })[field] * 100));
    }
    rows.forEach(row => {
      assert.equal(Math.round((row.cashAmount + row.onlineAmount) * 100), Math.round(row.amountPaid * 100));
      assert.ok(row.cashAmount >= 0 && row.onlineAmount >= 0);
      assert.ok(Math.round(row.amountPaid * 100) <= Math.round((row.amount - row.discount) * 100));
    });
  }
  assert.deepEqual(splitCents(1, [1, 1, 0]), [1, 0, 0]);
});

test("allocation crosses December and rejects overpayment and invalid splits", () => {
  assert.deepEqual(allocateFeeCollection({ ...payload, feeMonth: 12 }).map(row => [row.feeMonth, row.feeYear]), [[12, 2026], [1, 2027]]);
  assert.throws(() => allocateFeeCollection({ ...payload, amountPaid: 2200 }), /exceeds/);
  assert.throws(() => allocateFeeCollection({ ...payload, discount: 1700 }), /Discount/);
  assert.throws(() => allocateFeeCollection({ ...payload, paymentMode: "cash_online", cashAmount: 1, onlineAmount: 2 }), /match/);
});

test("editing 800 + 1400 installments to a total of 700 saves 700, not 1500", async () => {
  const document = new FeePayment({ academy: new mongoose.Types.ObjectId(), student: payload.student,
    amount: 800, discount: 100, finalAmount: 700, feeMonth: 10, feeYear: 2026, amountPaid: 2200,
    paymentMode: "cash", receiptNumber: "TEST-EDIT", installments: [800, 1400].map((amountPaid, i) => ({
      idempotencyKey: `original-${i}`, receiptNumber: `TEST-${i}`, amountPaid, paymentMode: "cash", cashAmount: amountPaid, paymentDate: new Date(),
    })) });
  correctPaymentInstallments(document, { amountPaid: 700, paymentMode: "online" });
  await document.validate();
  assert.equal(document.amountPaid, 700);
  assert.equal(document.onlineAmount, 700);
  assert.equal(document.cashAmount, 0);
  assert.equal(document.installments[0].idempotencyKey, "original-0");
});

test("date and mode-only corrections survive model validation; reversed installments stay untouched", async () => {
  const document = new FeePayment({ academy: new mongoose.Types.ObjectId(), student: payload.student,
    amount: 800, discount: 0, finalAmount: 800, feeMonth: 10, feeYear: 2026, amountPaid: 800,
    paymentMode: "cash", installments: [{ idempotencyKey: "original-receipt", receiptNumber: "TEST-MODE", amountPaid: 800, cashAmount: 800, paymentMode: "cash", paymentDate: new Date("2026-10-01") }] });
  correctPaymentInstallments(document, { paymentDate: "2026-10-02", paymentMode: "online" });
  await document.validate();
  assert.equal(document.paymentDate.toISOString().slice(0, 10), "2026-10-02");
  assert.equal(document.paymentMode, "online");
  assert.equal(document.onlineAmount, 800);
});
