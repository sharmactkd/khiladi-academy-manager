import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatPhone = (value) => {
  const digits = onlyDigits(value).slice(0, 10);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const AddStudent = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: "other",
      status: "active",
      phone: "",
      parentPhone: "",
      emergencyContactPhone: "",
    },
  });

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await batchApi.getAll();

        const list = response.data?.data || [];
        const activeBatches = list.filter((batch) => batch.isActive);

        setBatches(activeBatches);
      } catch {
        setBatches([]);
      }
    };

    fetchBatches();
  }, []);

  const handlePhoneChange = (fieldName, event) => {
    const formattedPhone = formatPhone(event.target.value);

    setValue(fieldName, formattedPhone, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

const onSubmit = async (values) => {
  try {
    setSaving(true);

    const nameParts = String(values.name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    const payload = {
      ...values,

      firstName,
      lastName,
      dateOfBirth: values.dob,
      admissionNumber: values.admissionNumber || values.studentCode,

      emergencyContact: {
        name: values.emergencyContactName || "",
        phone: values.emergencyContactPhone || "",
      },
    };

    await studentApi.create(payload);

    toast.success("Student add ho gaya");
    navigate("/students");
  } catch (error) {
    toast.error(error.response?.data?.message || "Student add nahi hua");
    console.log("Student create error:", error.response?.data);
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
            <input
  {...register("admissionNumber", {
    required: "Admission number required",
  })}
/>
{errors.admissionNumber && (
  <small>{errors.admissionNumber.message}</small>
)}
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
            <input type="date" {...register("dob", { required: "DOB required" })} />
{errors.dob && <small>{errors.dob.message}</small>}
          </label>

          <label>
            Phone
            <input
              {...register("phone")}
              inputMode="numeric"
              placeholder="0000-00-0000"
              maxLength={12}
              onChange={(event) => handlePhoneChange("phone", event)}
            />
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
            <input
              {...register("parentPhone")}
              inputMode="numeric"
              placeholder="0000-00-0000"
              maxLength={12}
              onChange={(event) => handlePhoneChange("parentPhone", event)}
            />
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
            <input
              {...register("emergencyContactPhone")}
              inputMode="numeric"
              placeholder="0000-00-0000"
              maxLength={12}
              onChange={(event) =>
                handlePhoneChange("emergencyContactPhone", event)
              }
            />
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