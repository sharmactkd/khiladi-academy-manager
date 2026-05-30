import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatPhone = (value) => {
  const digits = onlyDigits(value).slice(0, 10);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null) return;
  formData.append(key, value);
};

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      admissionNumber: "",
      name: "",
      batch: "",
      status: "active",
      gender: "other",
      dob: "",
      phone: "",
      email: "",
      parentName: "",
      parentPhone: "",
      martialArt: "",
      beltRank: "",
      joiningDate: "",
      city: "",
      state: "",
      address: "",
      medicalNotes: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, batchRes] = await Promise.all([
          studentApi.getById(id),
          batchApi.getAll(),
        ]);

        const studentData = studentRes?.data || null;
        setStudent(studentData);

        const batchList = Array.isArray(batchRes.data)
          ? batchRes.data
          : batchRes.data?.data || [];

        setBatches(batchList.filter((batch) => batch.isActive));

        reset({
          admissionNumber: studentData?.admissionNumber || "",
          name: `${studentData?.firstName || ""} ${
            studentData?.lastName || ""
          }`.trim(),
          batch: studentData?.batch?._id || studentData?.batch || "",
          status: studentData?.status || "active",
          gender: studentData?.gender || "other",
          dob: toDateInput(studentData?.dateOfBirth),
          phone: formatPhone(studentData?.phone || ""),
          email: studentData?.email || "",
          parentName: studentData?.parentName || "",
          parentPhone: formatPhone(studentData?.parentPhone || ""),
          martialArt: studentData?.martialArt || "",
          beltRank: studentData?.beltRank || "",
          joiningDate: toDateInput(studentData?.joiningDate),
          city: studentData?.city || "",
          state: studentData?.state || "",
          address: studentData?.address || "",
          medicalNotes: studentData?.notes || "",
          emergencyContactName: studentData?.emergencyContact?.name || "",
          emergencyContactPhone: formatPhone(
            studentData?.emergencyContact?.phone || ""
          ),
        });

        setProfilePhotoPreview(
          studentData?.profilePhoto ? getStudentPhotoUrl(studentData) : ""
        );
      } catch (error) {
        toast.error(error.response?.data?.message || "Student load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

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
      setProfilePhotoPreview(student ? getStudentPhotoUrl(student) : "");
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
        batch: values.batch || "",
        status: values.status || "active",
        gender: values.gender || "other",
        dateOfBirth: values.dob,
        phone: values.phone || "",
        email: values.email || "",
        martialArt: values.martialArt || "Taekwondo",
        beltRank: values.beltRank || "",
        joiningDate: values.joiningDate || "",
        city: values.city || "",
        state: values.state || "",
        address: values.address || "",
        notes: values.medicalNotes || "",
        emergencyContactName: values.emergencyContactName || "",
        emergencyContactPhone: values.emergencyContactPhone || "",
      };

      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        appendFormDataValue(formData, key, value);
      });

      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }

      await studentApi.update(id, formData);

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
            Admission Number
            <input {...register("admissionNumber")} />
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
              onError={(event) => {
                event.currentTarget.src = "/default-avatar.png";
              }}
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