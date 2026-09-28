export const calculateCouponDiscount = ({ coupon, amount }) => {
  const base = Math.max(0, Number(amount || 0));
  let discount = 0;
  if (coupon?.discountType === "percentage") discount = Math.round(base * Number(coupon.discountValue || 0) / 100);
  if (coupon?.discountType === "fixed") discount = Number(coupon.discountValue || 0);
  if (coupon?.discountType === "free_months") discount = base;
  if (Number(coupon?.maximumDiscount || 0) > 0) discount = Math.min(discount, Number(coupon.maximumDiscount));
  return Math.min(base, Math.max(0, discount));
};
