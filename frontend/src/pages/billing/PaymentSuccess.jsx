import { Link, useLocation } from "react-router-dom";

const PaymentSuccess = () => {
  const location = useLocation();
  const subscription = location.state?.subscription;
  const invoice = location.state?.invoice;

  return (
    <div className="center-page">
      <div className="card center-card">
        <h1>Payment Successful</h1>
        <p>Your subscription has been activated successfully.</p>

        {subscription && (
          <p>
            Plan: <strong>{subscription.planCode}</strong>
          </p>
        )}

        {invoice && (
          <p>
            Invoice: <strong>{invoice.invoiceNumber}</strong>
          </p>
        )}

        <div className="form-actions">
          <Link className="btn btn-primary" to="/billing">
            Go to Billing
          </Link>
          <Link className="btn btn-secondary" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;