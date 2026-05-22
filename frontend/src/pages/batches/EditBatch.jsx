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
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const response = await batchApi.getById(id);
        const batch = response.data?.data?.batch;
        reset(batch);
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
        ...values,
        maxStudents: Number(values.maxStudents || 0),
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
            <input {...register("batchName")} />
          </label>

          <label>
            Martial Art
            <input {...register("martialArt")} />
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