import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { getBranches } from "../../api/branchApi.js";
import { academyApi } from "../../api/academyApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import PremiumTimePicker from "../../components/common/PremiumTimePicker.jsx";
import {
  BeltTagsField as OperationsBeltTagsField,
  CoachesInChargeSection,
  LanguagesSpokenField,
  SportsMartialArtsField,
} from "../../components/common/AcademyOperationsFields.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import "./BatchForm.module.css";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DEFAULT_SPORTS = [
  "Taekwondo",
  "Karate",
  "Judo",
  "Boxing",
  "Kickboxing",
  "Wrestling",
  "MMA",
  "Kung Fu",
  "Wushu",
  "Muay Thai",
  "Brazilian Jiu-Jitsu",
  "Self Defence",
  "Fitness",
  "Yoga",
];
const BATCH_TYPES = [
  "Regular",
  "Competition Team",
  "Poomsae Team",
  "Sparring Team",
  "Fitness Batch",
  "Kids Batch",
  "Adults Batch",
  "Black Belt Batch",
];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite", "Mixed"];
const MODES = ["Offline", "Online", "Hybrid"];
const SESSION_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];
const GENDERS = [
  { value: "both", label: "Male & Female" },
  { value: "male", label: "Male Only" },
  { value: "female", label: "Female Only" },
];
const LANGUAGES = [
  "Hindi",
  "English",
  "Punjabi",
  "Urdu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
];

const normalizeList = (value) => {
  if (Array.isArray(value)) return [...new Set(value.flatMap(normalizeList))];
  if (typeof value !== "string") return [];
  const text = value.trim();
  if (!text) return [];
  try {
    return normalizeList(JSON.parse(text));
  } catch {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};
const slug = (value) => String(value).trim().toLowerCase().replace(/\s+/g, "-");

const TagField = ({
  label,
  options,
  selected,
  onToggle,
  required = false,
  trailingContent = null,
}) => (
  <div className="batch-tag-field batch-tag-field--wide">
    <span className="batch-field-label">
      {label}
      {required ? <b> *</b> : null}
    </span>
    <div className="batch-single-select-tags batch-multi-select-tags">
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const text = typeof option === "string" ? option : option.label;
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            className={active ? "is-selected" : ""}
            aria-pressed={active}
            onClick={() => onToggle(value)}
          >
            {text}
          </button>
        );
      })}
      {trailingContent}
    </div>
  </div>
);

const SingleTagField = ({ label, options, selected, onSelect }) => (
  <div className="batch-tag-field batch-tag-field--wide">
    <span className="batch-field-label">{label}</span>
    <div className="batch-single-select-tags">
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const text = typeof option === "string" ? option : option.label;
        return (
          <button
            key={value}
            type="button"
            className={selected === value ? "is-selected" : ""}
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
          >
            {text}
          </button>
        );
      })}
    </div>
  </div>
);

const FeeField = ({
  label,
  name,
  register,
  disabled = false,
  noFee = false,
  noFeeLabel = "",
  onNoFeeChange,
}) => (
  <div className="batch-fee-field">
    <span className="batch-fee-field__label">{label}</span>
    <div className={`batch-money-control${disabled ? " is-disabled" : ""}`}>
      <span className="batch-money-control__prefix" aria-hidden="true">
        ₹
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        disabled={disabled}
        aria-label={label}
        {...register(name)}
      />
      {noFeeLabel ? (
        <label className="batch-money-control__option">
          <input
            type="checkbox"
            checked={noFee}
            onChange={(event) => onNoFeeChange?.(event.target.checked)}
          />
          <span aria-hidden="true" />
          <strong>{noFeeLabel}</strong>
        </label>
      ) : null}
    </div>
  </div>
);

