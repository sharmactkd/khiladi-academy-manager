import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, FileText, LayoutDashboard } from "lucide-react";
import { date } from "./subscriptionBilling.utils.js";
import styles from "./BillingFlow.module.css";
const PaymentSuccess = () => { const { state = {} } = useLocation(); const { subscription, invoice } = state; return <div className={`page ${styles.page}`}><section className={styles.resultCard}><span><CheckCircle2 size={34}/></span><small>PAYMENT VERIFIED</small><h1>Subscription Activated</h1><p>Your KHILADI subscription is active and its billing record has been securely created.</p>{subscription ? <dl><div><dt>Plan</dt><dd>{String(subscription.planCode || "Plan").toUpperCase()}</dd></div><div><dt>Status</dt><dd>{subscription.status}</dd></div><div><dt>Valid until</dt><dd>{subscription.endDate ? date(subscription.endDate) : "No fixed expiry"}</dd></div></dl> : null}<div>{invoice?._id ? <Link to={`/billing/invoices/${invoice._id}`}><FileText size={16}/>View invoice</Link> : null}<Link className={styles.resultPrimary} to="/billing"><LayoutDashboard size={16}/>Open billing</Link></div></section></div>; };
export default PaymentSuccess;
