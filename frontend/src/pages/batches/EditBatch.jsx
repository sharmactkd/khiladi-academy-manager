import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { batchApi } from "../../api/batchApi.js";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const EditBatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      batchName: "",
      martialArt: "",
      startTime: "",
      endTime: "",
      maxStudents: 0,
      status: "active",
      days: [],
      monthlyFee: 0,
      quarterlyFee: 0,
      annualFee: 0,
      notes: "",
    },
  });

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const response = await batchApi.getById(id);
        const batch = response.data?.data;

        if (!batch) {
          toast.error("Batch not found");
          return;
        }

        reset({
          batchName: batch.batchName || "",
          martialArt: batch.martialArt || "",
          startTime: batch.schedule?.[0]?.startTime || "",
          endTime: batch.schedule?.[0]?.endTime || "",
          maxStudents: batch.capacity || 0,
          status: batch.isActive ? "active" : "inactive",
          days: batch.schedule?.map((item) => item.day) || [],
          monthlyFee: batch.monthlyFee || 0,
          quarterlyFee: batch.quarterlyFee || 0,
          annualFee: batch.annualFee || 0,
          notes: batch.notes || "",
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Batch load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [id, reset]);

  const onSubmit = async (values) => {
    try {
      await batchApi.update(id, {
        batchName: values.batchName,
        martialArt: values.martialArt,
        capacity: Number(values.maxStudents || 0),
        isActive: values.status === "active",
        notes: values.notes || "",

        monthlyFee: Number(values.monthlyFee || 0),
        quarterlyFee: Number(values.quarterlyFee || 0),
        annualFee: Number(values.annualFee || 0),

        schedule: (values.days || []).map((day) => ({
          day,
          startTime: values.startTime,
          endTime: values.endTime,
        })),
      });

      toast.success("Batch update ho gaya");
      navigate(`/batches/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch update nahi hua");
    }
  };

  if (loading) return <p>Loading batch...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Batch</h1>
          <p>Batch details update karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-2">
          <label>
            Batch Name
            <input
              {...register("batchName", {
                required: "Batch name required",
              })}
            />
            {errors.batchName && <small>{errors.batchName.message}</small>}
          </label>

          <label>
            Martial Art
            <input
              {...register("martialArt", {
                required: "Martial art required",
              })}
            />
            {errors.martialArt && <small>{errors.martialArt.message}</small>}
          </label>

          <label>
            Start Time
            <input type="time" {...register("startTime")} />
          </label>

          <label>
            End Time
            <input type="time" {...register("endTime")} />
          </label>

          <label>
            Max Students
            <input type="number" min="0" {...register("maxStudents")} />
          </label>

          <label>
            Status
            <select {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="card subtle-card">
          <h3>Batch Fees</h3>
          <p>
            Ye fees is batch ke sabhi students ke liye default use hogi.
            Student-specific fee override ho to wo priority lega.
          </p>

          <div className="grid grid-3">
            <label>
              Monthly Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("monthlyFee")}
              />
            </label>

            <label>
              Quarterly Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("quarterlyFee")}
              />
            </label>

            <label>
              Annual Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("annualFee")}
              />
            </label>
          </div>
        </div>

        <div className="card subtle-card">
          <h3>Training Days</h3>

          <div className="actions" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setValue("days", DAYS)}>
              All Days
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("days", [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ])
              }
            >
              Week Days (Only Sunday off)
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("days", [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                ])
              }
            >
              Week Days (Saturday - Sunday off)
            </button>

            <button
              type="button"
              onClick={() => setValue("days", ["monday", "wednesday", "friday"])}
            >
              M W F
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("days", ["tuesday", "thursday", "saturday"])
              }
            >
              T T S
            </button>

            <button type="button" onClick={() => setValue("days", [])}>
              Clear
            </button>
          </div>

          <div className="checkbox-grid">
            {DAYS.map((day) => (
              <label key={day}>
                <input type="checkbox" value={day} {...register("days")} />
                {day}
              </label>
            ))}
          </div>
        </div>

        <label>
          Notes
          <textarea {...register("notes")} />
        </label>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(`/batches/${id}`)}>
            Cancel
          </button>
          <button className="btn btn-primary">Update Batch</button>
        </div>
      </form>
    </div>
  );
};

export default EditBatch;