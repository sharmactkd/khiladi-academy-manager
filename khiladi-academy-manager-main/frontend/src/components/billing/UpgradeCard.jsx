import { Link } from "react-router-dom";

const UpgradeCard = ({ title = "Premium Feature", message }) => {
  return (
    <div className="card upgrade-card">
      <h2>{title}</h2>
      <p>
        {message ||
          "This feature is not available in your current plan. Upgrade to unlock it."}
      </p>

      <Link className="btn btn-primary" to="/plans">
        View Plans
      </Link>
    </div>
  );
};

export default UpgradeCard;