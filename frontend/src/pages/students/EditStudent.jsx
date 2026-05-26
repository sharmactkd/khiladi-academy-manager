import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";

const toDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, batchRes] = await Promise.all([
          studentApi.getById(id),
          batchApi.getAll({ status: "active" }),
        ]);

        const student = studentRes.data?.data || null;
        const batchList = batchRes.data?.data || [];
setBatches(batchList.filter((batch) => batch.isActive));

        reset({
          ...student,
          batch: student?.batch?._id || "",
          dob: toDateInput(student?.dateOfBirth),
          joiningDate: toDateInput(student?.joiningDate),
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Student load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      await studentApi.update(id, values);
      toast.success("Student update ho gaya");
      navigate(`/students/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Student update nahi hua");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading student...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Student</h1>
          <p>Student details update karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-3">
          <label>
            Student Code
            <input {...register("studentCode")} />
          </label>

          <label>
            Name
            <input {...register("name")} />
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
            Status
            <select {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="left">Left</option>
            </select>
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
        </div>

        <label>
          Address
          <textarea {...register("address")} />
        </label>

        <label>
          Medical Notes
          <textarea {...register("medicalNotes")} />
        </label>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(`/students/${id}`)}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Update Student"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;