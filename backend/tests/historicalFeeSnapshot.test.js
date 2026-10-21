import test from "node:test";
import assert from "node:assert/strict";
import { historicalFeeSnapshot } from "../src/utils/historicalFeeSnapshot.js";
const end = new Date("2026-10-01T00:00:00Z");
test("October payment for September does not appear in September", () => {
  assert.equal(historicalFeeSnapshot({feeMonth:9, feeYear:2026, amountPaid:800, paymentDate:"2026-10-02", createdAt:"2026-10-02"},end),null);
});
test("September installment stays unchanged when October tops up the same ledger", () => {
  const result=historicalFeeSnapshot({amount:800,discount:0,createdAt:"2026-09-02",paymentDate:"2026-10-02",installments:[{amountPaid:300,paymentDate:"2026-09-02",createdAt:"2026-09-02"},{amountPaid:500,paymentDate:"2026-10-02",createdAt:"2026-10-02"}]},end);
  assert.equal(result.amountPaid,300); assert.equal(result.paymentDate,"2026-09-02"); assert.equal(result.status,"partial");
});
test("October correction uses previous September values",()=>{
  const result=historicalFeeSnapshot({amount:800,discount:0,amountPaid:800,paymentDate:"2026-10-02",corrections:[{correctedAt:"2026-10-02",previousState:{amount:800,discount:0,amountPaid:800,paymentDate:"2026-09-05",createdAt:"2026-09-05"}}]},end);
  assert.equal(result.paymentDate,"2026-09-05");
});
