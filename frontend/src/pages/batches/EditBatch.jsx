import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { TAEKWONDO_BELTS } from "../../components/taekwondoBelts/taekwondoBelts.js";
import { batchApi } from "../../api/batchApi.js";
import { getBranches } from "../../api/branchApi.js";
import { ArrowLeft, CalendarDays, Plus, Save, UsersRound } from "lucide-react";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const BATCH_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "competition", label: "Competition Team" },
  { value: "poomsae", label: "Poomsae Team" },
  { value: "sparring", label: "Sparring Team" },
  { value: "fitness", label: "Fitness Batch" },
  { value: "kids", label: "Kids Batch" },
  { value: "adults", label: "Adults Batch" },
  { value: "black-belt", label: "Black Belt Batch" },
  { value: "custom", label: "Custom" },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "elite", label: "Elite" },
  { value: "mixed", label: "Mixed" },
];

const MODES = [
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const SESSION_SLOTS = [
  { value: "", label: "Select Slot" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

const BELTS = ["", ...TAEKWONDO_BELTS];

const normalizeAdditionalCoaches = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((coach) => ({
      name: coach?.name || "",
      phone: coach?.phone || "",
    }))
    .filter((coach) => coach.name || coach.phone);
};

const EditBatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batchData, setBatchData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [additionalCoaches, setAdditionalCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      batchName: "",
      branch: "",
      batchCode: "",
      martialArt: "Taekwondo",
      genderGroup: "both",
      batchType: "regular",
      skillLevel: "beginner",
      mode: "offline",
      sessionSlot: "",
      venue: "",
      batchColor: "",
      headCoachName: "",
      assistantCoachName: "",
      startTime: "",
      endTime: "",
      maxStudents: 0,
      minAge: "",
      maxAge: "",
      minBelt: "",
      maxBelt: "",
      status: "active",
      days: [],
      monthlyFee: 0,
      quarterlyFee: 0,
      annualFee: 0,
      registrationFee: 0,
      uniformFee: 0,
      examinationFee: 0,
      lateFee: 0,
      minimumAttendancePercentage: 75,
      batchLanguage: "",
      whatsappGroupLink: "",
      googleMeetLink: "",
      isCompetitionBatch: false,
      notes: "",
    },
  });

  useEffect(() => {
    getBranches({ status: "active" })
      .then((response) => {
        const candidates = [response?.data?.data, response?.data, response];
        setBranches(candidates.find(Array.isArray) || []);
      })
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        setLoading(true);

        const response = await batchApi.getById(id);
        const batch = response.data?.data || response.data?.batch || response.data;

        if (!batch) {
          toast.error("Batch not found");
          navigate("/batches");
          return;
        }

        setBatchData(batch);

        reset({
          branch: batch.branch?._id || batch.branch || "",
          batchName: batch.batchName || "",
          batchCode: batch.batchCode || "",
          martialArt: batch.martialArt || "Taekwondo",
genderGroup: batch.genderGroup || "both",

          batchType: batch.batchType || "regular",
          skillLevel: batch.skillLevel || "beginner",
          mode: batch.mode || "offline",
          sessionSlot: batch.sessionSlot || "",
          venue: batch.venue || "",
          batchColor: batch.batchColor || "",

          headCoachName: batch.headCoachName || "",
          assistantCoachName: batch.assistantCoachName || "",

          startTime: batch.schedule?.[0]?.startTime || "",
          endTime: batch.schedule?.[0]?.endTime || "",

          maxStudents: batch.capacity || 0,

          minAge: batch.minAge ?? "",
          maxAge: batch.maxAge ?? "",
          minBelt: batch.minBelt || "",
          maxBelt: batch.maxBelt || "",

          status: batch.isActive ? "active" : "inactive",
          days: Array.isArray(batch.schedule)
            ? batch.schedule.map((item) => item.day)
            : [],

          monthlyFee: batch.monthlyFee || 0,
          quarterlyFee: batch.quarterlyFee || 0,
          annualFee: batch.annualFee || 0,
          registrationFee: batch.registrationFee || 0,
          uniformFee: batch.uniformFee || 0,
          examinationFee: batch.examinationFee || 0,
          lateFee: batch.lateFee || 0,

          minimumAttendancePercentage:
            batch.minimumAttendancePercentage ?? 75,

          batchLanguage: batch.batchLanguage || "",
          whatsappGroupLink: batch.whatsappGroupLink || "",
          googleMeetLink: batch.googleMeetLink || "",

          isCompetitionBatch: Boolean(batch.isCompetitionBatch),
          notes: batch.notes || "",
        });

        setAdditionalCoaches(normalizeAdditionalCoaches(batch.additionalCoaches));
      } catch (error) {
        toast.error(error.response?.data?.message || "Batch load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [id, navigate, reset]);

  const addAdditionalCoach = () => {
    setAdditionalCoaches((prev) => [...prev, { name: "", phone: "" }]);
  };

  const updateAdditionalCoach = (index, field, value) => {
    setAdditionalCoaches((prev) =>
      prev.map((coach, coachIndex) =>
        coachIndex === index ? { ...coach, [field]: value } : coach
      )
    );
  };

  const removeAdditionalCoach = (index) => {
    setAdditionalCoaches((prev) =>
      prev.filter((_, coachIndex) => coachIndex !== index)
    );
  };

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      await batchApi.update(id, {
        branch: values.branch || null,
        batchName: values.batchName,
        batchCode: values.batchCode || "",
        martialArt: values.martialArt || "Taekwondo",
genderGroup: values.genderGroup || "both",

        batchType: values.batchType || "regular",
        skillLevel: values.skillLevel || "beginner",
        mode: values.mode || "offline",
        sessionSlot: values.sessionSlot || "",
        venue: values.venue || "",
        batchColor: values.batchColor || "",

        headCoachName: values.headCoachName || "",
        assistantCoachName: values.assistantCoachName || "",
        additionalCoaches,

        capacity: Number(values.maxStudents || 0),

        minAge: values.minAge === "" ? null : Number(values.minAge),
        maxAge: values.maxAge === "" ? null : Number(values.maxAge),
        minBelt: values.minBelt || "",
        maxBelt: values.maxBelt || "",

        isActive: values.status === "active",
        isCompetitionBatch:
          values.isCompetitionBatch === true ||
          values.isCompetitionBatch === "true",

        notes: values.notes || "",

        monthlyFee: Number(values.monthlyFee || 0),
        quarterlyFee: Number(values.quarterlyFee || 0),
        annualFee: Number(values.annualFee || 0),
        registrationFee: Number(values.registrationFee || 0),
        uniformFee: Number(values.uniformFee || 0),
        examinationFee: Number(values.examinationFee || 0),
        lateFee: Number(values.lateFee || 0),

        minimumAttendancePercentage: Number(
          values.minimumAttendancePercentage || 75
        ),

        batchLanguage: values.batchLanguage || "",
        whatsappGroupLink: values.whatsappGroupLink || "",
        googleMeetLink: values.googleMeetLink || "",

        schedule: (values.days || []).map((day) => ({
          day,
          startTime: values.startTime,
          endTime: values.endTime,
        })),
      });

      toast.success("Batch update ho gaya");
      navigate(`/batches/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch update nahi hua");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading batch...</p>;

  return (
    <div className="page batch-form-page edit-batch-page">
      <BatchAcademyHeader />
      <nav className="batch-breadcrumb"><Link to="/batches">Batches</Link><span>/</span><Link to={"/batches/" + id}>{batchData?.batchName || "Batch"}</Link><span>/</span><strong>Edit</strong></nav>
      <div className="batch-form-heading">
        <div>
          <span>Training setup</span>
          <h1>Edit Batch</h1>
          <p>Update this batch's schedule, coaches, eligibility and fees.</p>
        </div>
        <Link className="btn btn-outline" to={"/batches/" + id}><ArrowLeft size={16} /> Back to Details</Link>
      </div>

      <form className="batch-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="batch-form-card">
          <h3><span>01</span> Basic Batch Information</h3>

          <div className="grid grid-2">
            <label>
              Batch Name
              <input
                {...register("batchName", {
                  required: "Batch name required",
                })}
              />
              {errors.batchName && <small>{errors.batchName.message}</small>}
            </label>

            <label>
              Batch Code
              <input {...register("batchCode")} placeholder="EV-TKD-MOR-01" />
            </label>

            <label>
              Branch
              <select {...register("branch")}>
                <option value="">Academy level / Not assigned</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName}{branch.branchCode ? " (" + branch.branchCode + ")" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Martial Art
              <input
                {...register("martialArt", {
                  required: "Martial art required",
                })}
              />
              {errors.martialArt && (
                <small>{errors.martialArt.message}</small>
              )}
            </label>

<label>
  Gender Group
  <select {...register("genderGroup")}>
    <option value="both">Male & Female</option>
    <option value="male">Male Only</option>
    <option value="female">Female Only</option>
  </select>
</label>

            <label>
              Batch Type
              <select {...register("batchType")}>
                {BATCH_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Skill Level
              <select {...register("skillLevel")}>
                {SKILL_LEVELS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Mode
              <select {...register("mode")}>
                {MODES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Session Slot
              <select {...register("sessionSlot")}>
                {SESSION_SLOTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Venue / Hall
              <input {...register("venue")} placeholder="Hall A / Dojang 1" />
            </label>

            <label>
              Batch Color Tag
              <input
                {...register("batchColor")}
                placeholder="Red / Black / #cf0006"
              />
            </label>

            <label>
              Status
              <select {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>

        <div className="batch-form-card">
          <h3><span>02</span> Coach Assignment <UsersRound size={17} /></h3>

          <div className="grid grid-2">
            <label>
              Head Coach
              <input {...register("headCoachName")} />
            </label>

            <label>
              Assistant Coach
              <input {...register("assistantCoachName")} />
            </label>
          </div>

          <div className="batch-form-add-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addAdditionalCoach}
            >
              <Plus size={15} /> Add More Coach
            </button>
          </div>

          {additionalCoaches.map((coach, index) => (
            <div
              className="grid grid-3 batch-form-coach-row"
              key={index}
            >
              <label>
                Coach Name
                <input
                  value={coach.name}
                  onChange={(event) =>
                    updateAdditionalCoach(index, "name", event.target.value)
                  }
                />
              </label>

              <label>
                Coach Phone
                <input
                  value={coach.phone}
                  onChange={(event) =>
                    updateAdditionalCoach(index, "phone", event.target.value)
                  }
                />
              </label>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => removeAdditionalCoach(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="batch-form-card">
          <h3><span>03</span> Training Schedule</h3>

          <div className="grid grid-2">
            <label>
              Start Time
              <input type="time" {...register("startTime")} />
            </label>

            <label>
              End Time
              <input type="time" {...register("endTime")} />
            </label>
          </div>

          <div className="batch-schedule-presets">
            <button type="button" onClick={() => setValue("days", DAYS)}>
              All Days
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("days", [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ])
              }
            >
              Week Days (Only Sunday off)
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("days", [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                ])
              }
            >
              Week Days (Saturday - Sunday off)
            </button>

            <button
              type="button"
              onClick={() => setValue("days", ["monday", "wednesday", "friday"])}
            >
              M W F
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("days", ["tuesday", "thursday", "saturday"])
              }
            >
              T T S
            </button>

            <button type="button" onClick={() => setValue("days", [])}>
              Clear
            </button>
          </div>

          <div className="checkbox-grid">
            {DAYS.map((day) => (
              <label key={day}>
                <input type="checkbox" value={day} {...register("days")} />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="batch-form-card">
          <h3><span>04</span> Student Capacity & Eligibility</h3>

          <div className="grid grid-2">
            <label>
              Max Students
              <input type="number" min="0" {...register("maxStudents")} />
            </label>

            <label>
              Minimum Attendance %
              <input
                type="number"
                min="0"
                max="100"
                {...register("minimumAttendancePercentage")}
              />
            </label>

            <label>
              Min Age
              <input type="number" min="0" {...register("minAge")} />
            </label>

            <label>
              Max Age
              <input type="number" min="0" {...register("maxAge")} />
            </label>

            <label>
              Minimum Belt
              <select {...register("minBelt")}>
                {BELTS.map((belt) => (
                  <option key={belt || "none"} value={belt}>
                    {belt || "Select Belt"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Maximum Belt
              <select {...register("maxBelt")}>
                {BELTS.map((belt) => (
                  <option key={belt || "none"} value={belt}>
                    {belt || "Select Belt"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="batch-form-card">
          <h3><span>05</span> Batch Fees</h3>
          <p>
            Ye fees is batch ke sabhi students ke liye default use hogi.
            Student-specific fee override ho to wo priority lega.
          </p>

          <div className="grid grid-3">
            <label>
              Monthly Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("monthlyFee")}
              />
            </label>

            <label>
              Quarterly Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("quarterlyFee")}
              />
            </label>

            <label>
              Annual Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("annualFee")}
              />
            </label>

            <label>
              Registration Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("registrationFee")}
              />
            </label>

            <label>
              Uniform Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("uniformFee")}
              />
            </label>

            <label>
              Examination Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("examinationFee")}
              />
            </label>

            <label>
              Late Fee
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("lateFee")}
              />
            </label>
          </div>
        </div>

        <div className="batch-form-card">
          <h3><span>06</span> Links & Communication</h3>

          <div className="grid grid-2">
            <label>
              Batch Language
              <input {...register("batchLanguage")} placeholder="Hindi + English" />
            </label>

            <label>
              WhatsApp Group Link
              <input
                {...register("whatsappGroupLink")}
                placeholder="https://chat.whatsapp.com/..."
              />
            </label>

            <label>
              Google Meet Link
              <input
                {...register("googleMeetLink")}
                placeholder="https://meet.google.com/..."
              />
            </label>

            <label>
              Competition Batch
              <select {...register("isCompetitionBatch")}>
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
            </label>
          </div>
        </div>

        <label className="batch-form-notes">
          Notes
          <textarea {...register("notes")} />
        </label>

        <div className="batch-form-actions">
          <div><CalendarDays size={17} /><span><strong>Ready to update this batch?</strong><small>Review all changes before saving.</small></span></div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(`/batches/${id}`)}
            disabled={saving}
          >
            Cancel
          </button>

          <button className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Updating..." : "Update Batch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBatch;