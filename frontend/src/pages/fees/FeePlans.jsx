import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { feePlanApi } from "../../api/feeApi.js";
import { batchApi } from "../../api/batchApi.js";

const defaultForm = {
  name: "",
  batch: "",
  monthlyAmount: "",
  dueDay: 5,
  martialArt: "Taekwondo",
  isActive: true,
};

const FeePlans = () => {
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(defaultForm);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const response = await feePlanApi.getAll();
      setPlans(response.data?.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Fee plans load nahi hue"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await batchApi.getAll();

      const list = response.data?.data || [];

      setBatches(
        list.filter((batch) => batch.isActive)
      );
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchBatches();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
        monthlyAmount: Number(form.monthlyAmount || 0),
        dueDay: Number(form.dueDay || 1),
      };

      if (editingId) {
        await feePlanApi.update(editingId, payload);

        toast.success("Fee plan update ho gaya");
      } else {
        await feePlanApi.create(payload);

        toast.success("Fee plan create ho gaya");
      }

      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Fee plan save nahi hua"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan._id);

    setForm({
      name: plan.name || "",
      batch: plan.batch?._id || "",
      monthlyAmount: plan.monthlyAmount || "",
      dueDay: plan.dueDay || 5,
      martialArt: plan.martialArt || "Taekwondo",
      isActive: Boolean(plan.isActive),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (plan) => {
    const confirmed = window.confirm(
      `Kya aap "${plan.name}" fee plan delete karna chahte hain?`
    );

    if (!confirmed) return;

    try {
      await feePlanApi.remove(plan._id);

      toast.success("Fee plan delete ho gaya");

      fetchPlans();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Fee plan delete nahi hua"
      );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fee Plans</h1>
          <p>
            Batch-wise aur monthly fee plans manage
            karein
          </p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="page-header">
          <div>
            <h2>
              {editingId
                ? "Edit Fee Plan"
                : "Create Fee Plan"}
            </h2>

            <p>
              Monthly fee structure aur due date set
              karein
            </p>
          </div>
        </div>

        <div className="grid grid-3">
          <label>
            Plan Name *
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Batch
            <select
              value={form.batch}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  batch: event.target.value,
                }))
              }
            >
              <option value="">
                Default Academy Plan
              </option>

              {batches.map((batch) => (
                <option
                  key={batch._id}
                  value={batch._id}
                >
                  {batch.batchName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Martial Art
            <input
              value={form.martialArt}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  martialArt: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Monthly Amount *
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyAmount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  monthlyAmount:
                    event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Due Day *
            <input
              type="number"
              min="1"
              max="31"
              value={form.dueDay}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  dueDay: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Status
            <select
              value={String(form.isActive)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  isActive:
                    event.target.value === "true",
                }))
              }
            >
              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>
          </label>
        </div>

        <div className="form-actions">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}

          <button
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Plan"
                : "Create Plan"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="page-header">
          <div>
            <h2>All Fee Plans</h2>
            <p>
              Existing fee structures aur due settings
            </p>
          </div>
        </div>

        {loading ? (
          <p>Loading fee plans...</p>
        ) : plans.length === 0 ? (
          <p>No fee plans found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Batch</th>
                  <th>Martial Art</th>
                  <th>Monthly Fee</th>
                  <th>Due Day</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id}>
                    <td>{plan.name || "-"}</td>

                    <td>
                      {plan.batch?.batchName ||
                        "Default Academy"}
                    </td>

                    <td>
                      {plan.martialArt || "-"}
                    </td>

                    <td>
                      ₹
                      {Number(
                        plan.monthlyAmount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      {plan.dueDay || "-"}
                    </td>

                    <td>
                      <span
                        className={`badge badge-${
                          plan.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {plan.isActive
                          ? "active"
                          : "inactive"}
                      </span>
                    </td>

                    <td className="actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(plan)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() =>
                          handleDelete(plan)
                        }
                      >
                        Delete
                      </button>
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