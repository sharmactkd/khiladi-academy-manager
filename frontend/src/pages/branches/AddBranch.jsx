import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createBranch } from "../../api/branchApi";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";

const FACILITY_OPTIONS = [
  "Mat Area",
  "Changing Room",
  "Washroom",
  "Drinking Water",
  "Parking",
  "CCTV",
  "First Aid",
  "PSS / Sensor System",
  "Gym Equipment",
  "Waiting Area",
];

const LANGUAGE_OPTIONS = [
  "Hindi",
  "English",
  "Urdu",
  "Punjabi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
];

const currentYear = new Date().getFullYear();

const AddBranch = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    branchName: "",
    branchCode: "",
    countryCode: "+91",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",

    headCoachName: "",
    headCoachCountryCode: "+91",
    headCoachPhone: "",

    assistantCoachName: "",
    assistantCoachCountryCode: "+91",
    assistantCoachPhone: "",

    additionalCoaches: [],
customFacility: "",
customLanguage: "",

    branchSince: "",
    facilities: [],
    languagesSpoken: [],

    isMainBranch: false,
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleArrayValue = (field, value) => {
    setForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const handleHeadCoachPhoneChange = (field, value) => {
    updateField(
      field === "countryCode" ? "headCoachCountryCode" : "headCoachPhone",
      value
    );
  };

  const handleAssistantCoachPhoneChange = (field, value) => {
    updateField(
      field === "countryCode"
        ? "assistantCoachCountryCode"
        : "assistantCoachPhone",
      value
    );
  };

  const addAdditionalCoach = () => {
  setForm((prev) => ({
    ...prev,
    additionalCoaches: [
      ...(prev.additionalCoaches || []),
      { name: "", countryCode: "+91", phone: "" },
    ],
  }));
};

const updateAdditionalCoach = (index, field, value) => {
  setForm((prev) => ({
    ...prev,
    additionalCoaches: prev.additionalCoaches.map((coach, coachIndex) =>
      coachIndex === index ? { ...coach, [field]: value } : coach
    ),
  }));
};

const removeAdditionalCoach = (index) => {
  setForm((prev) => ({
    ...prev,
    additionalCoaches: prev.additionalCoaches.filter(
      (_, coachIndex) => coachIndex !== index
    ),
  }));
};

const addCustomFacility = () => {
  const value = String(form.customFacility || "").trim();

  if (!value || form.facilities.includes(value)) return;

  setForm((prev) => ({
    ...prev,
    facilities: [...prev.facilities, value],
    customFacility: "",
  }));
};

const addCustomLanguage = () => {
  const value = String(form.customLanguage || "").trim();

  if (!value || form.languagesSpoken.includes(value)) return;

  setForm((prev) => ({
    ...prev,
    languagesSpoken: [...prev.languagesSpoken, value],
    customLanguage: "",
  }));
};

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createBranch({
        ...form,
        facilities: form.facilities,
        languagesSpoken: form.languagesSpoken,
        additionalCoaches: form.additionalCoaches,

      });

      navigate("/branches");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create branch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Branch</h1>
          <p>Create a new academy branch.</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Branch Name *</label>
            <input
              value={form.branchName}
              onChange={(event) =>
                updateField("branchName", event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Branch Code *</label>
            <input
              value={form.branchCode}
              onChange={(event) =>
                updateField("branchCode", event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Branch Since</label>
            <select
              value={form.branchSince || ""}
              onChange={(event) => updateField("branchSince", event.target.value)}
            >
              <option value="">Select Year</option>

              {Array.from({ length: currentYear - 1949 }, (_, index) => {
                const year = currentYear - index;

                return (
                  <option key={year} value={year}>
                    {year} ({currentYear - year} Years)
                  </option>
                );
              })}
            </select>
          </div>

          <PhoneLocationFields
            countryCode={form.countryCode || "+91"}
            phone={form.phone || ""}
            country={form.country || "India"}
            state={form.state || ""}
            city={form.city || ""}
            phoneLabel="Branch Phone"
            onChange={updateField}
          />

          <div className="form-group form-group-full">
            <label>Address</label>
            <textarea
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>
        </div>

        <div className="card subtle-card">
          <h3>Coaches</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Branch In-charge / Head Coach</label>
              <input
                value={form.headCoachName}
                onChange={(event) =>
                  updateField("headCoachName", event.target.value)
                }
              />
            </div>

            <PhoneLocationFields
              countryCode={form.headCoachCountryCode || "+91"}
              phone={form.headCoachPhone || ""}
              phoneLabel="Head Coach Mobile"
              showLocation={false}
              onChange={handleHeadCoachPhoneChange}
            />

            <div className="form-group">
              <label>Assistant Coach</label>
              <input
                value={form.assistantCoachName}
                onChange={(event) =>
                  updateField("assistantCoachName", event.target.value)
                }
              />
            </div>

            <PhoneLocationFields
              countryCode={form.assistantCoachCountryCode || "+91"}
              phone={form.assistantCoachPhone || ""}
              phoneLabel="Assistant Coach Mobile"
              showLocation={false}
              onChange={handleAssistantCoachPhoneChange}
            />
          </div>

          <div className="form-group form-group-full">
  <button
    type="button"
    className="btn btn-secondary"
    onClick={addAdditionalCoach}
  >
    + Add More Coach
  </button>
</div>

{(form.additionalCoaches || []).map((coach, index) => (
  <React.Fragment key={index}>
    <div className="form-group">
      <label>Coach Name</label>
      <input
        value={coach.name || ""}
        onChange={(event) =>
          updateAdditionalCoach(index, "name", event.target.value)
        }
        placeholder="Coach name"
      />
    </div>

    <PhoneLocationFields
      countryCode={coach.countryCode || "+91"}
      phone={coach.phone || ""}
      phoneLabel="Coach Mobile"
      showLocation={false}
      onChange={(field, value) =>
        updateAdditionalCoach(
          index,
          field === "countryCode" ? "countryCode" : "phone",
          value
        )
      }
    />

    <div className="form-group">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => removeAdditionalCoach(index)}
      >
        Remove Coach
      </button>
    </div>
  </React.Fragment>
))}

        </div>

     <div className="card subtle-card">
  <h3>Facilities</h3>

  <div className="checkbox-grid">
    {FACILITY_OPTIONS.map((facility) => (
      <label key={facility}>
        <input
          type="checkbox"
          checked={form.facilities.includes(facility)}
          onChange={() => toggleArrayValue("facilities", facility)}
        />
        {facility}
      </label>
    ))}
  </div>

  <div className="form-group" style={{ marginTop: 12 }}>
    <label>Add Custom Facility</label>
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={form.customFacility || ""}
        onChange={(event) => updateField("customFacility", event.target.value)}
        placeholder="Enter facility"
      />
      <button
        type="button"
        className="btn btn-secondary"
        onClick={addCustomFacility}
      >
        Add
      </button>
    </div>
  </div>
</div>

      <div className="card subtle-card">
  <h3>Languages Spoken</h3>

  <div className="checkbox-grid">
    {LANGUAGE_OPTIONS.map((language) => (
      <label key={language}>
        <input
          type="checkbox"
          checked={form.languagesSpoken.includes(language)}
          onChange={() => toggleArrayValue("languagesSpoken", language)}
        />
        {language}
      </label>
    ))}
  </div>

  <div className="form-group" style={{ marginTop: 12 }}>
    <label>Add Custom Language</label>
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={form.customLanguage || ""}
        onChange={(event) => updateField("customLanguage", event.target.value)}
        placeholder="Enter language"
      />
      <button
        type="button"
        className="btn btn-secondary"
        onClick={addCustomLanguage}
      >
        Add
      </button>
    </div>
  </div>
</div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={form.isMainBranch}
              onChange={(event) =>
                updateField("isMainBranch", event.target.checked)
              }
            />
            Main Branch
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/branches")}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Branch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBranch;