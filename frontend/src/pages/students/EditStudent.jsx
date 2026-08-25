import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, HeartPulse, IdCard, MapPin, Phone, Save, ShieldAlert, UserRound } from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { batchApi } from "../../api/batchApi.js";
import { getBranches } from "../../api/branchApi.js";
import { studentApi } from "../../api/studentApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import { BeltTagsField, SportsMartialArtsField } from "../../components/common/AcademyOperationsFields.jsx";
import FormActionBar from "../../components/common/FormActionBar.jsx";
import OptionChipsField from "../../components/common/OptionChipsField.jsx";
import PersonContactRepeater, { createPersonContact } from "../../components/common/PersonContactRepeater.jsx";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import ProfilePhotoField from "../../components/common/ProfilePhotoField.jsx";
import { TAEKWONDO_DAN_RANKS, isTaekwondoSport } from "../../components/taekwondoBelts/taekwondoBelts.js";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import StudentFormSection from "./components/StudentFormSection.jsx";
import MedicalSelectors, { buildMedicalConditionsPayload, normalizeMedicalSelection } from "./components/MedicalSelectors.jsx";
import "../branches/BranchForm.module.css";
import "../batches/BatchForm.module.css";
import "./StudentForm.module.css";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};
const normalizePersonContacts = (value, legacy = {}) => {
  const list = Array.isArray(value) ? value : [];
  const source = list.length ? list : (legacy.name || legacy.phone ? [legacy] : [{}]);
  return source.map((contact) => ({
    ...createPersonContact(),
    ...contact,
    id: contact.id || crypto.randomUUID(),
    countryCode: contact.countryCode || "+91",
    relation: contact.relation || "",
    customRelation: contact.customRelation || "",
  }));
};
const calculateAge = (dob) => {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let result = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) result -= 1;
  return result >= 0 ? result : "";
};
const ageCategoryFor = (age) => age === "" ? "" : age <= 11 ? "Sub-Junior" : age <= 14 ? "Cadet" : age <= 17 ? "Junior" : "Senior";
const appendValue = (body, key, value) => body.append(key, typeof value === "object" && !(value instanceof File) ? JSON.stringify(value) : value ?? "");
const getRequestErrorMessage = (error) => {
  const data = error?.response?.data?.data;
  const errors = Array.isArray(data) ? data : data?.errors;
  return errors?.[0]?.message || error?.response?.data?.message || "Student could not be updated";
};
const unwrapList = (response, key) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.data?.data?.data,
    response?.[key],
    response?.data?.[key],
    response?.data?.data?.[key],
  ];
  return candidates.find(Array.isArray) || [];
};
const normalizeOptions = (value) => {
  if (Array.isArray(value)) return [...new Set(value.flatMap(normalizeOptions))];
  if (typeof value !== "string" || !value.trim()) return [];
  try { return normalizeOptions(JSON.parse(value)); } catch { return value.split(",").map((item) => item.trim()).filter(Boolean); }
};

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [studentContact, setStudentContact] = useState({ countryCode: "+91", phone: "", country: "India", state: "", city: "" });
  const [parentContacts, setParentContacts] = useState([createPersonContact()]);
  const [emergencyContacts, setEmergencyContacts] = useState([createPersonContact()]);
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [otherMedicalCondition, setOtherMedicalCondition] = useState("");
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { branch: "", batch: "", gender: "male", status: "active", martialArt: "", beltRank: "", danRank: "", bloodGroup: "" },
  });
  const dob = useWatch({ control, name: "dob" });
  const martialArt = useWatch({ control, name: "martialArt" });
  const beltRank = useWatch({ control, name: "beltRank" });
  const gender = useWatch({ control, name: "gender" });
  const status = useWatch({ control, name: "status" });
  const bloodGroup = useWatch({ control, name: "bloodGroup" });
  const age = useMemo(() => calculateAge(dob), [dob]);
  const ageCategory = useMemo(() => ageCategoryFor(age), [age]);
  const academyMartialArts = useMemo(() => normalizeOptions(academy?.martialArts), [academy?.martialArts]);
  const showBeltSelect = isTaekwondoSport(martialArt);

  useEffect(() => { if (beltRank !== "Black") setValue("danRank", ""); }, [beltRank, setValue]);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.allSettled([
      studentApi.getById(id),
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
      batchApi.getAll(),
    ]).then(([studentResult, academyResult, branchResult, batchResult]) => {
      if (studentResult.status !== "fulfilled") {
        toast.error(studentResult.reason?.response?.data?.message || "Student could not be loaded");
        navigate("/students");
        return;
      }
      const studentData = studentResult.value?.data?.data?.student
        || studentResult.value?.data?.data
        || studentResult.value?.data?.student
        || studentResult.value?.data
        || null;
      if (!studentData) {
        toast.error("Student could not be loaded");
        navigate("/students");
        return;
      }
      if (!mounted) return;
      setStudent(studentData);
      reset({
        branch: studentData?.branch?._id || studentData?.branch || "",
        batch: studentData?.batch?._id || studentData?.batch || "",
        gender: studentData?.gender || "male",
        status: studentData?.status || "active",
        martialArt: studentData?.martialArt || "",
        beltRank: studentData?.beltRank || "",
        danRank: studentData?.danRank || "",
        bloodGroup: studentData?.bloodGroup || studentData?.medicalInfo?.bloodGroup || "",
        admissionNumber: studentData?.admissionNumber || "",
        aadhaarNumber: studentData?.aadhaarNumber || "",
        name: [studentData?.firstName, studentData?.lastName].filter(Boolean).join(" "),
        dob: toDateInput(studentData?.dateOfBirth),
        joiningDate: toDateInput(studentData?.joiningDate),
        email: studentData?.email || "",
        address: studentData?.address || "",
        schoolName: studentData?.schoolName || studentData?.education?.schoolName || "",
        className: studentData?.className || studentData?.education?.className || "",
        collegeName: studentData?.collegeName || studentData?.education?.collegeName || "",
        occupation: studentData?.occupation || studentData?.education?.occupation || "",
        heightCm: studentData?.heightCm ?? studentData?.physicalInfo?.heightCm ?? "",
        weightKg: studentData?.weightKg ?? studentData?.physicalInfo?.weightKg ?? "",
        medicalNotes: studentData?.notes || studentData?.medicalInfo?.notes || "",
      });
      setStudentContact({
        countryCode: studentData?.countryCode || "+91",
        phone: studentData?.phone || "",
        country: studentData?.country || "India",
        state: studentData?.state || "",
        city: studentData?.city || "",
      });
      setParentContacts(normalizePersonContacts(studentData?.parentContacts, {
        name: studentData?.parentName,
        countryCode: studentData?.parentCountryCode,
        phone: studentData?.parentPhone,
      }));
      setEmergencyContacts(normalizePersonContacts(studentData?.emergencyContacts, {
        name: studentData?.emergencyContact?.name || studentData?.emergencyContactName,
        countryCode: studentData?.emergencyContact?.countryCode || studentData?.emergencyContactCountryCode,
        phone: studentData?.emergencyContact?.phone || studentData?.emergencyContactPhone,
      }));
      const medicalSelection = normalizeMedicalSelection(normalizeOptions(studentData?.medicalConditions || studentData?.medicalInfo?.medicalConditions));
      setMedicalConditions(medicalSelection.conditions);
      setOtherMedicalCondition(medicalSelection.otherCondition);
      setPhotoPreview(studentData?.profilePhoto ? getStudentPhotoUrl(studentData) : "");
      if (academyResult.status === "fulfilled") {
        const academyData = academyResult.value?.data?.data?.academy || academyResult.value?.data?.academy || null;
        setAcademy(academyData);
        const sports = normalizeOptions(academyData?.martialArts);
        if (sports.length && !studentData?.martialArt) setValue("martialArt", sports[0]);
      }
      if (branchResult.status === "fulfilled") {
        const activeBranches = unwrapList(branchResult.value, "branches").filter((branch) => branch?.isActive !== false);
        setBranches(activeBranches);
        if (activeBranches.length === 1 && !studentData?.branch) {
          setValue("branch", activeBranches[0]._id, { shouldValidate: true });
        }
      }
      if (batchResult.status === "fulfilled") {
        const activeBatches = unwrapList(batchResult.value, "batches").filter((batch) => batch?.isActive !== false);
        setBatches(activeBatches);
        if (activeBatches.length === 1 && !studentData?.batch) {
          setValue("batch", activeBatches[0]._id, { shouldValidate: true });
        }
      }
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id, navigate, reset, setValue]);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const contactUpdater = (setter) => (field, value) => setter((current) => ({ ...current, [field]: value }));
  const changePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed"); event.target.value = ""; return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB"); event.target.value = ""; return;
    }
    setPhoto(file); setPhotoPreview(URL.createObjectURL(file));
  };
  const errorFor = (name) => errors[name] ? <small>{errors[name].message}</small> : null;
  const mainBranch = branches.find((branch) => branch?.isMainBranch) || branches[0];
  const academyAddress = [
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ].filter(Boolean).join(", ");

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      const names = String(values.name || "").trim().split(/\s+/);
      const payload = {
        admissionNumber: values.admissionNumber, aadhaarNumber: values.aadhaarNumber || "",
        firstName: names[0] || "", lastName: names.slice(1).join(" "), gender: values.gender, dateOfBirth: values.dob,
        branch: values.branch || "", batch: values.batch || "", ...studentContact, email: values.email || "", address: values.address || "",
        parentContacts: parentContacts.map(({ id, customRelation, ...contact }) => ({ ...contact, relation: contact.relation === "Other" ? customRelation : contact.relation })),
        emergencyContacts: emergencyContacts.map(({ id, customRelation, ...contact }) => ({ ...contact, relation: contact.relation === "Other" ? customRelation : contact.relation })),
        schoolName: values.schoolName || "", className: values.className || "",
        collegeName: values.collegeName || "", occupation: values.occupation || "", martialArt: values.martialArt || "Taekwondo",
        beltRank: values.beltRank || "", danRank: values.danRank || "", heightCm: values.heightCm || "", weightKg: values.weightKg || "",
        bloodGroup: values.bloodGroup || "", medicalConditions: buildMedicalConditionsPayload(medicalConditions, otherMedicalCondition), joiningDate: values.joiningDate || "", status: values.status || "active",
        notes: values.medicalNotes || "",
      };
      const body = new FormData();
      Object.entries(payload).forEach(([key, value]) => appendValue(body, key, value));
      if (photo) body.append("profilePhoto", photo);
      await studentApi.update(id, body);
      toast.success("Student updated successfully");
      navigate(`/students/${id}`);
    } catch (error) {
      toast.error(getRequestErrorMessage(error));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page student-form-page"><div className="student-form-loading" role="status">Loading student profile...</div></div>;

  return <div className="page add-branch-page student-form-page">
    <AcademyHeroHeader
      headingId="add-student-academy-name"
      academyName={academy?.academyName || "KHILADI Academy"}
      ownerName={academy?.ownerName || user?.name || "Academy Owner"}
      logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
      addressLabel={mainBranch?.branchName || "Main Branch"}
      address={academyAddress || "Complete main branch address not available"}
      summaryItems={[
        { key: "branches", type: "branches", value: branches.length, label: `Active ${branches.length === 1 ? "Branch" : "Branches"}` },
        { key: "batches", type: "batches", value: batches.length, label: `Active ${batches.length === 1 ? "Batch" : "Batches"}` },
      ]}
    />
    <nav className="add-branch-breadcrumb" aria-label="Breadcrumb"><Link to="/students">Students</Link><span>/</span><strong>Edit Student</strong></nav>
    <div className="add-branch-heading">
      <div className="add-branch-heading__title">
        <span><UserRound size={25} /></span>
        <div>
          <h1>Edit Student</h1>
          <p>Update the complete student profile with the same professional workflow.</p>
        </div>
      </div>
      <Link className="btn btn-outline" to="/students"><ArrowLeft size={16} /> Back to Students</Link>
    </div>
    <form className="student-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <StudentFormSection eyebrow="IDENTITY" title="Basic Information" description="Student identity, admission and membership details." icon={IdCard} action={<div className="student-identity-actions">
        <div className="student-assignment-field">
          <span>Branch</span>
          {branches.length > 1 ? <select {...register("branch")}><option value="">Select Branch</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.branchName}</option>)}</select> : <strong>{branches[0]?.branchName || "No Active Branch"}</strong>}
        </div>
        <div className="student-assignment-field">
          <span>Batch</span>
          {batches.length > 1 ? <select {...register("batch")}><option value="">Select Batch</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName}</option>)}</select> : <strong>{batches[0]?.batchName || "No Active Batch"}</strong>}
        </div>
        <div className="student-status-field">
          <span>Status</span>
          <label className="add-branch-switch student-status-switch">
            <input type="checkbox" checked={status === "active"} onChange={(event) => setValue("status", event.target.checked ? "active" : "inactive")} />
            <span />
            <div><strong>{status === "active" ? "Active Student" : "Inactive Student"}</strong><small>{status === "active" ? "Keep this student available for academy operations." : "Student remains unavailable for academy operations."}</small></div>
          </label>
        </div>
      </div>}>
        <div className="student-form-identity"><div className="student-form-fields student-form-fields--three">
          <label><span>Full Name <b>*</b></span><input autoComplete="name" {...register("name", { required: "Name required" })} />{errorFor("name")}</label>
          <label><span>Admission Number</span><input placeholder="Existing number remains if left blank" {...register("admissionNumber")} />{errorFor("admissionNumber")}</label>
          <label><span>Aadhaar Number</span><input maxLength={12} inputMode="numeric" placeholder="12 digit Aadhaar number" {...register("aadhaarNumber", { pattern: { value: /^\d{12}$/, message: "Enter a valid 12 digit Aadhaar number" } })} />{errorFor("aadhaarNumber")}</label>
          <div className="student-chip-field student-gender-field"><OptionChipsField label="Gender" multiple={false} options={["Male", "Female"]} value={gender === "female" ? "Female" : "Male"} onChange={(value) => setValue("gender", value.toLowerCase())} /></div>
          <div className="student-demographics-row">
            <label><span>Joining Date</span><input type="date" {...register("joiningDate")} /></label>
            <label><span>Date of Birth</span><input type="date" max={new Date().toISOString().split("T")[0]} {...register("dob")} />{errorFor("dob")}</label>
            <label><span>Age</span><input value={age === "" ? "" : `${age} Years`} readOnly /></label>
            <label><span>Age Category</span><input value={ageCategory} readOnly /></label>

       <label><span>School Name</span><input {...register("schoolName")} /></label><label><span>Class</span><input {...register("className")} /></label><label><span>Company / Firm Name</span><input {...register("collegeName")} /></label><label><span>Occupation</span><input {...register("occupation")} /></label>
          </div>
        </div><ProfilePhotoField previewUrl={photoPreview} onChange={changePhoto} onRemove={() => { setPhoto(null); setPhotoPreview(student?.profilePhoto ? getStudentPhotoUrl(student) : ""); }} disabled={saving} /></div>
      </StudentFormSection>
      <StudentFormSection className="student-contact-card" eyebrow="CONTACT" title="Contact & Location" description="Primary contact and residential location." icon={MapPin}>
        <div className="student-form-body">
          <PhoneLocationFields
            {...studentContact}
            phoneLabel="Student Phone"
            maxPhones={4}
            onChange={contactUpdater(setStudentContact)}
            phoneTrailingContent={<label className="student-contact-email"><span>Email</span><input type="email" autoComplete="email" {...register("email")} /></label>}
          />
          <label className="student-form-wide"><span>Address</span><textarea rows="3" {...register("address")} /></label>
        </div>
      </StudentFormSection>
      <div className="student-form-grid student-people-contact-grid">
        <StudentFormSection eyebrow="GUARDIAN" title="Parent Contact" description="Parent or guardian contact details." icon={Phone}><PersonContactRepeater items={parentContacts} onChange={setParentContacts} addLabel="Add More Parent / Guardian" /></StudentFormSection>
        <StudentFormSection eyebrow="SAFETY" title="Emergency Contact" description="Contacts to use in an urgent situation." icon={ShieldAlert}><PersonContactRepeater items={emergencyContacts} onChange={setEmergencyContacts} addLabel="Add More Emergency Contact" /></StudentFormSection>
      </div>
      <div className="student-form-grid student-training-medical-grid">
        <StudentFormSection eyebrow="TRAINING" title="Training Information" description="Martial art, belt and rank assignment." icon={BookOpen}>
          <div className="batch-form-page student-training-components"><div
            className={`batch-form-card--profile student-training-grid${showBeltSelect && beltRank === "Black" ? " has-dan-rank" : ""}`}
            style={{
              "--student-training-columns":
                showBeltSelect && beltRank === "Black"
                  ? "max-content max-content 192px"
                  : "max-content max-content",
            }}
          >
            <SportsMartialArtsField className="batch-profile-sports" showHeader={false} allowCustom={false} options={academyMartialArts} selected={martialArt ? [martialArt] : []} customOptions={[]} onChange={(items) => setValue("martialArt", items.at(-1) || "")} />
            <div className="batch-limit-field--belt student-belt-field">
              <BeltTagsField
                label="Belt Rank"
                value={beltRank}
                includeNoLimit={false}
                onChange={(value) => setValue("beltRank", value === beltRank ? "" : value, { shouldDirty: true })}
              />
            </div>
            {showBeltSelect && beltRank === "Black" ? <label className="student-dan-rank"><span>Dan Rank</span><select {...register("danRank")}><option value="">Select Dan</option>{TAEKWONDO_DAN_RANKS.map((dan) => <option key={dan}>{dan}</option>)}</select></label> : null}
          </div></div>
        </StudentFormSection>
        <StudentFormSection eyebrow="HEALTH" title="Medical Information" description="Health details important for safe training." icon={HeartPulse}>
          <div className="student-medical-content">
            <div className="student-medical-measurements">
              <label><span>Height (cm)</span><input type="number" min="0" step="0.1" {...register("heightCm")} /></label>
              <label><span>Weight (kg)</span><input type="number" min="0" step="0.1" {...register("weightKg")} /></label>
            </div>

            <MedicalSelectors
              bloodGroup={bloodGroup}
              onBloodGroupChange={(value) => setValue("bloodGroup", value, { shouldDirty: true })}
              conditions={medicalConditions}
              onConditionsChange={setMedicalConditions}
              otherCondition={otherMedicalCondition}
              onOtherConditionChange={setOtherMedicalCondition}
            />

            <label className="student-medical-notes">
              <span>Medical Notes</span>
              <textarea rows="3" {...register("medicalNotes")} />
            </label>
          </div>
        </StudentFormSection>
      </div>
      <FormActionBar
        className="student-form-actions"
        title="Ready to update this student?"
        description="Required fields are marked with an asterisk."
        icon={UserRound}
        actions={<>
          <button type="button" className="btn btn-outline" disabled={saving} onClick={() => navigate(`/students/${id}`)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? "Updating Student..." : "Update Student"}</button>
        </>}
      />
    </form>
  </div>;
};

export default EditStudent;
