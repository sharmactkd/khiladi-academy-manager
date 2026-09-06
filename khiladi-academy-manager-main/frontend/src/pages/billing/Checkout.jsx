import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, ChevronRight, CreditCard, LockKeyhole, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { planApi } from "../../api/planApi.js";
import { billingApi } from "../../api/billingApi.js";
import { couponApi } from "../../api/couponApi.js";
import { money, pretty } from "./subscriptionBilling.utils.js";
import styles from "./BillingFlow.module.css";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { planCode } = useParams();
  const navigate = useNavigate();
  const idempotencyKey = useRef(window.crypto.randomUUID());

  const [plan, setPlan] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const response = await planApi.getByCode(planCode);
        setPlan(response.data?.data?.plan || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load plan");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planCode]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage("Enter coupon code first.");
      return;
    }

    try {
      const response = await couponApi.validate({
        planCode,
        couponCode,
      });

      setCouponMessage(response.data?.message || "Coupon applied");
    } catch (err) {
      setCouponMessage(err.response?.data?.message || "Invalid coupon");
    }
  };

  const handlePayment = async () => {
    try {
      setPaying(true);
      setError("");

      const orderResponse = await billingApi.createOrder({
        planCode,
        couponCode: couponCode.trim() || undefined,
        idempotencyKey: idempotencyKey.current,
      });

      const orderData = orderResponse.data?.data;

      if (!orderData?.requiresPayment) {
        navigate("/billing/success", {
          replace: true,
          state: {
            subscription: orderData?.subscription,
            invoice: orderData?.invoice,
          },
        });
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        navigate("/billing/failed", {
          replace: true,
          state: { message: "Razorpay checkout script failed to load." },
        });
        return;
      }

      const options = {
        key:
          orderData.razorpayKeyId ||
          import.meta.env.VITE_RAZORPAY_KEY_ID ||
          "",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "KHILADI Academy Manager",
        description: `${plan?.name} Plan Subscription`,
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            const verifyResponse = await billingApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            navigate("/billing/success", {
              replace: true,
              state: verifyResponse.data?.data || {},
            });
          } catch (err) {
            navigate("/billing/failed", {
              replace: true,
              state: {
                message:
                  err.response?.data?.message ||
                  "Payment verification failed.",
              },
            });
          }
        },
        prefill: {},
        theme: {
          color: "#e50914",
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        navigate("/billing/failed", {
          replace: true,
          state: {
            message:
              response.error?.description ||
              "Payment failed. Please try again.",
          },
        });
      });

      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading secure checkout...</div>;
  }

  if (!plan) {
    return <div className={styles.loading}>Plan not found.</div>;
  }

  return (
    <div className={`page ${styles.page}`}>
      <nav className={styles.breadcrumb}><Link to="/billing?tab=plans">Subscription & Billing</Link><ChevronRight size={13}/><strong>Secure Checkout</strong></nav>
      <header className={styles.heading}><span><CreditCard size={25}/></span><div><small>Protected payment</small><h1>Secure Checkout</h1><p>Review your plan and activate it through Razorpay's verified payment flow.</p></div></header>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.checkoutGrid}>
        <section className={styles.card}><header><span><Sparkles size={20}/></span><div><small>Selected plan</small><h2>{plan.name}</h2><p>{plan.description}</p></div></header><div className={styles.price}>{plan.price === 0 ? "Free" : money(plan.price, plan.currency)}<small>/{pretty(plan.billingCycle)}</small></div><ul>{(plan.features || []).map((feature) => <li key={feature}><BadgeCheck size={15}/>{feature}</li>)}</ul></section>
        <section className={styles.card}><header><span><Tag size={20}/></span><div><small>Order summary</small><h2>Coupon & Payment</h2><p>Apply an eligible offer before creating your secure order.</p></div></header><div className={styles.coupon}>
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="WELCOME50"
            />
            <button
              type="button"
              onClick={handleValidateCoupon}
            >
              Validate
            </button>
          </div>{couponMessage && <p className={styles.couponMessage}>{couponMessage}</p>}<div className={styles.secureNote}><LockKeyhole size={17}/><p><strong>Secure payment</strong><span>Your payment is processed by Razorpay. KHILADI does not store card or UPI credentials.</span></p></div><div className={styles.total}><span>Plan total</span><strong>{money(plan.price, plan.currency)}</strong></div><button className={styles.payButton} type="button" onClick={handlePayment} disabled={paying}>
            <ShieldCheck size={17}/>
            {paying ? "Processing..." : plan.price === 0 ? "Activate Free Plan" : "Pay with Razorpay"}
          </button><small className={styles.terms}>By continuing, you agree to the subscription and billing terms.</small></section>
      </div>
    </div>
  );
};

export default Checkout;
