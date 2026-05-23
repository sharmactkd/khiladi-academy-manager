import { Link } from "react-router-dom";
import PremiumBadge from "./PremiumBadge.jsx";

const PlanCard = ({ plan, currentPlanCode }) => {
  const isCurrent = currentPlanCode === plan.code;

  return (
    <div className={`card plan-card ${plan.isPopular ? "popular" : ""}`}>
      <div className="plan-card-header">
        <div>
          <h2>{plan.name}</h2>
          <p>{plan.description}</p>
        </div>

        {plan.isPopular && <PremiumBadge>Popular</PremiumBadge>}
      </div>

      <div className="plan-price">
        {plan.price === 0 ? (
          <strong>{plan.code === "enterprise" ? "Custom" : "Free"}</strong>
        ) : (
          <strong>₹{plan.price}</strong>
        )}
        <span> / {plan.billingCycle}</span>
      </div>

      <ul className="plan-features">
        {(plan.features || []).map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="plan-limits">
        <p>Students: {plan.limits?.students}</p>
        <p>Batches: {plan.limits?.batches}</p>
        <p>Certificates: {plan.limits?.certificates}</p>
        <p>ID Cards: {plan.limits?.idCards}</p>
        <p>Announcements: {plan.limits?.announcements}</p>
        <p>Parent Portal: {plan.limits?.parentPortal ? "Yes" : "No"}</p>
        <p>WhatsApp: {plan.limits?.whatsapp ? "Yes" : "No"}</p>
      </div>

      {isCurrent ? (
        <button className="btn btn-secondary" disabled>
          Current Plan
        </button>
      ) : (
        <Link className="btn btn-primary" to={`/billing/checkout/${plan.code}`}>
          Choose Plan
        </Link>
      )}
    </div>
  );
};

export default PlanCard;