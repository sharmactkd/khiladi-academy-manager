import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Languages,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  Warehouse,
  X,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { batchApi } from "../../api/batchApi.js";
import { createBranch, getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import BranchFormSectionHeader from "./components/BranchFormSectionHeader.jsx";
import { currentYear, FACILITY_OPTIONS, LANGUAGE_OPTIONS } from "./branch.config.js";
import { createBranchPayload, createInitialBranchForm, joinAddressParts, unwrapList } from "./branch.utils.js";
import "./BranchForm.module.css";

const AddBranch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(createInitialBranchForm);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [headerRefreshing, setHeaderRefreshing] = useState(false);
  const [savingMode, setSavingMode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadHeaderData = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setHeaderRefreshing(true);
    try {
      const [academyResult, branchesResult, batchesResult] =
        await Promise.allSettled([
          academyApi.getMyAcademy(),
          getBranches({ status: "all" }),
          batchApi.getAll(),
        ]);
      if (academyResult.status === "fulfilled") {
        setAcademy(
          academyResult.value?.data?.data?.academy ||
            academyResult.value?.data?.academy ||
            null,
        );
      }
      setBranches(
        branchesResult.status === "fulfilled"
          ? unwrapList(branchesResult.value)
          : [],
      );
      setBatches(
        batchesResult.status === "fulfilled"
          ? unwrapList(batchesResult.value)
          : [],
      );
    } finally {
      setHeaderRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHeaderData();
  }, [loadHeaderData]);

  const updateField = (name, value) =>
    setForm((previous) => ({ ...previous, [name]: value }));

  const toggleArrayValue = (field, value) => {
    setForm((previous) => {
      const current = Array.isArray(previous[field]) ? previous[field] : [];
      return {
        ...previous,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const addCustomValue = (sourceField, targetField) => {
    const value = String(form[sourceField] || "").trim();
    if (!value) return;
    setForm((previous) => {
      const current = previous[targetField] || [];
      if (current.some((item) => item.toLowerCase() === value.toLowerCase()))
        return { ...previous, [sourceField]: "" };
      const catalogField =
        targetField === "facilities" ? "customFacilities" : "customLanguages";
      const catalog = previous[catalogField] || [];
      return {
        ...previous,
        [targetField]: [...current, value],
        [catalogField]: catalog.some(
          (item) => item.toLowerCase() === value.toLowerCase(),
        )
          ? catalog
          : [...catalog, value],
        [sourceField]: "",
      };
    });
  };

  const handleCustomKeyDown = (event, sourceField, targetField) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustomValue(sourceField, targetField);
  };

  const removeCustomValue = (value, targetField, catalogField) => {
    setForm((previous) => ({
      ...previous,
      [targetField]: (previous[targetField] || []).filter((item) => item !== value),
      [catalogField]: (previous[catalogField] || []).filter((item) => item !== value),
    }));
  };

  const addAdditionalCoach = () =>
    setForm((previous) => ({
      ...previous,
      additionalCoaches: [
        ...previous.additionalCoaches,
        { name: "", countryCode: "+91", phone: "", achievements: "" },
      ],
    }));

  const updateAdditionalCoach = (index, field, value) =>
    setForm((previous) => ({
      ...previous,
      additionalCoaches: previous.additionalCoaches.map((coach, coachIndex) =>
        coachIndex === index ? { ...coach, [field]: value } : coach,
      ),
    }));

  const removeAdditionalCoach = (index) =>
    setForm((previous) => ({
      ...previous,
      additionalCoaches: previous.additionalCoaches.filter(
        (_, coachIndex) => coachIndex !== index,
      ),
    }));

  const handleCoachPhoneChange = (prefix) => (field, value) => {
    updateField(
      field === "countryCode" ? `${prefix}CountryCode` : `${prefix}Phone`,
      value,
    );
  };

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch?.isActive !== false),
    [branches],
  );
  const mainBranch =
    branches.find((branch) => branch?.isMainBranch) ||
    activeBranches[0] ||
    null;
  const activeBatchCount = batches.filter(
    (batch) => batch?.isActive !== false,
  ).length;
  const academyName = academy?.academyName || "KHILADI Academy";
  const ownerName = academy?.ownerName || user?.name || "Academy Owner";
  const mainAddress = joinAddressParts([
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const mode = event.nativeEvent?.submitter?.value || "create";
    try {
      setSavingMode(mode);
      setError("");
      setSuccess("");
      const payload = createBranchPayload(form);
      await createBranch(payload);

      if (mode === "create-another") {
        setForm(createInitialBranchForm());
        setSuccess(
          `${payload.branchName} created successfully. You can add another branch.`,
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        await loadHeaderData({ quiet: true });
      } else {
        navigate("/branches", {
          state: { message: `${payload.branchName} created successfully.` },
        });
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to create branch. Please review the details and try again.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSavingMode("");
    }
  };

  const isSaving = Boolean(savingMode);

  return (
    <div className="page add-branch-page">
      <AcademyHeroHeader
        headingId="add-branch-academy-name"
        academyName={academyName}
        ownerName={ownerName}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={mainAddress || "Complete main branch address not available"}
        summaryItems={[
          {
            key: "branches",
            type: "branches",
            value: activeBranches.length,
            label: `Active ${activeBranches.length === 1 ? "Branch" : "Branches"}`,
          },
          {
            key: "batches",
            type: "batches",
            value: activeBatchCount,
            label: `Active ${activeBatchCount === 1 ? "Batch" : "Batches"}`,
          },
        ]}
        action={
          <button
            type="button"
            className="add-branch-hero-refresh"
            onClick={() => loadHeaderData({ quiet: true })}
            disabled={headerRefreshing}
          >
            <RefreshCw
              size={16}
              className={headerRefreshing ? "is-spinning" : ""}
            />
            {headerRefreshing ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      <nav className="add-branch-breadcrumb" aria-label="Breadcrumb">
        <Link to="/branches">Branches</Link>
        <span>/</span>
        <strong>Add New Branch</strong>
      </nav>

      <header className="add-branch-heading">
        <div className="add-branch-heading__title">
          <span>
            <Building2 size={25} />
          </span>
          <div>
            <h1>Add New Branch</h1>
            <p>
              Create a new academy location and configure its complete
              operational profile.
            </p>
          </div>
        </div>
        <Link to="/branches" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Branches
        </Link>
      </header>

      {error ? (
        <div
          className="add-branch-message add-branch-message--error"
          role="alert"
        >
          <ShieldCheck size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}
      {success ? (
        <div
          className="add-branch-message add-branch-message--success"
          role="status"
        >
          <Check size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <form className="add-branch-form" onSubmit={handleSubmit}>
        <div className="add-branch-primary-grid">
          <section className="add-branch-card">
            <BranchFormSectionHeader
              icon={Building2}
              eyebrow="Identity"
              title="Branch Identity"
              description="Primary branch identification and contact details."
            />
            <div className="add-branch-fields add-branch-fields--two">
              <label>
                <span>
                  Branch Name <b>*</b>
                </span>
                <input
                  value={form.branchName}
                  onChange={(event) =>
                    updateField("branchName", event.target.value)
                  }
                  placeholder="Enter branch name"
                  required
                  maxLength={120}
                />
              </label>
              <label>
                <span>
                  Branch Code <b>*</b>
                </span>
                <input
                  value={form.branchCode}
                  onChange={(event) =>
                    updateField("branchCode", event.target.value.toUpperCase())
                  }
                  placeholder="Example: AGR-01"
                  required
                  maxLength={30}
                />
              </label>
              <label>
                <span>
                  Director Name <b>*</b>
                </span>
                <input
                  value={form.directorName}
                  onChange={(event) =>
                    updateField("directorName", event.target.value)
                  }
                  placeholder="Enter director name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label>
                <span>Branch Since</span>
                <select
                  value={form.branchSince}
                  onChange={(event) =>
                    updateField("branchSince", event.target.value)
                  }
                >
                  <option value="">Select Year</option>
                  {Array.from(
                    { length: currentYear - 1949 },
                    (_, index) => currentYear - index,
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year} ({currentYear - year} Years)
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="add-branch-toggle-row">
              <label className="add-branch-switch">
                <input
                  type="checkbox"
                  checked={form.isMainBranch}
                  onChange={(event) =>
                    updateField("isMainBranch", event.target.checked)
                  }
                />
                <span />
                <div>
                  <strong>Set as Main Branch</strong>
                  <small>
                    Primary academy location for reports and defaults.
                  </small>
                </div>
              </label>
              <label className="add-branch-switch">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                />
                <span />
                <div>
                  <strong>Active Branch</strong>
                  <small>
                    Allow operational use immediately after creation.
                  </small>
                </div>
              </label>
            </div>
          </section>

          <section className="add-branch-card add-branch-location-card">
            <BranchFormSectionHeader
              icon={MapPin}
              eyebrow="Contact"
              title="Location & Contact"
              description="Complete address and official branch phone numbers."
            />
            <div className="academy-profile-location-fields">
              <PhoneLocationFields
                countryCode={form.countryCode}
                phone={form.phone}
                phoneNumbers={form.phoneNumbers}
                maxPhones={4}
                country={form.country}
                state={form.state}
                city={form.city}
                phoneLabel="Phone"
                onChange={updateField}
              />
              <label className="academy-profile-contact-email">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="branch@example.com"
                />
              </label>
              <label className="academy-profile-contact-address">
                <span>Address</span>
                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  placeholder="Enter complete branch address"
                  maxLength={500}
                  rows={3}
                />
              </label>
            </div>
          </section>
        </div>

        <section className="add-branch-card">
          <BranchFormSectionHeader
            icon={UsersRound}
            eyebrow="Team"
            title="Coaches & Branch In-charge"
            description="Assign the primary coaching team. Additional coaches are optional."
          />
          <div className="add-branch-coach-grid">
            <article>
              <h3>
                <UserRound size={16} /> Head Coach / Branch In-charge
              </h3>
              <label>
                <span>Name</span>
                <input
                  value={form.headCoachName}
                  onChange={(event) =>
                    updateField("headCoachName", event.target.value)
                  }
                  placeholder="Enter head coach name"
                  maxLength={120}
                />
              </label>
              <PhoneLocationFields
                countryCode={form.headCoachCountryCode}
                phone={form.headCoachPhone}
                maxPhones={1}
                phoneLabel="Mobile Number"
                showLocation={false}
                onChange={handleCoachPhoneChange("headCoach")}
              />
              <label>
                <span>Achievements / Qualifications</span>
                <textarea
                  value={form.headCoachAchievements}
                  onChange={(event) =>
                    updateField("headCoachAchievements", event.target.value)
                  }
                  placeholder="Dan rank, certifications, medals, coaching experienceâ€¦"
                  rows={3}
                  maxLength={1000}
                />
              </label>
            </article>
            <article>
              <h3>
                <UserRound size={16} /> Assistant Coach
              </h3>
              <label>
                <span>Name</span>
                <input
                  value={form.assistantCoachName}
                  onChange={(event) =>
                    updateField("assistantCoachName", event.target.value)
                  }
                  placeholder="Enter assistant coach name"
                  maxLength={120}
                />
              </label>
              <PhoneLocationFields
                countryCode={form.assistantCoachCountryCode}
                phone={form.assistantCoachPhone}
                maxPhones={1}
                phoneLabel="Mobile Number"
                showLocation={false}
                onChange={handleCoachPhoneChange("assistantCoach")}
              />
              <label>
                <span>Achievements / Qualifications</span>
                <textarea
                  value={form.assistantCoachAchievements}
                  onChange={(event) =>
                    updateField(
                      "assistantCoachAchievements",
                      event.target.value,
                    )
                  }
                  placeholder="Dan rank, certifications, medals, coaching experienceâ€¦"
                  rows={3}
                  maxLength={1000}
                />
              </label>
            </article>
          </div>

          <div className="add-branch-additional-head">
            <div>
              <h3>Additional Coaches</h3>
              <p>Add more coaching staff when required.</p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={addAdditionalCoach}
            >
              <Plus size={15} /> Add Coach
            </button>
          </div>
          {form.additionalCoaches.length ? (
            <div className="add-branch-additional-list">
              {form.additionalCoaches.map((coach, index) => (
                <article key={`coach-${index}`}>
                  <span className="add-branch-coach-number">{index + 1}</span>
                  <label>
                    <span>Coach Name</span>
                    <input
                      value={coach.name}
                      onChange={(event) =>
                        updateAdditionalCoach(index, "name", event.target.value)
                      }
                      placeholder="Coach name"
                    />
                  </label>
                  <PhoneLocationFields
                    countryCode={coach.countryCode}
                    phone={coach.phone}
                    maxPhones={1}
                    phoneLabel="Coach Mobile"
                    showLocation={false}
                    onChange={(field, value) =>
                      updateAdditionalCoach(
                        index,
                        field === "countryCode" ? "countryCode" : "phone",
                        value,
                      )
                    }
                  />
                  <label className="add-branch-coach-achievements">
                    <span>Achievements / Qualifications</span>
                    <input
                      value={coach.achievements || ""}
                      onChange={(event) =>
                        updateAdditionalCoach(
                          index,
                          "achievements",
                          event.target.value,
                        )
                      }
                      placeholder="Qualifications and achievements"
                    />
                  </label>
                  <button
                    type="button"
                    className="add-branch-remove-coach"
                    onClick={() => removeAdditionalCoach(index)}
                    aria-label={`Remove coach ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="add-branch-empty-coaches">
              No additional coaches added.
            </div>
          )}
        </section>

        <div className="add-branch-secondary-grid">
          <section className="add-branch-card add-branch-selection-card">
            <BranchFormSectionHeader
              icon={Warehouse}
              eyebrow="Infrastructure"
              title="Facilities"
              description="Select everything available at this location."
            />
            <div className="add-branch-chip-grid">
              <IconOptionGrid
                kind="facility"
                options={[...new Set([...FACILITY_OPTIONS, ...form.customFacilities])]}
                selected={form.facilities}
                customOptions={form.customFacilities}
                onToggle={(facility) => toggleArrayValue("facilities", facility)}
                onRemoveCustom={(facility) => removeCustomValue(facility, "facilities", "customFacilities")}
              />
            </div>
            <div className="add-branch-custom-row">
              <input
                value={form.customFacility}
                onChange={(event) =>
                  updateField("customFacility", event.target.value)
                }
                onKeyDown={(event) =>
                  handleCustomKeyDown(event, "customFacility", "facilities")
                }
                placeholder="Add custom facility"
              />
              <button
                type="button"
                onClick={() => addCustomValue("customFacility", "facilities")}
                disabled={!form.customFacility.trim()}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </section>

          <section className="add-branch-card add-branch-selection-card">
            <BranchFormSectionHeader
              icon={Languages}
              eyebrow="Communication"
              title="Languages Spoken"
              description="Languages supported by the branch team."
            />
            <div className="add-branch-chip-grid">
              <IconOptionGrid
                kind="language"
                options={[...new Set([...LANGUAGE_OPTIONS, ...form.customLanguages])]}
                selected={form.languagesSpoken}
                customOptions={form.customLanguages}
                onToggle={(language) => toggleArrayValue("languagesSpoken", language)}
                onRemoveCustom={(language) => removeCustomValue(language, "languagesSpoken", "customLanguages")}
              />
            </div>
            <div className="add-branch-custom-row">
              <input
                value={form.customLanguage}
                onChange={(event) =>
                  updateField("customLanguage", event.target.value)
                }
                onKeyDown={(event) =>
                  handleCustomKeyDown(
                    event,
                    "customLanguage",
                    "languagesSpoken",
                  )
                }
                placeholder="Add custom language"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomValue("customLanguage", "languagesSpoken")
                }
                disabled={!form.customLanguage.trim()}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </section>
        </div>

        <footer className="add-branch-actions">
          <div>
            <Settings2 size={17} />
            <span>
              <strong>Ready to create this branch?</strong>
              <small>Required fields are marked with an asterisk.</small>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/branches")}
            disabled={isSaving}
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            name="submitMode"
            value="create-another"
            className="btn btn-outline"
            disabled={isSaving}
          >
            <Plus size={16} />{" "}
            {savingMode === "create-another" ? "Savingâ€¦" : "Save & Add Another"}
          </button>
          <button
            type="submit"
            name="submitMode"
            value="create"
            className="btn btn-primary"
            disabled={isSaving}
          >
            <Save size={16} />{" "}
            {savingMode === "create" ? "Creatingâ€¦" : "Create Branch"}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default AddBranch;
