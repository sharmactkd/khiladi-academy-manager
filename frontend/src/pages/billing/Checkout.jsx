import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { planApi } from "../../api/planApi.js";
import { billingApi } from "../../api/billingApi.js";
import { couponApi } from "../../api/couponApi.js";

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
          color: "#1d4ed8",
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
    return <div className="card">Loading checkout...</div>;
  }

  if (!plan) {
    return <div className="card">Plan not found.</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Checkout</h1>
          <p>Subscribe to {plan.name} plan.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid two">
        <div className="card">
          <h2>{plan.name}</h2>
          <p>{plan.description}</p>

          <div className="plan-price">
            {plan.price === 0 ? <strong>Free</strong> : <strong>₹{plan.price}</strong>}
            <span> / {plan.billingCycle}</span>
          </div>

          <ul className="plan-features">
            {(plan.features || []).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Apply Coupon</h2>

          <div className="coupon-row">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="WELCOME50"
            />
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleValidateCoupon}
            >
              Validate
            </button>
          </div>

          {couponMessage && <p className="muted">{couponMessage}</p>}

          <hr />

          <button className="btn btn-primary" type="button" onClick={handlePayment} disabled={paying}>
            {paying ? "Processing..." : plan.price === 0 ? "Activate Free Plan" : "Pay with Razorpay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;