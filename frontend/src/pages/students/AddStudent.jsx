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

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null) return;

  if (typeof value === "object" && !(value instanceof File)) {
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, value);
};

const AddStudent = () => {
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");

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

        const list = response.data?.data || response.data?.data?.batches || [];
        const activeBatches = Array.isArray(list)
          ? list.filter((batch) => batch.isActive)
          : [];

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

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setProfilePhoto(null);
      setProfilePhotoPreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP image allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size 2MB se kam honi chahiye");
      event.target.value = "";
      return;
    }

    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      const nameParts = String(values.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ");

      const payload = {
        admissionNumber: values.admissionNumber,
        firstName,
        lastName,
        gender: values.gender,
        dateOfBirth: values.dob,
        batch: values.batch || "",
        phone: values.phone || "",
        email: values.email || "",
        address: values.address || "",
        city: values.city || "",
        state: values.state || "",
        martialArt: values.martialArt || "Taekwondo",
        beltRank: values.beltRank || "",
        joiningDate: values.joiningDate || "",
        status: values.status || "active",
        emergencyContactName: values.emergencyContactName || "",
        emergencyContactPhone: values.emergencyContactPhone || "",
        notes: values.medicalNotes || "",
      };

      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        appendFormDataValue(formData, key, value);
      });

      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }

      await studentApi.create(formData);

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
              {...register("studentCode", {
                required: "Student code required",
              })}
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
            Admission Number *
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
            DOB *
            <input
              type="date"
              {...register("dob", { required: "DOB required" })}
            />
            {errors.dob && <small>{errors.dob.message}</small>}
          </label>

          <label>
            Passport Size Photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleProfilePhotoChange}
            />
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

        {profilePhotoPreview && (
          <div className="card" style={{ maxWidth: "220px" }}>
            <p style={{ marginTop: 0 }}>Photo Preview</p>
            <img
              src={profilePhotoPreview}
              alt="Student preview"
              style={{
                width: "120px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
          </div>
        )}

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