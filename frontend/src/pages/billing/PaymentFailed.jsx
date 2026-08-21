import { Link, useLocation } from "react-router-dom";
import { CircleX, CreditCard, LifeBuoy } from "lucide-react";
import styles from "./BillingFlow.module.css";
const PaymentFailed = () => { const { state = {} } = useLocation(); const message = state.message || "Payment could not be completed."; return <div className={`page ${styles.page}`}><section className={`${styles.resultCard} ${styles.failedCard}`}><span><CircleX size={34}/></span><small>PAYMENT NOT COMPLETED</small><h1>Payment Failed</h1><p>{message}</p><div className={styles.assurance}><LifeBuoy size={17}/>If money was deducted, check payment history before retrying. Contact support with the order reference if required.</div><div><Link to="/billing?tab=plans"><CreditCard size={16}/>Choose plan</Link><Link className={styles.resultPrimary} to="/billing">Billing overview</Link></div></section></div>; };
export default PaymentFailed;
