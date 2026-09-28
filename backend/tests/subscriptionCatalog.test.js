import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEFAULT_ADD_ONS } from "../src/services/entitlementService.js";
import { DEFAULT_PLANS } from "../src/services/planService.js";
import { calculateCouponDiscount } from "../src/utils/couponPricing.js";

test("final subscription catalogue uses the approved prices", () => {
  const price = Object.fromEntries(DEFAULT_ADD_ONS.map((item) => [item.code, item.price]));
  assert.equal(price.student_capacity_500, 100);
  assert.equal(price.additional_academy, 1000);
  assert.equal(price.additional_branch, 300);
  assert.equal(price.id_card_studio, 1000);
  assert.equal(price.certificate_studio, 1000);
  assert.equal(price.document_studio_bundle, 1699);
});

test("free and base capacities match the approved menu", () => {
  const free = DEFAULT_PLANS.find((item) => item.code === "free");
  const base = DEFAULT_PLANS.find((item) => item.code === "basic");
  assert.equal(free.limits.students, 100);
  assert.equal(free.limits.branches, 1);
  assert.equal(base.price, 299);
  assert.equal(base.limits.students, 500);
});

test("billing routes require idempotency and server-side payment verification", () => {
  const routes = fs.readFileSync(new URL("../src/routes/billingRoutes.js", import.meta.url), "utf8");
  const controller = fs.readFileSync(new URL("../src/controllers/billingController.js", import.meta.url), "utf8");
  assert.match(routes, /billingIdempotencyValidator[\s\S]*createAddOnOrderValidator/);
  assert.match(controller, /verifyRazorpaySignature/);
  assert.match(controller, /fetchRazorpayPayment/);
  assert.match(controller, /providerPayment\.status !== "captured"/);
});

test("multi-academy ownership is selected through an explicit scoped header", () => {
  const middleware = fs.readFileSync(new URL("../src/middlewares/academyAccessMiddleware.js", import.meta.url), "utf8");
  assert.match(middleware, /x-academy-id/);
  assert.match(middleware, /_id: requestedAcademyId, owner: req\.user\._id/);
});

test("coupon discounts are capped and can never make an order negative", () => {
  assert.equal(calculateCouponDiscount({ coupon: { discountType: "percentage", discountValue: 25 }, amount: 1000 }), 250);
  assert.equal(calculateCouponDiscount({ coupon: { discountType: "percentage", discountValue: 50, maximumDiscount: 200 }, amount: 1000 }), 200);
  assert.equal(calculateCouponDiscount({ coupon: { discountType: "fixed", discountValue: 2000 }, amount: 1000 }), 1000);
});

test("superadmin pricing and coupon controls are protected and exposed", () => {
  const adminRoutes = fs.readFileSync(new URL("../src/routes/adminRoutes.js", import.meta.url), "utf8");
  const couponRoutes = fs.readFileSync(new URL("../src/routes/couponRoutes.js", import.meta.url), "utf8");
  const addOnCheckout = fs.readFileSync(new URL("../../frontend/src/pages/billing/AddOnCheckout.jsx", import.meta.url), "utf8");
  assert.match(adminRoutes, /allowRoles\("super_admin"\)/);
  assert.match(adminRoutes, /patch\("\/add-ons\/:id"/);
  assert.match(couponRoutes, /allowRoles\("super_admin"\)/);
  assert.match(addOnCheckout, /couponApi\.validate/);
  assert.match(addOnCheckout, /couponCode/);
});
