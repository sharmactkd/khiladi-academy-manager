import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronRight, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { billingApi } from "../../api/billingApi.js";
import { couponApi } from "../../api/couponApi.js";
import { money } from "./subscriptionBilling.utils.js";
import styles from "./BillingFlow.module.css";

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const AddOnCheckout = () => {
  const { addOnCode } = useParams();
  const navigate = useNavigate();
  const key = useRef(window.crypto.randomUUID());
  const [addOn, setAddOn] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    billingApi.getAddOns().then((response) => {
      const list = response.data?.data?.addOns || [];
      setAddOn(list.find((item) => item.code === addOnCode) || null);
    }).catch((err) => setError(err.response?.data?.message || "Add-on load nahi hua")).finally(() => setLoading(false));
  }, [addOnCode]);

  const pay = async () => {
    setPaying(true); setError("");
    try {
      const response = await billingApi.createAddOnOrder({ addOnCode, quantity: addOn?.stackable ? quantity : 1, couponCode: couponCode.trim() || undefined, idempotencyKey: key.current });
      const data = response.data?.data;
      if (!data.requiresPayment) return navigate("/billing/success", { replace: true, state: data });
      if (!(await loadRazorpay())) throw new Error("Secure Razorpay checkout load nahi hua");
      const checkout = new window.Razorpay({
        key: data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: data.order.amount,
        currency: data.order.currency,
        name: "KHILADI Academy Manager",
        description: `${addOn.name} monthly subscription`,
        order_id: data.order.id,
        theme: { color: "#e50914" },
        handler: async (payment) => {
          try {
            const verified = await billingApi.verifyAddOnPayment(payment);
            navigate("/billing/success", { replace: true, state: verified.data?.data || {} });
          } catch (err) {
            navigate("/billing/failed", { replace: true, state: { message: err.response?.data?.message || "Payment verification failed" } });
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      checkout.on("payment.failed", (event) => navigate("/billing/failed", { state: { message: event.error?.description || "Payment failed" } }));
      checkout.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Order create nahi hua");
    } finally { setPaying(false); }
  };

  if (loading) return <div className={styles.loading}>Loading secure add-on checkout...</div>;
  if (!addOn) return <div className={styles.loading}>Add-on not found.</div>;
  const total = Number(addOn.price) * (addOn.stackable ? quantity : 1);
  const applyCoupon = async () => { setCouponMessage(""); try { const response = await couponApi.validate({ couponCode, addOnCode, quantity: addOn?.stackable ? quantity : 1 }); const breakup = response.data?.data?.amountBreakup || {}; setDiscount(Number(breakup.discount || 0)); setCouponMessage(`Coupon applied. You save ${money(breakup.discount || 0, addOn.currency)}.`); } catch (err) { setDiscount(0); setCouponMessage(err.response?.data?.message || "Invalid coupon"); } };
  return <div className={`page ${styles.page}`}>
    <nav className={styles.breadcrumb}><Link to="/billing?tab=addons">Subscription & Billing</Link><ChevronRight size={13}/><strong>Add-on Checkout</strong></nav>
    <header className={styles.heading}><span><CreditCard size={25}/></span><div><small>Protected payment</small><h1>Activate {addOn.name}</h1><p>Monthly modular subscription; your other services remain independent.</p></div></header>
    {error ? <div className={styles.error}>{error}</div> : null}
    <div className={styles.checkoutGrid}><section className={styles.card}><header><span><BadgeCheck size={20}/></span><div><small>Selected add-on</small><h2>{addOn.name}</h2><p>{addOn.description}</p></div></header><div className={styles.price}>{money(addOn.price, addOn.currency)}<small>/month per unit</small></div>{addOn.stackable ? <label>Quantity<input type="number" min="1" max="100" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value || 1))))}/></label> : null}</section>
      <section className={styles.card}><header><span><ShieldCheck size={20}/></span><div><small>Order summary</small><h2>Secure monthly access</h2><p>Price version is locked for this purchase period.</p></div></header><div className={styles.coupon}><input value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setDiscount(0); }} placeholder="Coupon code"/><button type="button" onClick={applyCoupon}>Apply</button></div>{couponMessage ? <p className={styles.couponMessage}>{couponMessage}</p> : null}<div className={styles.secureNote}><LockKeyhole size={17}/><p><strong>Verified activation</strong><span>Access activates only after Razorpay signature and captured-payment verification.</span></p></div><div className={styles.total}><span>Monthly total{discount ? ` (saved ${money(discount, addOn.currency)})` : ""}</span><strong>{money(Math.max(0, total - discount), addOn.currency)}</strong></div><button className={styles.payButton} type="button" onClick={pay} disabled={paying}><ShieldCheck size={17}/>{paying ? "Processing..." : Math.max(0, total - discount) === 0 ? "Activate with coupon" : "Pay with Razorpay"}</button></section>
    </div>
  </div>;
};

export default AddOnCheckout;