const LimitField = ({ label, field, flag, register, values, setValue }) => (
  <div className="batch-limit-field">
    <span className="batch-limit-field__label">{label}</span>
    <div className="batch-limit-control">
      <input
        type="number"
        min="0"
        disabled={Boolean(values[flag])}
        aria-label={label}
        {...register(field)}
      />
      <label className="batch-limit-control__option">
        <input
          type="checkbox"
          checked={Boolean(values[flag])}
          onChange={(event) =>
            setValue(flag, event.target.checked, { shouldDirty: true })
          }
        />
        <strong>No Limit</strong>
        <span aria-hidden="true" />
      </label>
    </div>
  </div>
);

const CoachCard = ({ title, prefix, register, values, setValue }) => (
  <div className="add-branch-coach-card">
    <h4>{title}</h4>
    <div className="grid grid-2">
      <label>
        Name
        <input {...register(`${prefix}Name`)} placeholder={`${title} name`} />
      </label>
      <div className="batch-coach-phone-field">
        <PhoneLocationFields
          countryCode={values[`${prefix}CountryCode`] || "+91"}
          phone={values[`${prefix}Phone`] || ""}
          maxPhones={1}
          phoneLabel="Mobile Number"
          showLocation={false}
          onChange={(field, value) => {
            if (field === "countryCode")
              setValue(`${prefix}CountryCode`, value, { shouldDirty: true });
            if (field === "phone")
              setValue(`${prefix}Phone`, value, { shouldDirty: true });
          }}
        />
      </div>
      <label className="full-width">
        Achievements / Experience
        <textarea
          rows="3"
          {...register(`${prefix}Achievements`)}
          placeholder="Major achievements, certifications and experience"
        />
      </label>
    </div>
  </div>
);

const AddBatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batchCount, setBatchCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [additionalCoaches, setAdditionalCoaches] = useState([]);
  const [customBatchType, setCustomBatchType] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      batchName: "",
      batchCode: "",
      branch: "",
      martialArts: [],
      genderGroup: "both",
      batchTypes: ["Regular"],
      customBatchTypes: [],
      skillLevels: ["Beginner"],
      modes: ["Offline"],
      sessionSlots: ["Evening"],
      venue: "",
      isActive: true,
      headCoachName: "",
      headCoachCountryCode: "+91",
      headCoachPhone: "",
      headCoachAchievements: "",
      assistantCoachName: "",
      assistantCoachCountryCode: "+91",
      assistantCoachPhone: "",
      assistantCoachAchievements: "",
      startTime: "",
      endTime: "",
      days: [],
      maxStudents: "",
      minAge: "",
      maxAge: "",
      minBelt: "",
      maxBelt: "",
      noCapacityLimit: false,
      noMinAgeLimit: false,
      noMaxAgeLimit: false,
      noMinBeltLimit: false,
      noMaxBeltLimit: false,
      monthlyFee: 0,
      quarterlyFee: 0,
      annualFee: 0,
      registrationFee: 0,
      uniformFee: 0,
      examinationFee: 0,
      lateFee: 0,
      noRegistrationFee: false,
      noLateFee: false,
      batchLanguages: [],
      customBatchLanguages: [],
      whatsappGroupLink: "",
      googleMeetLink: "",
      notes: "",
    },
  });

  const values = watch();
  const sports = useMemo(() => {
    const academySports = normalizeList(academy?.martialArts);
    return [...new Set([...DEFAULT_SPORTS, ...academySports])];
  }, [academy?.martialArts]);
  const allBatchTypes = [...BATCH_TYPES, ...(values.customBatchTypes || [])];
  const allLanguages = [...LANGUAGES, ...(values.customBatchLanguages || [])];

  const toggleMulti = (field, value) => {
    const current = watch(field) || [];
    setValue(
      field,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
      { shouldDirty: true, shouldValidate: true },
    );
  };
  const addCustom = (input, catalogField, selectedField, setter) => {
    const clean = input.trim().replace(/\s+/g, " ");
    if (!clean) return;
    const catalog = watch(catalogField) || [];
    const existing =
      [
        ...catalog,
        ...(selectedField === "batchTypes" ? BATCH_TYPES : LANGUAGES),
      ].find((item) => item.toLowerCase() === clean.toLowerCase()) || clean;
    if (
      !catalog.some((item) => item.toLowerCase() === existing.toLowerCase()) &&
      !(selectedField === "batchTypes" ? BATCH_TYPES : LANGUAGES).includes(
        existing,
      )
    )
      setValue(catalogField, [...catalog, existing], { shouldDirty: true });
    if (!(watch(selectedField) || []).includes(existing))
      toggleMulti(selectedField, existing);
    setter("");
  };

  useEffect(() => {
    Promise.allSettled([
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
      batchApi.getAll(),
    ]).then(([academyResult, branchResult, batchResult]) => {
      if (academyResult.status === "fulfilled")
        setAcademy(
          academyResult.value?.data?.data?.academy ||
            academyResult.value?.data?.academy ||
            null,
        );
      if (branchResult.status === "fulfilled") {
        const list =
          [
            branchResult.value?.data?.data,
            branchResult.value?.data,
            branchResult.value,
          ].find(Array.isArray) || [];
        setBranches(list);
        if (list.length === 1)
          setValue("branch", list[0]._id, { shouldValidate: true });
      }
      if (batchResult.status === "fulfilled")
        setBatchCount(
          (
            [
              batchResult.value?.data?.data,
              batchResult.value?.data,
              batchResult.value,
            ].find(Array.isArray) || []
          ).filter((item) => item?.isActive !== false).length,
        );
    });
  }, [setValue]);

  const addCoach = () =>
    setAdditionalCoaches((items) => [
      ...items,
      { name: "", countryCode: "+91", phone: "", achievements: "" },
    ]);
  const updateCoach = (index, field, value) =>
    setAdditionalCoaches((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );

  const onSubmit = async (data) => {
    if (!data.martialArts?.length)
      return toast.error("At least one Martial Art / Sport select karein");
    try {
      setSaving(true);
      const payload = {
        ...data,
        martialArt: data.martialArts[0],
        martialArts: data.martialArts,
        batchType: slug(data.batchTypes[0] || "regular"),
        batchTypes: data.batchTypes.map(slug),
        customBatchTypes: data.customBatchTypes.map(slug),
        skillLevel: slug(data.skillLevels[0] || "beginner"),
        skillLevels: data.skillLevels.map(slug),
        mode: slug(data.modes[0] || "offline"),
        modes: data.modes.map(slug),
        sessionSlot: slug(data.sessionSlots[0] || "evening"),
        sessionSlots: data.sessionSlots.map(slug),
        capacity: data.noCapacityLimit ? 0 : Number(data.maxStudents || 0),
        minAge:
          data.noMinAgeLimit || data.minAge === "" ? null : Number(data.minAge),
        maxAge:
          data.noMaxAgeLimit || data.maxAge === "" ? null : Number(data.maxAge),
        minBelt: data.noMinBeltLimit ? "" : data.minBelt,
        maxBelt: data.noMaxBeltLimit ? "" : data.maxBelt,
        registrationFee: data.noRegistrationFee
          ? 0
          : Number(data.registrationFee || 0),
        lateFee: data.noLateFee ? 0 : Number(data.lateFee || 0),
        monthlyFee: Number(data.monthlyFee || 0),
        quarterlyFee: Number(data.quarterlyFee || 0),
        annualFee: Number(data.annualFee || 0),
        uniformFee: Number(data.uniformFee || 0),
        examinationFee: Number(data.examinationFee || 0),
        batchLanguage: data.batchLanguages[0] || "",
        additionalCoaches,
        isActive: Boolean(data.isActive),
        schedule: (data.days || []).map((day) => ({
          day,
          startTime: data.startTime,
          endTime: data.endTime,
        })),
      };
      await batchApi.create(payload);
      toast.success("Batch create ho gaya");
      navigate("/batches");
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch create nahi hua");
    } finally {
      setSaving(false);
    }
  };

  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  return (
    <div className="page add-branch-page batch-form-page">
      <AcademyHeroHeader
        headingId="add-batch-academy-name"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={
          [
            mainBranch?.address || academy?.address,
            mainBranch?.city || academy?.city,
            mainBranch?.state || academy?.state,
            mainBranch?.country || academy?.country,
          ]
            .filter(Boolean)
            .join(", ") || "Complete main branch address not available"
        }
        summaryItems={[
          {
            key: "branches",
            type: "branches",
            value: branches.length,
            label: "Active Branches",
          },
          {
            key: "batches",
            type: "batches",
            value: batchCount,
            label: "Active Batches",
          },
        ]}
      />
      <nav className="add-branch-breadcrumb">
        <Link to="/batches">Batches</Link>
        <span>/</span>
        <strong>Add New Batch</strong>
      </nav>
      <div className="add-branch-heading">
        <div className="add-branch-heading__title">
          <span>
            <Dumbbell size={25} />
          </span>
          <div>
            <h1>Add New Batch</h1>
            <p>Create a complete, professional training batch profile.</p>
          </div>
        </div>
        <Link className="btn btn-outline" to="/batches">
          <ArrowLeft size={16} /> Back to Batches
        </Link>
      </div>

      <form className="batch-form" onSubmit={handleSubmit(onSubmit)}>
        <section className="batch-form-card batch-form-card--identity">
          <h3>
            <span>01</span>
            <small>Identity</small> Batch Identity
          </h3>
          <div className="batch-identity-fields">
            <label>
              Batch Name *
              <input
                {...register("batchName", { required: "Batch name required" })}
              />
              {errors.batchName && <small>{errors.batchName.message}</small>}
            </label>
            <label>
              Batch Code
              <input {...register("batchCode")} placeholder="EV-TKD-01" />
            </label>
            <label className="batch-identity-branch">
              Branch *
              <select {...register("branch", { required: "Branch required" })}>
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName}
                    {branch.branchCode ? ` (${branch.branchCode})` : ""}
                  </option>
                ))}
              </select>
              {errors.branch && <small>{errors.branch.message}</small>}
            </label>
            <label className="add-branch-switch batch-active-switch">
              <input
                type="checkbox"
                checked={Boolean(values.isActive)}
                onChange={(event) =>
                  setValue("isActive", event.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              <span />
              <div>
                <strong>Active Batch</strong>
                <small>Allow operational use immediately after creation.</small>
              </div>
            </label>
            <label className="batch-venue-field">
              Venue / Hall
              <input {...register("venue")} placeholder="Hall A / Dojang 1" />
            </label>
            <label className="batch-identity-notes">
              Notes
              <textarea
                rows="4"
                {...register("notes")}
                placeholder="Add batch instructions, reminders or internal notes..."
              />
            </label>
          </div>
        </section>

        <section className="batch-form-card batch-form-card--profile">
          <h3>
            <span>02</span>
            <small>Training</small> Batch Training Profile
          </h3>
          <div className="batch-tag-section-grid">
            <div className="batch-profile-gender">
              <TagField
                label="Gender Group"
                options={GENDERS}
                selected={[values.genderGroup]}
                onToggle={(item) => setValue("genderGroup", item)}
              />
            </div>

            <div className="batch-profile-limits">
              <div className="batch-profile-limits__heading">
    Age & Capacity
  </div>
              <LimitField
                label="Min Age"
                field="minAge"
                flag="noMinAgeLimit"
                register={register}
                values={values}
                setValue={setValue}
              />
              <LimitField
                label="Max Age"
                field="maxAge"
                flag="noMaxAgeLimit"
                register={register}
                values={values}
                setValue={setValue}
              />
              <LimitField
                label="Max Students"
                field="maxStudents"
                flag="noCapacityLimit"
                register={register}
                values={values}
                setValue={setValue}
              />
            </div>

            <div className="batch-profile-skills">
              <TagField
                label="Skill Levels"
                options={SKILL_LEVELS}
                selected={values.skillLevels || []}
                onToggle={(item) => toggleMulti("skillLevels", item)}
              />
            </div>

            <div className="batch-profile-types">
              <TagField
                label="Batch Type"
                options={allBatchTypes}
                selected={values.batchTypes || []}
                onToggle={(item) => toggleMulti("batchTypes", item)}
                trailingContent={
                  <div className="operations-custom-tag batch-custom-tag batch-custom-tag--inline">
                    <Plus size={15} aria-hidden="true" />
                    <input
                      value={customBatchType}
                      onChange={(event) =>
                        setCustomBatchType(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustom(
                            customBatchType,
                            "customBatchTypes",
                            "batchTypes",
                            setCustomBatchType,
                          );
                        }
                      }}
                      placeholder="Custom batch type"
                    />
                    {customBatchType.trim() && (
                      <button
                        type="button"
                        onClick={() =>
                          addCustom(
                            customBatchType,
                            "customBatchTypes",
                            "batchTypes",
                            setCustomBatchType,
                          )
                        }
                      >
                        <Plus size={14} /> Add Type
                      </button>
                    )}
                  </div>
                }
              />
            </div>

            <SportsMartialArtsField
              className="batch-profile-sports"
              showHeader={false}
              required
              options={sports}
              selected={values.martialArts || []}
              customOptions={[]}
              onChange={(items) =>
                setValue("martialArts", items, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        </section>

        <section className="batch-form-card batch-form-card--schedule">
          <h3>
            <span>04</span>
            <small>Timing</small> Training Schedule
          </h3>
          <span className="batch-field-label">Training Days</span>
          <div className="batch-schedule-presets">
            <button type="button" onClick={() => setValue("days", DAYS)}>
              All Days
            </button>
            <button
              type="button"
              onClick={() => setValue("days", DAYS.slice(0, 6))}
            >
              Sunday Off
            </button>
            <button
              type="button"
              onClick={() =>
                setValue("days", ["monday", "wednesday", "friday"])
              }
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
          <div className="grid grid-2 batch-schedule-times">
            <PremiumTimePicker
              name="startTime"
              label="Start Time"
              value={values.startTime}
              onChange={(time) =>
                setValue("startTime", time, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder="Select start time"
              minuteStep={5}
            />

            <PremiumTimePicker
              name="endTime"
              label="End Time"
              value={values.endTime}
              onChange={(time) =>
                setValue("endTime", time, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder="Select end time"
              minuteStep={5}
            />
          </div>
          <div className="batch-schedule-options">
            <SingleTagField
              label="Session Slot"
              options={SESSION_SLOTS}
              selected={(values.sessionSlots || [])[0]}
              onSelect={(item) =>
                setValue("sessionSlots", [item], { shouldDirty: true })
              }
            />
            <SingleTagField
              label="Mode"
              options={MODES}
              selected={(values.modes || [])[0]}
              onSelect={(item) =>
                setValue("modes", [item], { shouldDirty: true })
              }
            />
          </div>
        </section>

        <section className="batch-form-card batch-form-card--eligibility">
          <h3>
            <span>05</span>
            <small>Students</small> Capacity &amp; Eligibility
          </h3>
          <p className="batch-card-intro">
            Select the minimum and maximum belt eligibility for this batch.
          </p>
          <div className="batch-eligibility-content batch-belt-eligibility-content">
            <div className="batch-limit-field batch-limit-field--belt">
              <OperationsBeltTagsField
                label="Minimum Belt"
                description="Select the minimum belt rank required to join this batch."
                value={values.minBelt}
                noLimit={values.noMinBeltLimit}
                onChange={(item) => setValue("minBelt", item)}
                onNoLimitChange={(value) => setValue("noMinBeltLimit", value)}
              />
            </div>
            <div className="batch-limit-field batch-limit-field--belt">
              <OperationsBeltTagsField
                label="Maximum Belt"
                description="Select the maximum belt rank allowed in this batch."
                value={values.maxBelt}
                noLimit={values.noMaxBeltLimit}
                onChange={(item) => setValue("maxBelt", item)}
                onNoLimitChange={(value) => setValue("noMaxBeltLimit", value)}
              />
            </div>
          </div>
        </section>

        <section className="batch-form-card batch-form-card--fees">
          <h3>
            <span>06</span>
            <small>Finance</small> Batch Fee Structure
          </h3>
          <p className="batch-card-intro">
            Configure the fee structure for this batch.
          </p>
          <div className="batch-fees-content">
            <FeeField
              label="Monthly Fee"
              name="monthlyFee"
              register={register}
            />
            <FeeField
              label="Quarterly Fee"
              name="quarterlyFee"
              register={register}
            />
            <FeeField label="Annual Fee" name="annualFee" register={register} />
            <FeeField
              label="Registration Fee"
              name="registrationFee"
              register={register}
              disabled={values.noRegistrationFee}
              noFee={values.noRegistrationFee}
              noFeeLabel="No Registration Fee"
              onNoFeeChange={(checked) =>
                setValue("noRegistrationFee", checked, { shouldDirty: true })
              }
            />
            <FeeField
              label="Examination Fee"
              name="examinationFee"
              register={register}
            />
            <FeeField
              label="Late Fee"
              name="lateFee"
              register={register}
              disabled={values.noLateFee}
              noFee={values.noLateFee}
              noFeeLabel="No Late Fee"
              onNoFeeChange={(checked) =>
                setValue("noLateFee", checked, { shouldDirty: true })
              }
            />
          </div>
        </section>

        <CoachesInChargeSection
          className="batch-form-card--coaches"
          title="Coaches & Batch In-charge"
          headCoachTitle="Head Coach / Batch In-charge"
          headCoach={{
            name: values.headCoachName,
            countryCode: values.headCoachCountryCode,
            phone: values.headCoachPhone,
            achievements: values.headCoachAchievements,
          }}
          assistantCoach={{
            name: values.assistantCoachName,
            countryCode: values.assistantCoachCountryCode,
            phone: values.assistantCoachPhone,
            achievements: values.assistantCoachAchievements,
          }}
          additionalCoaches={additionalCoaches}
          onHeadCoachChange={(coach) => {
            setValue("headCoachName", coach.name);
            setValue("headCoachCountryCode", coach.countryCode);
            setValue("headCoachPhone", coach.phone);
            setValue("headCoachAchievements", coach.achievements);
          }}
          onAssistantCoachChange={(coach) => {
            setValue("assistantCoachName", coach.name);
            setValue("assistantCoachCountryCode", coach.countryCode);
            setValue("assistantCoachPhone", coach.phone);
            setValue("assistantCoachAchievements", coach.achievements);
          }}
          onAdditionalCoachesChange={setAdditionalCoaches}
        />

        <LanguagesSpokenField
          className="batch-form-card--languages"
          selected={values.batchLanguages || []}
          customOptions={values.customBatchLanguages || []}
          onChange={(items) =>
            setValue("batchLanguages", items, { shouldDirty: true })
          }
          onCustomOptionsChange={(items) =>
            setValue("customBatchLanguages", items, { shouldDirty: true })
          }
        />
        <section className="batch-form-card batch-form-card--communication">
          <h3>
            <span>08</span>
            <small>Online</small> Links &amp; Communication
          </h3>
          <div className="grid grid-2">
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
          </div>
        </section>
        <div className="batch-form-actions">
          <div>
            <CalendarDays size={17} />
            <span>
              <strong>Ready to create this batch?</strong>
              <small>Review schedule and required fields before saving.</small>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/batches")}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Create Batch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBatch;
