import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";

const AddStudent = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: "other",
      status: "active",
    },
  });

  useEffect(() => {
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
      setSaving(true);
      await studentApi.create(values);
      toast.success("Student add ho gaya");
      navigate("/students");
    } catch (error) {
      toast.error(error.response?.data?.message || "Student add nahi hua");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Student</h1>
          <p>Naya student record create karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-3">
          <label>
            Student Code *
            <input
              {...register("studentCode", { required: "Student code required" })}
            />
            {errors.studentCode && <small>{errors.studentCode.message}</small>}
          </label>

          <label>
            Name *
            <input {...register("name", { required: "Name required" })} />
            {errors.name && <small>{errors.name.message}</small>}
          </label>

          <label>
            Batch
            <select {...register("batch")}>
              <option value="">No Batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Admission Number
            <input {...register("admissionNumber")} />
          </label>

          <label>
            Gender
            <select {...register("gender")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            DOB
            <input type="date" {...register("dob")} />
          </label>

          <label>
            Phone
            <input {...register("phone")} />
          </label>

          <label>
            Email
            <input type="email" {...register("email")} />
          </label>

          <label>
            Parent Name
            <input {...register("parentName")} />
          </label>

          <label>
            Parent Phone
            <input {...register("parentPhone")} />
          </label>

          <label>
            Martial Art
            <input {...register("martialArt")} />
          </label>

          <label>
            Belt Rank
            <input {...register("beltRank")} />
          </label>

          <label>
            Joining Date
            <input type="date" {...register("joiningDate")} />
          </label>

          <label>
            City
            <input {...register("city")} />
          </label>

          <label>
            State
            <input {...register("state")} />
          </label>
        </div>

        <label>
          Address
          <textarea {...register("address")} />
        </label>

        <label>
          Medical Notes
          <textarea {...register("medicalNotes")} />
        </label>

        <div className="grid grid-2">
          <label>
            Emergency Contact Name
            <input {...register("emergencyContactName")} />
          </label>

          <label>
            Emergency Contact Phone
            <input {...register("emergencyContactPhone")} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/students")}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;