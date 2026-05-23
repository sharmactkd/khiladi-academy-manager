import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { billingApi } from "../../api/billingApi.js";
import UsageMeter from "../../components/billing/UsageMeter.jsx";
import PremiumBadge from "../../components/billing/PremiumBadge.jsx";

const BillingDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const response = await billingApi.getMySubscription();
      setData(response.data?.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleCancel = async () => {
    const confirmed = window.confirm("Cancel current subscription?");
    if (!confirmed) return;

    await billingApi.cancelSubscription();
    await loadBilling();
  };

  if (loading) {
    return <div className="card">Loading billing...</div>;
  }

  const plan = data?.plan || {};
  const subscription = data?.subscription || {};
  const usage = data?.usage || {};
  const limits = plan?.limits || {};

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Billing Dashboard</h1>
          <p>Manage subscription, usage, payments and invoices.</p>
        </div>

        <Link className="btn btn-primary" to="/plans">
          Upgrade Plan
        </Link>
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Current Plan</h2>
          <p>
            <strong>{plan.name || "Free"}</strong>{" "}
            <PremiumBadge>{subscription.status || "active"}</PremiumBadge>
          </p>
          <p>Plan Code: {subscription.planCode || plan.code || "free"}</p>
          <p>Source: {subscription.source || "free"}</p>
          <p>
            Start:{" "}
            {subscription.startDate
              ? new Date(subscription.startDate).toLocaleDateString()
              : "-"}
          </p>
          <p>
            End:{" "}
            {subscription.endDate
              ? new Date(subscription.endDate).toLocaleDateString()
              : "No expiry"}
          </p>

          <div className="form-actions">
            <Link className="btn btn-secondary" to="/billing/payments">
              Payment History
            </Link>
            <Link className="btn btn-secondary" to="/billing/invoices">
              Invoices
            </Link>
            {subscription.planCode !== "free" && (
              <button className="btn btn-outline" type="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Feature Access</h2>
          <p>Parent Portal: {limits.parentPortal ? "Enabled" : "Locked"}</p>
          <p>WhatsApp: {limits.whatsapp ? "Enabled" : "Locked"}</p>
          <p>Analytics: {limits.analytics ? "Enabled" : "Locked"}</p>
          <p>Multi Branch: {limits.multiBranch ? "Enabled" : "Locked"}</p>
        </div>
      </div>

      <div className="card">
        <h2>Usage</h2>
        <div className="usage-grid">
          <UsageMeter label="Students" used={usage.students} limit={limits.students} />
          <UsageMeter label="Batches" used={usage.batches} limit={limits.batches} />
          <UsageMeter
            label="Certificates"
            used={usage.certificates}
            limit={limits.certificates}
          />
          <UsageMeter label="ID Cards" used={usage.idCards} limit={limits.idCards} />
          <UsageMeter
            label="Announcements"
            used={usage.announcements}
            limit={limits.announcements}
          />
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;