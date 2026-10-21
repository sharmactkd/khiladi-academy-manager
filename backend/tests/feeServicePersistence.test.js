import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/fee_unit_test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-at-least-32-characters";
const { collectStudentFee } = await import("../src/services/feeService.js");
const { default: Student } = await import("../src/models/Student.js");
const { default: Academy } = await import("../src/models/Academy.js");
const { default: FeePlan } = await import("../src/models/FeePlan.js");
const { default: Sequence } = await import("../src/models/Sequence.js");
const { default: FeePayment } = await import("../src/models/FeePayment.js");
const { allocateFeeCollection } = await import("../src/utils/feeCollection.js");

// Exercise the actual collection service and Mongoose validation against a
// deterministic repository stub. These tests do not claim MongoDB integration.
const fixture = t => {
  const academyId = new mongoose.Types.ObjectId(), userId = new mongoose.Types.ObjectId();
  const student = { _id: new mongoose.Types.ObjectId(), academy: academyId, batch: { _id: new mongoose.Types.ObjectId(), monthlyFee: 800, feeDueDay: 10 }, branch: null };
  const rows = [];
  t.mock.method(Student, "findOne", () => ({ populate() { return this; }, then(resolve, reject) { return Promise.resolve(student).then(resolve, reject); } }));
  t.mock.method(Academy, "findById", () => ({ lean: async () => ({ settings: {} }) }));
  t.mock.method(FeePlan, "findOne", () => ({ sort: async () => null }));
  let sequence = 0;
  t.mock.method(Sequence, "findOneAndUpdate", async () => ({ value: ++sequence }));
  t.mock.method(FeePayment, "findOne", query => ({ session: async () => rows.find(row => {
    if (query.$or) return query.$or.some(rule => (rule.collectionKey && row.collectionKey === rule.collectionKey) ||
      (rule["installments.idempotencyKey"] && row.feeMonth === rule.feeMonth && row.feeYear === rule.feeYear && row.installments.some(item => item.idempotencyKey === rule["installments.idempotencyKey"])));
    return row.feeMonth === query.feeMonth && row.feeYear === query.feeYear;
  }) || null }));
  t.mock.method(FeePayment.prototype, "save", async function () {
    await this.validate();
    if (!rows.includes(this)) rows.push(this);
    return this;
  });
  const collect = payload => collectStudentFee({ academyId, userId, payload: { student: student._id, amount: 800, discount: 100, amountPaid: 700, feeMonth: 10, feeYear: 2026, paymentMode: "cash", ...payload } });
  return { rows, student, collect };
};

test("service saves both monthly allocations and replay cannot double-count them", async t => {
  const { rows, collect, student } = fixture(t);
  const allocations = allocateFeeCollection({ student: student._id, amount: 1600, discount: 200, amountPaid: 1400, feeMonth: 10, feeYear: 2026, numberOfMonths: 2, paymentMode: "cash", idempotencyKey: "two-month-payment" });
  for (const payload of allocations) await collect(payload);
  assert.deepEqual(rows.map(row => row.amountPaid), [700, 700]);
  for (const payload of allocations) assert.equal((await collect(payload)).replayed, true);
  assert.deepEqual(rows.map(row => row.amountPaid), [700, 700]);
  await assert.rejects(collect({ idempotencyKey: "accidental-new-key" }), /already contains a payment/);
});

test("partial top-ups accumulate only to payable; overpayment is rejected", async t => {
  const { rows, collect } = fixture(t);
  await collect({ idempotencyKey: "partial-first", amountPaid: 350 });
  await collect({ idempotencyKey: "partial-second", amountPaid: 350 });
  assert.equal(rows[0].amountPaid, 700);
  assert.equal(rows[0].status, "paid");
  await assert.rejects(collect({ idempotencyKey: "partial-third", amountPaid: 1 }), /Remaining balance/);
  assert.equal(rows[0].amountPaid, 700);
});

test("a reversed month is reusable without creating another unique monthly ledger", async t => {
  const { rows, collect } = fixture(t);
  await collect({ idempotencyKey: "original-payment" });
  rows[0].status = "cancelled";
  rows[0].installments[0].reversedAt = new Date();
  const result = await collect({ idempotencyKey: "replacement-payment" });
  assert.equal(rows.length, 1);
  assert.equal(result.payment.amountPaid, 700);
  assert.equal(result.payment.status, "paid");
  assert.ok(result.payment.installments[0].reversedAt);
  assert.equal(result.becamePaid, true);
});
