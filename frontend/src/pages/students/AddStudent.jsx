import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";

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

  const [studentContact, setStudentContact] = useState({
    countryCode: "+91",
    phone: "",
    country: "India",
    state: "",
    city: "",
   
  });

  const [parentContact, setParentContact] = useState({
    countryCode: "+91",
    phone: "",
  });

  const [emergencyContact, setEmergencyContact] = useState({
    countryCode: "+91",
    phone: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: "other",
      status: "active",
      schoolName: "",
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

  const updateStudentContact = (field, value) => {
    setStudentContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateParentContact = (field, value) => {
    setParentContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateEmergencyContact = (field, value) => {
    setEmergencyContact((prev) => ({
      ...prev,
      [field]: value,
    }));
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

        countryCode: studentContact.countryCode || "+91",
        phone: studentContact.phone || "",
        country: studentContact.country || "India",
        state: studentContact.state || "",
        city: studentContact.city || "",
       

        email: values.email || "",
        schoolName: values.schoolName || "",
        address: values.address || "",

        parentName: values.parentName || "",
        parentCountryCode: parentContact.countryCode || "+91",
        parentPhone: parentContact.phone || "",

        martialArt: values.martialArt || "Taekwondo",
        beltRank: values.beltRank || "",
        joiningDate: values.joiningDate || "",
        status: values.status || "active",

        emergencyContactName: values.emergencyContactName || "",
        emergencyContactCountryCode: emergencyContact.countryCode || "+91",
        emergencyContactPhone: emergencyContact.phone || "",

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
            Email
            <input type="email" {...register("email")} />
          </label>

          <label>
            School Name
            <input {...register("schoolName")} placeholder="Enter school name" />
          </label>

          <label>
            Parent Name
            <input {...register("parentName")} />
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
        </div>

        <div className="card subtle-card">
          <h3>Student Contact & Location</h3>

          <PhoneLocationFields
            countryCode={studentContact.countryCode}
            phone={studentContact.phone}
            country={studentContact.country}
            state={studentContact.state}
            city={studentContact.city}
         
            phoneLabel="Student Phone"
            onChange={updateStudentContact}
          />
        </div>

        <div className="card subtle-card">
          <h3>Parent Contact</h3>

          <div className="grid grid-2">
            <PhoneLocationFields
              countryCode={parentContact.countryCode}
              phone={parentContact.phone}
              phoneLabel="Parent Phone"
              showLocation={false}
              onChange={updateParentContact}
            />
          </div>
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

        <div className="card subtle-card">
          <h3>Emergency Contact</h3>

          <div className="grid grid-2">
            <label>
              Emergency Contact Name
              <input {...register("emergencyContactName")} />
            </label>

            <PhoneLocationFields
              countryCode={emergencyContact.countryCode}
              phone={emergencyContact.phone}
              phoneLabel="Emergency Contact Phone"
              showLocation={false}
              onChange={updateEmergencyContact}
            />
          </div>
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