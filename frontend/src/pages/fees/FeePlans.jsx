import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { feePlanApi } from "../../api/feeApi.js";
import { batchApi } from "../../api/batchApi.js";

const FeePlans = () => {
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { billingCycle: "monthly", isActive: true },
  });

  const fetchPlans = async () => {
    try {
      const response = await feePlanApi.getAll();
      setPlans(response.data?.data?.feePlans || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Fee plans load nahi hue");
    }
  };

  useEffect(() => {
    fetchPlans();

    const fetchBatches = async () => {
      try {
        const response = await batchApi.getAll({ status: "active" });
        setBatches(response.data?.data?.batches || []);
      } catch {
        setBatches([]);
      }
    };

    fetchBatches();
  }, []);

  const onSubmit = async (values) => {
    try {
      await feePlanApi.create({
        ...values,
        amount: Number(values.amount || 0),
      });
      toast.success("Fee plan create ho gaya");
      reset({ billingCycle: "monthly", isActive: true });
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Fee plan create nahi hua");
    }
  };

  const deactivatePlan = async (id) => {
    try {
      await feePlanApi.remove(id);
      toast.success("Fee plan inactive ho gaya");
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Fee plan inactive nahi hua");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fee Plans</h1>
          <p>Monthly, quarterly, yearly plans banayein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-3">
          <label>
            Plan Name
            <input {...register("name", { required: true })} />
          </label>

          <label>
            Amount
            <input type="number" min="0" {...register("amount")} />
          </label>

          <label>
            Billing Cycle
            <select {...register("billingCycle")}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label>
            Martial Art
            <input {...register("martialArt")} />
          </label>

          <label>
            Batch
            <select {...register("batch")}>
              <option value="">No specific batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="btn btn-primary">Create Plan</button>
      </form>

      <div className="card">
        <h2>All Fee Plans</h2>
        {plans.length === 0 ? (
          <p>No fee plans found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Cycle</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id}>
                    <td>{plan.name}</td>
                    <td>₹{plan.amount}</td>
                    <td>{plan.billingCycle}</td>
                    <td>{plan.batch?.batchName || "-"}</td>
                    <td>{plan.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      {plan.isActive && (
                        <button onClick={() => deactivatePlan(plan._id)}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeePlans;