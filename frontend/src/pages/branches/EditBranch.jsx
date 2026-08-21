import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { getBranchById, getBranches, updateBranch } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import BranchFormSectionHeader from "./components/BranchFormSectionHeader.jsx";
import "./BranchForm.module.css";

const FACILITY_OPTIONS = [
  "Mat Area", "Changing Room", "Washroom", "Drinking Water", "Parking",
  "CCTV", "First Aid", "PSS / Sensor System", "Gym Equipment", "Waiting Area",
];

const LANGUAGE_OPTIONS = [
  "Hindi", "English", "Urdu", "Punjabi", "Bengali", "Marathi", "Tamil",
  "Telugu", "Kannada", "Malayalam",
];

const currentYear = new Date().getFullYear();

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? normalizeList(parsed) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

const normalizePhones = (branch) => {
  const stored = Array.isArray(branch?.phoneNumbers) ? branch.phoneNumbers : [];
  const phones = stored.slice(0, 4).map((item, index) => ({
    countryCode: item?.countryCode || "+91",
    phone: item?.phone || "",
    isPrimary: index === 0,
  }));
  if (!phones.length) {
    phones.push({ countryCode: branch?.countryCode || "+91", phone: branch?.phone || "", isPrimary: true });
  }
  return phones;
};

const createInitialForm = () => ({
  directorName: "",
  branchName: "",
  branchCode: "",
  countryCode: "+91",
  phone: "",
  phoneNumbers: [],
  email: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  headCoachName: "",
  headCoachCountryCode: "+91",
  headCoachPhone: "",
  headCoachAchievements: "",
  assistantCoachName: "",
  assistantCoachCountryCode: "+91",
  assistantCoachPhone: "",
  assistantCoachAchievements: "",
  additionalCoaches: [],
  customFacility: "",
  customLanguage: "",
  customFacilities: [],
  customLanguages: [],
  branchSince: "",
  facilities: [],
  languagesSpoken: [],
  isMainBranch: false,
  isActive: true,
});

const normalizeBranch = (branch) => ({
  ...createInitialForm(),
  ...branch,
  directorName: branch?.directorName || "",
  phoneNumbers: normalizePhones(branch),
  additionalCoaches: Array.isArray(branch?.additionalCoaches)
    ? branch.additionalCoaches.map((coach) => ({
        name: coach?.name || "",
        countryCode: coach?.countryCode || "+91",
        phone: coach?.phone || "",
        achievements: coach?.achievements || "",
      }))
    : [],
  facilities: normalizeList(branch?.facilities),
  customFacilities: [
    ...new Set([
      ...normalizeList(branch?.customFacilities),
      ...normalizeList(branch?.facilities).filter((item) => !FACILITY_OPTIONS.includes(item)),
    ]),
  ],
  languagesSpoken: normalizeList(branch?.languagesSpoken),
  customLanguages: [
    ...new Set([
      ...normalizeList(branch?.customLanguages),
      ...normalizeList(branch?.languagesSpoken).filter((item) => !LANGUAGE_OPTIONS.includes(item)),
    ]),
  ],
  branchSince: branch?.branchSince || "",
  isMainBranch: Boolean(branch?.isMainBranch),
  isActive: branch?.isActive !== false,
});

const unwrapList = (response) => {
  const candidates = [response?.data?.data, response?.data, response];
  return candidates.find(Array.isArray) || [];
};

const joinAddressParts = (parts = []) => {
  const values = [];
  parts.forEach((part) => {
    const value = String(part ?? "").trim();
    if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value);
  });
  return values.join(", ");
};

