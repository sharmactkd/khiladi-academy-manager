import { useNavigate } from "react-router-dom";
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

const AddBatch = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      status: "active",
      days: [],
    },
  });

  const onSubmit = async (values) => {
    try {
   await batchApi.create({
  batchName: values.batchName,
  martialArt: values.martialArt,
  capacity: Number(values.maxStudents || 0),
  isActive: values.status === "active",
  notes: values.notes || "",
  schedule: (values.days || []).map((day) => ({
    day,
    startTime: values.startTime,
    endTime: values.endTime,
  })),
});
      toast.success("Batch create ho gaya");
      navigate("/batches");
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch create nahi hua");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Batch</h1>
          <p>Nayi class/batch create karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-2">
          <label>
            Batch Name *
            <input {...register("batchName", { required: true })} />
          </label>

          <label>
            Martial Art *
            <input {...register("martialArt", { required: true })} />
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
          <h3>Training Days</h3>
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
          <button type="button" onClick={() => navigate("/batches")}>
            Cancel
          </button>
          <button className="btn btn-primary">Save Batch</button>
        </div>
      </form>
    </div>
  );
};

export default AddBatch;