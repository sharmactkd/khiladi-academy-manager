import { Link } from "react-router-dom";

const FeesDashboard = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fees</h1>
          <p>Fee plans, collection aur pending fees manage karein</p>
        </div>
      </div>

      <div className="grid grid-3">
        <Link className="card action-card" to="/fees/plans">
          Fee Plans
        </Link>
        <Link className="card action-card" to="/fees/collect">
          Collect Fee
        </Link>
        <Link className="card action-card" to="/fees/pending">
          Pending Fees
        </Link>
      </div>
    </div>
  );
};

export default FeesDashboard;