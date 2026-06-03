import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";
import {
  TAEKWONDO_BELTS,
  TAEKWONDO_DAN_RANKS,
  isTaekwondoSport,
} from "../../components/taekwondoBelts/taekwondoBelts.js";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const MEDICAL_CONDITIONS = [
  "Asthma",
  "Diabetes",
  "Heart Issue",
  "Allergies",
  "Epilepsy",
  "High BP",
  "Low BP",
  "Joint Pain",
  "Previous Injury",
];

const formatPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const toDateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null) return;

  if (typeof value === "object" && !(value instanceof File)) {
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, value);
};

const calculateAge = (dob) => {
  if (!dob) return "";

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : "";
};

const getAgeCategory = (age) => {
  if (age === "" || age === null || age === undefined) return "";

  const numericAge = Number(age);

  if (numericAge <= 11) return "Sub-Junior";
  if (numericAge <= 14) return "Cadet";
  if (numericAge <= 17) return "Junior";
  return "Senior";
};

const isTaekwondo = isTaekwondoSport;

const normalizeConditions = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
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

  const [medicalConditions, setMedicalConditions] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      admissionNumber: "",
      aadhaarNumber: "",
      name: "",
      batch: "",
      status: "active",
      gender: "other",
      dob: "",
      email: "",
      schoolName: "",
      className: "",
      section: "",
      collegeName: "",
      occupation: "",
      parentName: "",
      martialArt: "Taekwondo",
      beltRank: "",
      danRank: "",
      heightCm: "",
      weightKg: "",
      bloodGroup: "",
      joiningDate: "",
      address: "",
      medicalNotes: "",
      emergencyContactName: "",
    },
  });

  const dob = useWatch({ control, name: "dob" });
  const martialArt = useWatch({ control, name: "martialArt" });
  const beltRank = useWatch({ control, name: "beltRank" });

  const age = useMemo(() => calculateAge(dob), [dob]);
  const ageCategory = useMemo(() => getAgeCategory(age), [age]);

  const showTaekwondoBeltDropdown = isTaekwondo(martialArt);
  const showDanRank = showTaekwondoBeltDropdown && beltRank === "Black";

  useEffect(() => {
    if (beltRank !== "Black") {
      setValue("danRank", "");
    }
  }, [beltRank, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, batchRes] = await Promise.all([
          studentApi.getById(id),
          batchApi.getAll(),
        ]);

        const studentData =
          studentRes?.data?.data || studentRes?.data?.student || studentRes?.data || null;

        setStudent(studentData);

        const batchList = Array.isArray(batchRes.data)
          ? batchRes.data
          : batchRes.data?.data || [];

        setBatches(batchList.filter((batch) => batch.isActive));

        reset({
          admissionNumber: studentData?.admissionNumber || "",
          aadhaarNumber: studentData?.aadhaarNumber || "",
          name: `${studentData?.firstName || ""} ${
            studentData?.lastName || ""
          }`.trim(),
          batch: studentData?.batch?._id || studentData?.batch || "",
          status: studentData?.status || "active",
          gender: studentData?.gender || "other",
          dob: toDateInput(studentData?.dateOfBirth),
          email: studentData?.email || "",

          schoolName:
            studentData?.schoolName || studentData?.education?.schoolName || "",
          className:
            studentData?.className || studentData?.education?.className || "",
          section: studentData?.section || studentData?.education?.section || "",
          collegeName:
            studentData?.collegeName ||
            studentData?.education?.collegeName ||
            "",
          occupation:
            studentData?.occupation ||
            studentData?.education?.occupation ||
            "",

          parentName: studentData?.parentName || "",
          martialArt: studentData?.martialArt || "Taekwondo",
          beltRank: studentData?.beltRank || "",
          danRank: studentData?.danRank || "",

          heightCm:
            studentData?.heightCm ??
            studentData?.physicalInfo?.heightCm ??
            "",
          weightKg:
            studentData?.weightKg ??
            studentData?.physicalInfo?.weightKg ??
            "",

          bloodGroup:
            studentData?.bloodGroup ||
            studentData?.medicalInfo?.bloodGroup ||
            "",

          joiningDate: toDateInput(studentData?.joiningDate),
          address: studentData?.address || "",
          medicalNotes:
            studentData?.notes || studentData?.medicalInfo?.notes || "",
          emergencyContactName: studentData?.emergencyContact?.name || "",
        });

        setMedicalConditions(
          normalizeConditions(
            studentData?.medicalConditions ||
              studentData?.medicalInfo?.medicalConditions
          )
        );

        setStudentContact({
          countryCode: studentData?.countryCode || "+91",
          phone: formatPhone(studentData?.phone || ""),
          country: studentData?.country || "India",
          state: studentData?.state || "",
          city: studentData?.city || "",
        });

        setParentContact({
          countryCode: studentData?.parentCountryCode || "+91",
          phone: formatPhone(studentData?.parentPhone || ""),
        });

        setEmergencyContact({
          countryCode: studentData?.emergencyContact?.countryCode || "+91",
          phone: formatPhone(studentData?.emergencyContact?.phone || ""),
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

  const toggleMedicalCondition = (condition) => {
    setMedicalConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((item) => item !== condition)
        : [...prev, condition]
    );
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
        aadhaarNumber: values.aadhaarNumber || "",
        firstName,
        lastName,
        batch: values.batch || "",
        status: values.status || "active",
        gender: values.gender || "other",
        dateOfBirth: values.dob,

        countryCode: studentContact.countryCode || "+91",
        phone: studentContact.phone || "",
        country: studentContact.country || "India",
        state: studentContact.state || "",
        city: studentContact.city || "",

        email: values.email || "",
        address: values.address || "",

        schoolName: values.schoolName || "",
        className: values.className || "",
        section: values.section || "",
        collegeName: values.collegeName || "",
        occupation: values.occupation || "",

        parentName: values.parentName || "",
        parentCountryCode: parentContact.countryCode || "+91",
        parentPhone: parentContact.phone || "",

        martialArt: values.martialArt || "Taekwondo",
        beltRank: values.beltRank || "",
        danRank: values.danRank || "",

        heightCm: values.heightCm || "",
        weightKg: values.weightKg || "",

        bloodGroup: values.bloodGroup || "",
        medicalConditions,

        joiningDate: values.joiningDate || "",

        notes: values.medicalNotes || "",
        emergencyContactName: values.emergencyContactName || "",
        emergencyContactCountryCode: emergencyContact.countryCode || "+91",
        emergencyContactPhone: emergencyContact.phone || "",
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
        <div className="card subtle-card">
          <h3>Basic Information</h3>

          <div className="grid grid-3">
            <label>
              Admission Number
              <input {...register("admissionNumber")} />
            </label>

            <label>
              Aadhaar Number
              <input
                maxLength={12}
                inputMode="numeric"
                {...register("aadhaarNumber")}
                placeholder="12 digit Aadhaar number"
              />
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
              Age
              <input value={age === "" ? "" : `${age} Years`} readOnly />
            </label>

            <label>
              Age Category
              <input value={ageCategory} readOnly />
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
              Joining Date
              <input type="date" {...register("joiningDate")} />
            </label>
          </div>
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
          <h3>Education Information</h3>

          <div className="grid grid-3">
            <label>
              School Name
              <input
                {...register("schoolName")}
                placeholder="Enter school name"
              />
            </label>

            <label>
              Class
              <input {...register("className")} placeholder="Class" />
            </label>

            <label>
              Section
              <input {...register("section")} placeholder="Section" />
            </label>

            <label>
              College Name
              <input
                {...register("collegeName")}
                placeholder="College name optional"
              />
            </label>

            <label>
              Occupation
              <input
                {...register("occupation")}
                placeholder="For adult students"
              />
            </label>
          </div>
        </div>

        <div className="card subtle-card">
          <h3>Parent Contact</h3>

          <div className="grid grid-2">
            <label>
              Parent Name
              <input {...register("parentName")} />
            </label>

            <PhoneLocationFields
              countryCode={parentContact.countryCode}
              phone={parentContact.phone}
              phoneLabel="Parent Phone"
              showLocation={false}
              onChange={updateParentContact}
            />
          </div>
        </div>

        <div className="card subtle-card">
          <h3>Training Information</h3>

          <div className="grid grid-3">
            <label>
              Martial Art / Sport
              <input {...register("martialArt")} />
            </label>

            <label>
              Belt Rank
              {showTaekwondoBeltDropdown ? (
                <select {...register("beltRank")}>
                  <option value="">Select Belt</option>
                  {TAEKWONDO_BELTS.map((belt) => (
                    <option key={belt} value={belt}>
                      {belt}
                    </option>
                  ))}
                </select>
              ) : (
                <input {...register("beltRank")} />
              )}
            </label>

            {showDanRank && (
              <label>
                Dan Rank
                <select {...register("danRank")}>
                  <option value="">Select Dan</option>
                  {TAEKWONDO_DAN_RANKS.map((dan) => (
                    <option key={dan} value={dan}>
                      {dan}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="card subtle-card">
          <h3>Physical Information</h3>

          <div className="grid grid-2">
            <label>
              Height
              <input
                type="number"
                min="0"
                step="0.1"
                {...register("heightCm")}
                placeholder="Height in cm"
              />
              <small>cm</small>
            </label>

            <label>
              Weight
              <input
                type="number"
                min="0"
                step="0.1"
                {...register("weightKg")}
                placeholder="Weight in kg"
              />
              <small>kg</small>
            </label>
          </div>
        </div>

        <div className="card subtle-card">
          <h3>Medical Information</h3>

          <div className="grid grid-2">
            <label>
              Blood Group
              <select {...register("bloodGroup")}>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group || "none"} value={group}>
                    {group || "Select Blood Group"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Medical Conditions</strong>

            <div className="checkbox-grid" style={{ marginTop: 8 }}>
              {MEDICAL_CONDITIONS.map((condition) => (
                <label key={condition}>
                  <input
                    type="checkbox"
                    checked={medicalConditions.includes(condition)}
                    onChange={() => toggleMedicalCondition(condition)}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </div>

          <label style={{ display: "block", marginTop: 12 }}>
            Medical Notes
            <textarea {...register("medicalNotes")} />
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
          <button
            type="button"
            onClick={() => navigate(`/students/${id}`)}
            disabled={saving}
          >
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