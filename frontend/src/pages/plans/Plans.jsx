import { useEffect, useState } from "react";
import { planApi } from "../../api/planApi.js";
import { billingApi } from "../../api/billingApi.js";
import PlanCard from "../../components/billing/PlanCard.jsx";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [currentPlanCode, setCurrentPlanCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const [plansResponse, subscriptionResponse] = await Promise.allSettled([
          planApi.getAll(),
          billingApi.getMySubscription(),
        ]);

        if (plansResponse.status === "fulfilled") {
          setPlans(plansResponse.value.data?.data?.plans || []);
        }

        if (subscriptionResponse.status === "fulfilled") {
          setCurrentPlanCode(
            subscriptionResponse.value.data?.data?.subscription?.planCode || ""
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) {
    return <div className="card">Loading plans...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Plans</h1>
          <p>Choose the best plan for your academy.</p>
        </div>
      </div>

      <div className="plans-grid">
        {plans.length === 0 ? (
          <div className="card">No plans found. Ask super admin to seed plans.</div>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              currentPlanCode={currentPlanCode}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Plans;