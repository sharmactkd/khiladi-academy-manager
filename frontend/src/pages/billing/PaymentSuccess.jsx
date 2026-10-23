import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, FileText, LayoutDashboard } from "lucide-react";
import { billingApi } from "../../api/billingApi.js";
import { date } from "./subscriptionBilling.utils.js";
import { billingResultState, hasPaymentConfirmation } from "./billingResultState.js";
import styles from "./BillingFlow.module.css";

const PaymentSuccess = () => {
  const state = billingResultState(useLocation().state);
  const confirmed = hasPaymentConfirmation(state);
  const [accountSubscription, setAccountSubscription] = useState(null);
  const [loading, setLoading] = useState(!confirmed);
  const [error, setError] = useState("");
  useEffect(() => {
    if (confirmed) return;
    let active = true;
    billingApi.getMySubscription().then(response => {
      if (active) setAccountSubscription(response.data?.data?.subscription || null);
    }).catch(() => {
      if (active) setError("Could not refresh billing details. Open billing to check your payment records.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [confirmed]);
  const subscription = state.subscription || accountSubscription;
  const invoice = state.invoice;
  const Icon = confirmed ? CheckCircle2 : FileText;
  return <div className={`page ${styles.page}`}><section className={styles.resultCard}>
    <span><Icon size={34}/></span>
    <small>{confirmed ? "PAYMENT VERIFIED" : "BILLING RECORDS"}</small>
    <h1>{confirmed ? "Payment completed" : "Review payment status"}</h1>
    <p>{confirmed ? "Your payment was verified. You can view the updated account and invoice in billing." : "Open billing to confirm your payment in the verified payment records."}</p>
    {loading ? <p role="status">Refreshing account details…</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {subscription ? <dl>
      <div><dt>Plan</dt><dd>{String(subscription.planCode || subscription.plan?.name || "Plan").toUpperCase()}</dd></div>
      <div><dt>Account status</dt><dd>{subscription.status}</dd></div>
      <div><dt>Valid until</dt><dd>{subscription.endDate ? date(subscription.endDate) : "No fixed expiry"}</dd></div>
    </dl> : null}
    <div>{invoice?._id ? <Link to={`/billing/invoices/${invoice._id}`}><FileText size={16}/>View invoice</Link> : null}<Link className={styles.resultPrimary} to="/billing"><LayoutDashboard size={16}/>Open billing</Link></div>
  </section></div>;
};
export default PaymentSuccess;
