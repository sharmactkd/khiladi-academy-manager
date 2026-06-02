import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const BELTS = [
  "",
  "White",
  "Yellow",
  "Green",
  "Blue",
  "Red",
  "Black",
  "1st Dan",
  "2nd Dan",
  "3rd Dan",
  "4th Dan",
];

const AddBatch = () => {
  const navigate = useNavigate();

  const [additionalCoaches, setAdditionalCoaches] = useState([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      batchName: "",
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

      await batchApi.create({
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
        isCompetitionBatch: Boolean(values.isCompetitionBatch),

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

      toast.success("Batch create ho gaya");
      navigate("/batches");
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch create nahi hua");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Batch</h1>
          <p>Nayi class/batch create karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="card subtle-card">
          <h3>Basic Batch Information</h3>

          <div className="grid grid-2">
            <label>
              Batch Name *
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
              Martial Art / Sport *
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
                placeholder="Blue / Red / #2563eb"
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

        <div className="card subtle-card">
          <h3>Coach Assignment</h3>

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

          <div className="actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addAdditionalCoach}
            >
              + Add More Coach
            </button>
          </div>

          {additionalCoaches.map((coach, index) => (
            <div
              className="grid grid-3"
              key={index}
              style={{ marginTop: 12, alignItems: "end" }}
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

        <div className="card subtle-card">
          <h3>Training Schedule</h3>

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

          <div
            className="actions"
            style={{ marginBottom: "16px", marginTop: "16px", flexWrap: "wrap" }}
          >
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

        <div className="card subtle-card">
          <h3>Student Capacity & Eligibility</h3>

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

        <div className="card subtle-card">
          <h3>Batch Fees</h3>
          <p>
            Yahi fees is batch ke sabhi students ke liye default reflect hogi.
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

        <div className="card subtle-card">
          <h3>Links & Communication</h3>

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

        <label>
          Notes
          <textarea {...register("notes")} />
        </label>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/batches")}>
            Cancel
          </button>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Batch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBatch;