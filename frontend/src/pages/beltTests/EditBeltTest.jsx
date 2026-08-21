import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Award, BadgeCheck, CalendarDays, Check, ClipboardCheck, FileBadge2, GraduationCap, History, Image, Medal, RotateCcw, ShieldCheck, Sparkles, Trophy, UserRound, X } from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { beltTestApi } from "../../api/beltTestApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import { TAEKWONDO_BELTS, TAEKWONDO_BELT_ORDER, TAEKWONDO_DAN_RANKS } from "../../components/taekwondoBelts/taekwondoBelts.js";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import baseStyles from "./AddBeltTest.module.css";
import styles from "./EditBeltTest.module.css";

const EMPTY_FORM = { currentBelt: "", currentDanRank: "", promotedToBelt: "", promotedToDanRank: "", marks: "", outOf: "", testDate: "", result: "pending", examinerName: "", remarks: "", certificateNumber: "", certificateUrl: "" };
const getPayload = (response) => response?.data?.data || response?.data || response || {};
const normalizeAcademy = (response) => getPayload(response)?.academy || null;
const normalizeBranches = (response) => { const list = response?.data?.data || response?.data || []; return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : []; };
const getStudentName = (student) => student?.name || [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() || "Student";
const getStudentCode = (student) => student?.studentCode || student?.admissionNumber || "No admission number";
const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((item) => String(item || "").trim()).filter(Boolean).join(", ");
const toForm = (record) => ({ currentBelt: record?.currentBelt || "", currentDanRank: record?.currentDanRank || "", promotedToBelt: record?.promotedToBelt || "", promotedToDanRank: record?.promotedToDanRank || "", marks: record?.marks ?? "", outOf: record?.outOf ?? "", testDate: record?.testDate ? String(record.testDate).slice(0, 10) : "", result: record?.result || "pending", examinerName: record?.examinerName || "", remarks: record?.remarks || "", certificateNumber: record?.certificateNumber || "", certificateUrl: record?.certificateUrl || "" });

const EditBeltTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [record, setRecord] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    Promise.allSettled([beltTestApi.getById(id), academyApi.getMyAcademy(), getBranches({ status: "active" })]).then(([recordResult, academyResult, branchResult]) => {
      if (recordResult.status === "rejected") {
        setError(recordResult.reason?.response?.data?.message || "Failed to load belt test");
      } else {
        const loadedRecord = getPayload(recordResult.value)?.beltTest;
        if (!loadedRecord) setError("Belt test record not found");
        else { const nextForm = toForm(loadedRecord); setRecord(loadedRecord); setForm(nextForm); setInitialForm(nextForm); }
      }
      if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
      if (branchResult.status === "fulfilled") setBranches(normalizeBranches(branchResult.value));
      setLoading(false);
    });
  }, [id]);

  const student = record?.student || null;
  const score = form.marks !== "" && form.outOf !== "" && Number(form.outOf) > 0 ? Math.round((Number(form.marks) / Number(form.outOf)) * 100) : null;
  const currentDanIndex = TAEKWONDO_DAN_RANKS.indexOf(form.currentDanRank);
  const showCurrentDan = form.currentBelt === "Black";
  const showPromotedDan = form.promotedToBelt === "Black";
  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  const update = (name, value) => {
    if (name === "currentBelt") { setForm((prev) => ({ ...prev, currentBelt: value, currentDanRank: value === "Black" ? prev.currentDanRank : "", promotedToBelt: "", promotedToDanRank: "" })); return; }
    if (name === "promotedToBelt") { setForm((prev) => ({ ...prev, promotedToBelt: value, promotedToDanRank: value === "Black" ? prev.promotedToDanRank : "" })); return; }
    if (name === "currentDanRank") { setForm((prev) => ({ ...prev, currentDanRank: value, promotedToDanRank: "" })); return; }
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleChange = (event) => update(event.target.name, event.target.value);
  const resetForm = () => { setForm(initialForm); setError(""); };

  const validate = () => {
    if (!form.currentBelt || !form.promotedToBelt) return "Please select both current and promoted belt.";
    if (showCurrentDan && !form.currentDanRank) return "Please select current Dan rank.";
    if (showPromotedDan && !form.promotedToDanRank) return "Please select promoted Dan rank.";
    if (form.currentBelt === "Black" && form.promotedToBelt === "Black" && TAEKWONDO_DAN_RANKS.indexOf(form.promotedToDanRank) <= currentDanIndex) return "Promoted Dan rank current Dan rank se higher honi chahiye.";
    if (form.marks !== "" && form.outOf !== "" && Number(form.marks) > Number(form.outOf)) return "Obtained marks total marks se zyada nahi ho sakte.";
    if ((form.marks !== "" || form.outOf !== "") && (!form.outOf || Number(form.outOf) <= 0)) return "Please enter valid total marks.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = validate();
    if (message) { setError(message); return; }
    try {
      setSaving(true); setError("");
      await beltTestApi.update(id, { ...form, marks: form.marks === "" ? null : Number(form.marks), outOf: form.outOf === "" ? null : Number(form.outOf), testDate: form.testDate ? new Date(`${form.testDate}T00:00:00`).toISOString() : null });
      toast.success("Belt test updated successfully");
      navigate("/belt-tests");
    } catch (err) { setError(err.response?.data?.message || "Failed to update belt test"); }
    finally { setSaving(false); }
  };

  const renderBeltSelector = (name, value, label) => {
    const isPromoted = name === "promotedToBelt";
    const currentOrder = TAEKWONDO_BELT_ORDER[form.currentBelt];
    return <fieldset className={baseStyles.beltField}><div className={baseStyles.beltFieldHeader}><legend>{label} *</legend>{value ? <button type="button" onClick={() => update(name, "")}><X size={12}/>Clear</button> : null}</div><IconOptionGrid className={baseStyles.beltTags} compact kind="belt" options={TAEKWONDO_BELTS.map((belt) => { const beltOrder = TAEKWONDO_BELT_ORDER[belt]; const locked = Boolean(value && value !== belt); const belowCurrent = Boolean(isPromoted && currentOrder !== undefined && (beltOrder < currentOrder || (beltOrder === currentOrder && belt !== "Black"))); return { value: belt, label: belt, disabled: locked || belowCurrent }; })} selected={value ? [value] : []} onToggle={(belt) => update(name, value === belt ? "" : belt)} /><p>{value ? "Selected tag ya Clear par click karke rank change karein." : isPromoted && form.currentBelt ? "Current rank se upar ki belt choose karein." : "Belt rank choose karein."}</p></fieldset>;
  };

  if (loading) return <div className={`page ${styles.loadingPage}`}><div className={styles.loadingCard}><span><Medal size={24}/></span><strong>Loading belt test record</strong><p>Assessment and student details prepare ho rahe hain...</p></div></div>;

  return <div className={`page ${baseStyles.page}`}>
    <AcademyHeroHeader headingId="edit-belt-test-academy" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""} eyebrow="Belt progression desk" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(academy) || "Complete main branch address not available"} summaryItems={[{ key: "record", icon: Award, value: record ? "1" : "—", label: "Assessment Record" }, { key: "result", icon: BadgeCheck, value: form.result.toUpperCase(), label: "Current Result" }]}/>
    <nav className={baseStyles.breadcrumb}><Link to="/dashboard">Dashboard</Link><span>/</span><Link to="/belt-tests">Belt Tests</Link><span>/</span><strong>Edit Belt Test</strong></nav>
    <header className={baseStyles.heading}><div><span><Medal size={25}/></span><div><small>Update assessment</small><h1>Edit Belt Test</h1><p>Review promotion, assessment result and official certificate details.</p></div></div><Link to="/belt-tests"><ArrowLeft size={16}/>Belt Test Records</Link></header>
    {error ? <div className={baseStyles.error}><ShieldCheck size={17}/><span>{error}</span><button type="button" onClick={() => setError("")}><X size={15}/></button></div> : null}

    {record ? <form className={baseStyles.workspace} onSubmit={handleSubmit}>
      <main className={baseStyles.formCard}>
        <section className={baseStyles.section}><header><span>01</span><div><h2>Student Identity</h2><p>The student linked with this grading assessment.</p></div></header>{student ? <article className={baseStyles.studentStrip}><button type="button" onClick={() => setShowPhotoModal(true)}><img src={getStudentPhotoUrl(student)} alt={getStudentName(student)} onError={(event) => { event.currentTarget.src = "/default-avatar.png"; }}/><Image size={14}/></button><div><small>Assessment student</small><strong>{getStudentName(student)}</strong><span>{getStudentCode(student)}</span></div><dl><div><dt>Phone</dt><dd>{student.phone || "Not added"}</dd></div><div><dt>Batch</dt><dd>{student.batch?.batchName || "Not assigned"}</dd></div><div><dt>Current Profile Rank</dt><dd>{[student.beltRank, student.danRank].filter(Boolean).join(" · ") || "Not added"}</dd></div></dl></article> : null}</section>

        <section className={baseStyles.section}><header><span>02</span><div><h2>Promotion Path</h2><p>Update the rank before test and the belt or Dan awarded.</p></div></header><div className={baseStyles.promotionGrid}><div>{renderBeltSelector("currentBelt", form.currentBelt, "Current Belt")}{showCurrentDan ? <label><span>Current Dan *</span><select name="currentDanRank" value={form.currentDanRank} onChange={handleChange} required><option value="">Select Dan</option>{TAEKWONDO_DAN_RANKS.map((dan) => <option key={dan}>{dan}</option>)}</select></label> : null}</div><div className={baseStyles.promotionArrow}><ArrowRight size={20}/><span>Promotion</span></div><div>{renderBeltSelector("promotedToBelt", form.promotedToBelt, "Promoted To Belt")}{showPromotedDan ? <label><span>Promoted To Dan *</span><select name="promotedToDanRank" value={form.promotedToDanRank} onChange={handleChange} required><option value="">Select Dan</option>{TAEKWONDO_DAN_RANKS.map((dan, index) => <option key={dan} disabled={form.currentBelt === "Black" && index <= currentDanIndex}>{dan}</option>)}</select></label> : null}</div></div></section>

        <section className={baseStyles.section}><header><span>03</span><div><h2>Assessment Result</h2><p>Update test date, marks and final grading outcome.</p></div></header><div className={styles.assessmentPanel}><div className={baseStyles.assessmentGrid}><label><span>Test Date *</span><div className={`${baseStyles.iconInput} ${styles.iconControl}`}><CalendarDays size={15}/><input type="date" name="testDate" value={form.testDate} onChange={handleChange} required/></div></label><label><span>Marks Obtained</span><input type="number" min="0" step="0.01" name="marks" value={form.marks} onChange={handleChange} placeholder="Obtained marks"/></label><label><span>Total Marks</span><input type="number" min="0.01" step="0.01" name="outOf" value={form.outOf} onChange={handleChange} placeholder="Out of"/></label><div className={`${baseStyles.scoreBox} ${styles.scoreBox}`}><small>Live Score</small><strong>{score === null ? "—" : `${score}%`}</strong><span>{score === null ? "Add marks" : "Calculated"}</span></div></div><fieldset className={`${baseStyles.resultField} ${styles.resultField}`}><legend>Result *</legend><div>{[{ value: "pending", label: "Pending", icon: ClipboardCheck }, { value: "pass", label: "Pass", icon: BadgeCheck }, { value: "fail", label: "Fail", icon: X }].map(({ value, label, icon: Icon }) => <button key={value} type="button" className={form.result === value ? baseStyles[`result${label}`] : ""} onClick={() => update("result", value)}><span className={styles.resultIcon}><Icon size={16}/></span><span>{label}</span>{form.result === value ? <Check size={14}/> : null}</button>)}</div></fieldset></div></section>

        <section className={baseStyles.section}><header><span>04</span><div><h2>Examiner & Certification</h2><p>Update official assessment and certificate references.</p></div></header><div className={baseStyles.detailsGrid}><label><span>Examiner Name</span><div className={`${baseStyles.iconInput} ${styles.iconControl}`}><UserRound size={15}/><input name="examinerName" maxLength="100" value={form.examinerName} onChange={handleChange} placeholder="Examiner's full name"/></div></label><label><span>Certificate Number</span><div className={`${baseStyles.iconInput} ${styles.iconControl}`}><FileBadge2 size={15}/><input name="certificateNumber" maxLength="80" value={form.certificateNumber} onChange={handleChange} placeholder="Certificate reference"/></div></label><label className={baseStyles.fullWidth}><span>Certificate URL</span><input type="url" name="certificateUrl" maxLength="500" value={form.certificateUrl} onChange={handleChange} placeholder="https://..."/></label><label className={baseStyles.fullWidth}><span>Remarks</span><textarea name="remarks" maxLength="1000" value={form.remarks} onChange={handleChange} rows="4" placeholder="Assessment notes, strengths or areas for improvement..."/><small>{form.remarks.length}/1000</small></label></div></section>
      </main>

      <aside className={baseStyles.reviewCard}><header><span><Trophy size={20}/></span><div><small>Review changes</small><h2>Promotion Summary</h2></div></header>{student ? <div className={baseStyles.reviewStudent}><img src={getStudentPhotoUrl(student)} alt="" onError={(event) => { event.currentTarget.src = "/default-avatar.png"; }}/><div><strong>{getStudentName(student)}</strong><span>{getStudentCode(student)}</span><small>{student.batch?.batchName || "No batch"}</small></div></div> : null}<div className={baseStyles.rankPreview}><div><small>Current Rank</small><strong>{form.currentBelt || "Not selected"}</strong>{form.currentDanRank ? <span>{form.currentDanRank}</span> : null}</div><ArrowRight size={18}/><div><small>Promoted Rank</small><strong>{form.promotedToBelt || "Not selected"}</strong>{form.promotedToDanRank ? <span>{form.promotedToDanRank}</span> : null}</div></div><dl className={baseStyles.reviewDetails}><div><dt>Test Date</dt><dd>{form.testDate ? new Date(`${form.testDate}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not selected"}</dd></div><div><dt>Score</dt><dd>{score === null ? "Not added" : `${form.marks}/${form.outOf} · ${score}%`}</dd></div><div><dt>Result</dt><dd className={baseStyles[`summary${form.result.charAt(0).toUpperCase()}${form.result.slice(1)}`]}>{form.result}</dd></div><div><dt>Changes</dt><dd className={isDirty ? styles.unsaved : styles.saved}>{isDirty ? "Unsaved" : "No changes"}</dd></div></dl><button className={baseStyles.submitButton} type="submit" disabled={saving || !isDirty}><Award size={17}/>{saving ? "Updating Record..." : "Update Belt Test"}<ArrowRight size={16}/></button><button className={baseStyles.resetButton} type="button" onClick={resetForm} disabled={saving || !isDirty}><RotateCcw size={15}/>Discard Changes</button><Link className={styles.historyLink} to={`/students/${student?._id}/belt-history`}><History size={15}/>View Complete History</Link><footer><Sparkles size={15}/><span><strong>Student rank sync</strong>A passed result updates the student's current belt and Dan rank.</span></footer></aside>
    </form> : <div className={styles.notFound}><ShieldCheck size={28}/><h2>Record unavailable</h2><p>{error || "This belt test could not be loaded."}</p><Link to="/belt-tests">Return to Belt Test Records</Link></div>}

    {showPhotoModal && student ? <div className={baseStyles.modalBackdrop} onClick={() => setShowPhotoModal(false)}><div className={baseStyles.photoModal} onClick={(event) => event.stopPropagation()}><header><div><small>Student profile</small><h2>{getStudentName(student)}</h2><p>{getStudentCode(student)}</p></div><button type="button" onClick={() => setShowPhotoModal(false)}><X size={18}/></button></header><img src={getStudentPhotoUrl(student)} alt={getStudentName(student)} onError={(event) => { event.currentTarget.src = "/default-avatar.png"; }}/><Link to={`/students/${student._id}`}>View Student Profile<ArrowRight size={15}/></Link></div></div> : null}
  </div>;
};

export default EditBeltTest;
