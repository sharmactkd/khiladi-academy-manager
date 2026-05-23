import { Link, useLocation } from "react-router-dom";

const PaymentFailed = () => {
  const location = useLocation();
  const message = location.state?.message || "Payment could not be completed.";

  return (
    <div className="center-page">
      <div className="card center-card">
        <h1>Payment Failed</h1>
        <p>{message}</p>

        <div className="form-actions">
          <Link className="btn btn-primary" to="/plans">
            Try Again
          </Link>
          <Link className="btn btn-secondary" to="/billing">
            Billing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;