const EditBranch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMode, setSavingMode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [branchResult, academyResult, branchesResult, batchesResult] = await Promise.allSettled([
        getBranchById(id), academyApi.getMyAcademy(), getBranches({ status: "all" }), batchApi.getAll(),
      ]);
      if (branchResult.status === "rejected") throw branchResult.reason;
      const response = branchResult.value;
      const payload = response?.data || response;
      setForm(normalizeBranch(payload?.branch || payload?.data?.branch || payload));
      if (academyResult.status === "fulfilled") {
        setAcademy(academyResult.value?.data?.data?.academy || academyResult.value?.data?.academy || null);
      }
      setBranches(branchesResult.status === "fulfilled" ? unwrapList(branchesResult.value) : []);
      setBatches(batchesResult.status === "fulfilled" ? unwrapList(batchesResult.value) : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load branch.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const updateField = (name, value) => setForm((previous) => ({ ...previous, [name]: value }));

  const toggleArrayValue = (field, value) => {
    setForm((previous) => {
      const current = Array.isArray(previous[field]) ? previous[field] : [];
      return { ...previous, [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] };
    });
  };

  const addCustomValue = (sourceField, targetField) => {
    const value = String(form[sourceField] || "").trim();
    if (!value) return;
    setForm((previous) => {
      const current = previous[targetField] || [];
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) return { ...previous, [sourceField]: "" };
      const catalogField = targetField === "facilities" ? "customFacilities" : "customLanguages";
      const catalog = previous[catalogField] || [];
      return {
        ...previous,
        [targetField]: [...current, value],
        [catalogField]: catalog.some((item) => item.toLowerCase() === value.toLowerCase()) ? catalog : [...catalog, value],
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

  const addAdditionalCoach = () => setForm((previous) => ({
    ...previous,
    additionalCoaches: [...previous.additionalCoaches, { name: "", countryCode: "+91", phone: "", achievements: "" }],
  }));

  const updateAdditionalCoach = (index, field, value) => setForm((previous) => ({
    ...previous,
    additionalCoaches: previous.additionalCoaches.map((coach, coachIndex) => coachIndex === index ? { ...coach, [field]: value } : coach),
  }));

  const removeAdditionalCoach = (index) => setForm((previous) => ({
    ...previous,
    additionalCoaches: previous.additionalCoaches.filter((_, coachIndex) => coachIndex !== index),
  }));

  const handleCoachPhoneChange = (prefix) => (field, value) => {
    updateField(field === "countryCode" ? `${prefix}CountryCode` : `${prefix}Phone`, value);
  };

  const activeBranches = useMemo(() => branches.filter((branch) => branch?.isActive !== false), [branches]);
  const mainBranch = branches.find((branch) => branch?.isMainBranch) || activeBranches[0] || null;
  const activeBatchCount = batches.filter((batch) => batch?.isActive !== false).length;
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
    try {
      setSavingMode("update");
      setError("");
      setSuccess("");
      const payload = {
        ...form,
        directorName: form.directorName.trim(),
        branchName: form.branchName.trim(),
        branchCode: form.branchCode.trim().toUpperCase(),
        email: form.email.trim(),
        address: form.address.trim(),
        additionalCoaches: form.additionalCoaches.filter((coach) => coach.name?.trim() || coach.phone?.trim()),
      };
      delete payload.customFacility;
      delete payload.customLanguage;
      await updateBranch(id, payload);
      navigate("/branches/" + id, { state: { message: payload.branchName + " updated successfully." } });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to update branch. Please review the details and try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSavingMode("");
    }
  };

  const isSaving = Boolean(savingMode);

  if (loading) {
    return <div className="page edit-branch-state"><span className="edit-branch-spinner" /><strong>Loading branch editor…</strong></div>;
  }

  if (!form) {
    return <div className="page edit-branch-state edit-branch-state--error"><strong>{error || "Branch not found."}</strong><button type="button" className="btn btn-primary" onClick={() => loadPage()}>Try Again</button></div>;
  }

  return (
    <div className="page add-branch-page edit-branch-page">
      <AcademyHeroHeader
        headingId="edit-branch-academy-name"
        academyName={academyName}
        ownerName={ownerName}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={mainAddress || "Complete main branch address not available"}
        summaryItems={[
          { key: "branches", type: "branches", value: activeBranches.length, label: `Active ${activeBranches.length === 1 ? "Branch" : "Branches"}` },
          { key: "batches", type: "batches", value: activeBatchCount, label: `Active ${activeBatchCount === 1 ? "Batch" : "Batches"}` },
        ]}
      />

      <nav className="add-branch-breadcrumb" aria-label="Breadcrumb"><Link to="/branches">Branches</Link><span>/</span><Link to={"/branches/" + id}>{form.branchName}</Link><span>/</span><strong>Edit</strong></nav>

      <header className="add-branch-heading">
        <div className="add-branch-heading__title"><span><Building2 size={25} /></span><div><h1>Edit Branch</h1><p>Update {form.branchName}'s complete operational profile.</p></div></div>
        <Link to={"/branches/" + id} className="btn btn-outline"><ArrowLeft size={16} /> Back to Details</Link>
      </header>

      {error ? <div className="add-branch-message add-branch-message--error" role="alert"><ShieldCheck size={18} /><span>{error}</span><button type="button" onClick={() => setError("")}><X size={16} /></button></div> : null}
      {success ? <div className="add-branch-message add-branch-message--success" role="status"><Check size={18} /><span>{success}</span><button type="button" onClick={() => setSuccess("")}><X size={16} /></button></div> : null}

      <form className="add-branch-form" onSubmit={handleSubmit}>
        <div className="add-branch-primary-grid">
          <section className="add-branch-card">
            <BranchFormSectionHeader icon={Building2} eyebrow="Identity" title="Branch Identity" description="Primary branch identification and contact details." />
            <div className="add-branch-fields add-branch-fields--two">
              <label><span>Branch Name <b>*</b></span><input value={form.branchName} onChange={(event) => updateField("branchName", event.target.value)} placeholder="Enter branch name" required maxLength={120} /></label>
              <label><span>Branch Code <b>*</b></span><input value={form.branchCode} onChange={(event) => updateField("branchCode", event.target.value.toUpperCase())} placeholder="Example: AGR-01" required maxLength={30} /></label>
              <label><span>Director Name <b>*</b></span><input value={form.directorName} onChange={(event) => updateField("directorName", event.target.value)} placeholder="Enter director name" required minLength={2} maxLength={120} /></label>
              <label><span>Branch Since</span><select value={form.branchSince} onChange={(event) => updateField("branchSince", event.target.value)}><option value="">Select Year</option>{Array.from({ length: currentYear - 1949 }, (_, index) => currentYear - index).map((year) => <option key={year} value={year}>{year} ({currentYear - year} Years)</option>)}</select></label>
            </div>
            <div className="add-branch-toggle-row">
              <label className="add-branch-switch"><input type="checkbox" checked={form.isMainBranch} onChange={(event) => updateField("isMainBranch", event.target.checked)} /><span /><div><strong>Set as Main Branch</strong><small>Primary academy location for reports and defaults.</small></div></label>
              <label className="add-branch-switch"><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} /><span /><div><strong>Active Branch</strong><small>Allow operational use immediately after creation.</small></div></label>
            </div>
          </section>

          <section className="add-branch-card add-branch-location-card">
            <BranchFormSectionHeader icon={MapPin} eyebrow="Contact" title="Location & Contact" description="Complete address and official branch phone numbers." />
            <div className="academy-profile-location-fields">
              <PhoneLocationFields countryCode={form.countryCode} phone={form.phone} phoneNumbers={form.phoneNumbers} maxPhones={4} country={form.country} state={form.state} city={form.city} phoneLabel="Phone" onChange={updateField} />
              <label className="academy-profile-contact-email"><span>Email</span><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="branch@example.com" /></label>
              <label className="academy-profile-contact-address"><span>Address</span><textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Enter complete branch address" maxLength={500} rows={3} /></label>
            </div>
          </section>
        </div>

        <section className="add-branch-card">
          <BranchFormSectionHeader icon={UsersRound} eyebrow="Team" title="Coaches & Branch In-charge" description="Assign the primary coaching team. Additional coaches are optional." />
          <div className="add-branch-coach-grid">
            <article><h3><UserRound size={16} /> Head Coach / Branch In-charge</h3><label><span>Name</span><input value={form.headCoachName} onChange={(event) => updateField("headCoachName", event.target.value)} placeholder="Enter head coach name" maxLength={120} /></label><PhoneLocationFields countryCode={form.headCoachCountryCode} phone={form.headCoachPhone} maxPhones={1} phoneLabel="Mobile Number" showLocation={false} onChange={handleCoachPhoneChange("headCoach")} /><label><span>Achievements / Qualifications</span><textarea value={form.headCoachAchievements} onChange={(event) => updateField("headCoachAchievements", event.target.value)} placeholder="Dan rank, certifications, medals, coaching experience…" rows={3} maxLength={1000} /></label></article>
            <article><h3><UserRound size={16} /> Assistant Coach</h3><label><span>Name</span><input value={form.assistantCoachName} onChange={(event) => updateField("assistantCoachName", event.target.value)} placeholder="Enter assistant coach name" maxLength={120} /></label><PhoneLocationFields countryCode={form.assistantCoachCountryCode} phone={form.assistantCoachPhone} maxPhones={1} phoneLabel="Mobile Number" showLocation={false} onChange={handleCoachPhoneChange("assistantCoach")} /><label><span>Achievements / Qualifications</span><textarea value={form.assistantCoachAchievements} onChange={(event) => updateField("assistantCoachAchievements", event.target.value)} placeholder="Dan rank, certifications, medals, coaching experience…" rows={3} maxLength={1000} /></label></article>
          </div>

          <div className="add-branch-additional-head"><div><h3>Additional Coaches</h3><p>Add more coaching staff when required.</p></div><button type="button" className="btn btn-outline" onClick={addAdditionalCoach}><Plus size={15} /> Add Coach</button></div>
          {form.additionalCoaches.length ? <div className="add-branch-additional-list">{form.additionalCoaches.map((coach, index) => <article key={`coach-${index}`}><span className="add-branch-coach-number">{index + 1}</span><label><span>Coach Name</span><input value={coach.name} onChange={(event) => updateAdditionalCoach(index, "name", event.target.value)} placeholder="Coach name" /></label><PhoneLocationFields countryCode={coach.countryCode} phone={coach.phone} maxPhones={1} phoneLabel="Coach Mobile" showLocation={false} onChange={(field, value) => updateAdditionalCoach(index, field === "countryCode" ? "countryCode" : "phone", value)} /><label className="add-branch-coach-achievements"><span>Achievements / Qualifications</span><input value={coach.achievements || ""} onChange={(event) => updateAdditionalCoach(index, "achievements", event.target.value)} placeholder="Qualifications and achievements" /></label><button type="button" className="add-branch-remove-coach" onClick={() => removeAdditionalCoach(index)} aria-label={`Remove coach ${index + 1}`}><Trash2 size={16} /></button></article>)}</div> : <div className="add-branch-empty-coaches">No additional coaches added.</div>}
        </section>

        <div className="add-branch-secondary-grid">
          <section className="add-branch-card add-branch-selection-card">
            <BranchFormSectionHeader icon={Warehouse} eyebrow="Infrastructure" title="Facilities" description="Select everything available at this location." />
            <div className="add-branch-chip-grid"><IconOptionGrid kind="facility" options={[...new Set([...FACILITY_OPTIONS, ...form.customFacilities])]} selected={form.facilities} customOptions={form.customFacilities} onToggle={(facility) => toggleArrayValue("facilities", facility)} onRemoveCustom={(facility) => removeCustomValue(facility, "facilities", "customFacilities")} /></div>
            <div className="add-branch-custom-row"><input value={form.customFacility} onChange={(event) => updateField("customFacility", event.target.value)} onKeyDown={(event) => handleCustomKeyDown(event, "customFacility", "facilities")} placeholder="Add custom facility" /><button type="button" onClick={() => addCustomValue("customFacility", "facilities")} disabled={!form.customFacility.trim()}><Plus size={14} /> Add</button></div>
          </section>

          <section className="add-branch-card add-branch-selection-card">
            <BranchFormSectionHeader icon={Languages} eyebrow="Communication" title="Languages Spoken" description="Languages supported by the branch team." />
            <div className="add-branch-chip-grid"><IconOptionGrid kind="language" options={[...new Set([...LANGUAGE_OPTIONS, ...form.customLanguages])]} selected={form.languagesSpoken} customOptions={form.customLanguages} onToggle={(language) => toggleArrayValue("languagesSpoken", language)} onRemoveCustom={(language) => removeCustomValue(language, "languagesSpoken", "customLanguages")} /></div>
            <div className="add-branch-custom-row"><input value={form.customLanguage} onChange={(event) => updateField("customLanguage", event.target.value)} onKeyDown={(event) => handleCustomKeyDown(event, "customLanguage", "languagesSpoken")} placeholder="Add custom language" /><button type="button" onClick={() => addCustomValue("customLanguage", "languagesSpoken")} disabled={!form.customLanguage.trim()}><Plus size={14} /> Add</button></div>
          </section>
        </div>

        <footer className="add-branch-actions">
          <div><Settings2 size={17} /><span><strong>Ready to update this branch?</strong><small>Review all changes before saving.</small></span></div>
          <button type="button" className="btn btn-outline" onClick={() => navigate("/branches/" + id)} disabled={isSaving}><X size={16} /> Cancel</button>
          <button type="button" className="btn btn-outline" onClick={() => loadPage()} disabled={isSaving}><RefreshCw size={16} /> Reset Changes</button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}><Save size={16} /> {isSaving ? "Updating…" : "Update Branch"}</button>
        </footer>
      </form>
    </div>
  );
};

export default EditBranch;
