import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleDollarSign as BadgeIndianRupee, CalendarDays, CheckCircle2, Clock3, Dumbbell, Edit3, ExternalLink, FileText, GraduationCap, Hash, Languages, MapPin, MessageCircleMore, Plus, ShieldCheck, Target, UserRound, UsersRound, Video, WalletCards, XCircle } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { studentApi } from "../../api/studentApi.js";
import MetricGrid from "../../components/common/MetricGrid.jsx";
import PageState from "../../components/common/PageState.jsx";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import BatchAcademyHeader from "./components/BatchAcademyHeader.jsx";
import BatchDetailSectionHeader from "./components/BatchDetailSectionHeader.jsx";
import { currency, displayValue, formatBatchLabel, formatBatchTime, formatGenderGroup, normalizeList } from "./batch.utils.js";
import "./BatchDetail.module.css";

const getStudentName = (student) => student?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "-";
const availableSeats = (capacity, count) => Number(capacity || 0) ? Math.max(Number(capacity) - count, 0) : "No limit";
const firstValue = (...values) => {
  for (const value of values) {
    const list = normalizeList(value);
    if (list.length) return list[0];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "-";
};

const DetailItem = ({ icon: Icon, label, children, wide, accent }) => (
  <div className={`batch-detail-item${wide ? " batch-detail-item--wide" : ""}${accent ? " batch-detail-item--accent" : ""}`}>
    <span className="batch-detail-item__icon"><Icon size={17} /></span>
    <div><small>{label}</small><strong>{children}</strong></div>
  </div>
);

const CoachCard = ({ title, name, countryCode, phone, achievements }) => (
  <article className="batch-detail-coach">
    <div className="batch-detail-coach__title"><span><UserRound size={18} /></span><div><small>Coach</small><h3>{title}</h3></div></div>
    <dl>
      <div><dt>Name</dt><dd>{displayValue(name)}</dd></div>
      <div><dt>Mobile</dt><dd>{phone ? `${countryCode || "+91"} ${phone}` : "Not added"}</dd></div>
      <div className="batch-detail-coach__achievement"><dt>Achievements / Qualifications</dt><dd>{displayValue(achievements)}</dd></div>
    </dl>
  </article>
);

const ResourceLink = ({ href, label, icon: Icon }) => href ? (
  <a href={href} target="_blank" rel="noreferrer"><Icon size={17} /><span>{label}</span><ExternalLink size={14} /></a>
) : <span><Icon size={17} /><span>{label} not added</span></span>;

const listLabel = (...values) => {
  const list = [...new Set(values.flatMap((value) => normalizeList(value)))];
  return list.length ? list.map(formatBatchLabel).join(", ") : "Not added";
};

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [batchResult, studentResult] = await Promise.allSettled([batchApi.getById(id), studentApi.getAll({ batch: id, status: "active" })]);
      if (batchResult.status === "rejected") throw batchResult.reason;
      setBatch(batchResult.value?.data?.data || batchResult.value?.data || null);
      const response = studentResult.status === "fulfilled" ? studentResult.value : null;
      setStudents([response?.data?.data?.students, response?.data?.data, response?.data].find(Array.isArray) || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load batch.");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadPage(); }, [loadPage]);
  const schedules = useMemo(() => Array.isArray(batch?.schedule) ? batch.schedule : [], [batch?.schedule]);
  const extraCoaches = useMemo(() => Array.isArray(batch?.additionalCoaches) ? batch.additionalCoaches.filter((item) => item?.name || item?.phone || item?.achievements) : [], [batch?.additionalCoaches]);
  const languages = useMemo(() => [...new Set([batch?.batchLanguages, batch?.batchLanguage].flatMap((value) => normalizeList(value)))], [batch?.batchLanguages, batch?.batchLanguage]);
  const martialArts = useMemo(() => [...new Set([batch?.martialArts, batch?.martialArt].flatMap((value) => normalizeList(value)))], [batch?.martialArts, batch?.martialArt]);

  if (loading) return <PageState className="batch-detail-state" loading title="Loading batch profile…" />;
  if (error || !batch) return <PageState className="batch-detail-state batch-detail-state--error" icon={XCircle} title={error || "Batch not found."} action={<button className="btn btn-primary" type="button" onClick={loadPage}>Try Again</button>} />;

  const count = students.length || batch.students?.length || 0;
  const capacity = Number(batch.capacity || batch.maxStudents || 0);
  const seats = availableSeats(capacity, count);
  const firstSchedule = schedules[0] || {};
  const summerStartTime = firstSchedule.summerStartTime || firstSchedule.startTime;
  const summerEndTime = firstSchedule.summerEndTime || firstSchedule.endTime;
  const winterStartTime = firstSchedule.winterStartTime || firstSchedule.startTime;
  const winterEndTime = firstSchedule.winterEndTime || firstSchedule.endTime;
  const type = formatBatchLabel(firstValue(batch.batchType, batch.batchTypes));
  const level = formatBatchLabel(firstValue(batch.skillLevel, batch.skillLevels));
  const sport = firstValue(batch.martialArt, batch.martialArts);
  const mode = formatBatchLabel(firstValue(batch.mode, batch.modes));
  const slot = formatBatchLabel(firstValue(batch.sessionSlot, batch.sessionSlots));
  const branchName = batch.branch?.branchName || batch.branch?.branchCode || "Not assigned";
  const openStudent = (studentId) => navigate(`/students/${studentId}`);

  return (
    <div className="page batch-detail-page">
      <BatchAcademyHeader branch={batch.branch || null} />
      <nav className="batch-detail-breadcrumb"><Link to="/batches">Batches</Link><span>/</span><strong>{batch.batchName}</strong></nav>

      <header className="batch-detail-heading">
        <div className="batch-detail-heading__title"><span><Dumbbell size={25} /></span><div>
          <div className="batch-detail-heading__name-row"><h1>{batch.batchName}</h1><div className="batch-detail-heading__badges">
            <code>{displayValue(batch.batchCode, "No code")}</code>
            {batch.isCompetitionBatch ? <b><Target size={13} /> Competition</b> : null}
            <i className={batch.isActive !== false ? "is-active" : "is-inactive"}>{batch.isActive !== false ? "Active" : "Inactive"}</i>
          </div></div>
          <p>{sport} training batch at {branchName}.</p>
        </div></div>
        <div className="batch-detail-heading__actions"><Link className="btn btn-outline" to="/batches"><ArrowLeft size={16} /> Back</Link><Link className="btn btn-outline" to="/students/new"><Plus size={16} /> Add Student</Link><Link className="btn btn-primary" to={`/batches/${batch._id}/edit`}><Edit3 size={16} /> Edit Batch</Link></div>
      </header>

      <MetricGrid className="batch-detail-metrics" items={[
        { id: "students", icon: UsersRound, label: "Active Students", value: count },
        { id: "seats", className: "is-green", icon: CheckCircle2, label: "Available Seats", value: seats },
        { id: "time", className: "is-blue", icon: Clock3, label: "Summer / Winter Time", value: `${formatBatchTime(summerStartTime)} – ${formatBatchTime(summerEndTime)} / ${formatBatchTime(winterStartTime)} – ${formatBatchTime(winterEndTime)}` },
        { id: "fee", className: "is-orange", icon: BadgeIndianRupee, label: "Monthly Fee", value: currency(batch.monthlyFee, batch.branch) },
        { id: "level", className: "is-purple", icon: GraduationCap, label: "Skill Level", value: level },
      ]} getCardProps={() => ({ iconSize: 21 })} />

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={Hash} eyebrow="01 · Identity" title="Batch Identity" description="The same identity fields and order used on Add and Edit Batch." /><div className="batch-detail-items batch-detail-items--three">
        <DetailItem icon={Dumbbell} label="Batch Name">{displayValue(batch.batchName)}</DetailItem>
        <DetailItem icon={Hash} label="Batch Code">{displayValue(batch.batchCode)}</DetailItem>
        <DetailItem icon={MapPin} label="Branch">{branchName}</DetailItem>
        <DetailItem icon={CheckCircle2} label="Status">{batch.isActive !== false ? "Active Batch" : "Inactive Batch"}</DetailItem>
        <DetailItem icon={MapPin} label="Venue / Hall">{displayValue(batch.venue)}</DetailItem>
        <DetailItem icon={FileText} label="Notes">{displayValue(batch.notes)}</DetailItem>
      </div></section>

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={Dumbbell} eyebrow="02 · Training" title="Batch Training Profile" description="Gender, capacity, skill, batch type and sport configuration." /><div className="batch-detail-items batch-detail-items--three">
        <DetailItem icon={UsersRound} label="Gender Group">{formatGenderGroup(batch.genderGroup)}</DetailItem>
        <DetailItem icon={UsersRound} label="Minimum Age">{batch.noMinAgeLimit || batch.minAge == null ? "No limit" : batch.minAge}</DetailItem>
        <DetailItem icon={UsersRound} label="Maximum Age">{batch.noMaxAgeLimit || batch.maxAge == null ? "No limit" : batch.maxAge}</DetailItem>
        <DetailItem icon={UsersRound} label="Maximum Students">{capacity || "No limit"}</DetailItem>
        <DetailItem icon={GraduationCap} label="Skill Levels">{listLabel(batch.skillLevels, batch.skillLevel)}</DetailItem>
        <DetailItem icon={Dumbbell} label="Batch Types">{listLabel(batch.batchTypes, batch.batchType)}</DetailItem>
      </div></section>

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={CalendarDays} eyebrow="03 · Timing" title="Training Schedule" description="Weekly training days with separate Summer and Winter timings." /><div className="batch-detail-schedule-summary">
        <DetailItem icon={Clock3} label="Session Slot">{slot}</DetailItem><DetailItem icon={ShieldCheck} label="Mode">{mode}</DetailItem>
      </div><div className="batch-detail-schedule">
          {schedules.length ? schedules.map((item, index) => <div key={`${item.day}-${index}`}><span><CalendarDays size={16} /></span><strong>{formatBatchLabel(item.day)}</strong><div className="batch-detail-season-times"><time><b>Summer</b><Clock3 size={14} />{formatBatchTime(item.summerStartTime || item.startTime)} – {formatBatchTime(item.summerEndTime || item.endTime)}</time><time><b>Winter</b><Clock3 size={14} />{formatBatchTime(item.winterStartTime || item.startTime)} – {formatBatchTime(item.winterEndTime || item.endTime)}</time></div></div>) : <p>No training schedule added.</p>}
        </div></section>

      <div className="batch-detail-secondary-grid">
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={Target} eyebrow="04 · Students" title="Capacity & Eligibility" description="The same belt eligibility used on Add and Edit Batch." /><div className="batch-detail-items">
          <DetailItem icon={ShieldCheck} label="Minimum Belt">{batch.noMinBeltLimit || !batch.minBelt ? "No limit" : batch.minBelt}</DetailItem>
          <DetailItem icon={ShieldCheck} label="Maximum Belt">{batch.noMaxBeltLimit || !batch.maxBelt ? "No limit" : batch.maxBelt}</DetailItem>
        </div></section>
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={WalletCards} eyebrow="05 · Finance" title="Batch Fee Structure" description="The same charges and order used on Add and Edit Batch." /><div className="batch-detail-items">
          <DetailItem icon={BadgeIndianRupee} label="Monthly Fee" accent>{currency(batch.monthlyFee, batch.branch)}</DetailItem><DetailItem icon={BadgeIndianRupee} label="Quarterly Fee" accent>{currency(batch.quarterlyFee, batch.branch)}</DetailItem>
          <DetailItem icon={BadgeIndianRupee} label="Annual Fee" accent>{currency(batch.annualFee, batch.branch)}</DetailItem><DetailItem icon={BadgeIndianRupee} label="Registration Fee" accent>{currency(batch.registrationFee, batch.branch)}</DetailItem>
          <DetailItem icon={BadgeIndianRupee} label="Examination Fee" accent>{currency(batch.examinationFee, batch.branch)}</DetailItem><DetailItem icon={BadgeIndianRupee} label="Late Fee" accent>{currency(batch.lateFee, batch.branch)}</DetailItem>
        </div></section>
      </div>

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={UsersRound} eyebrow="06 · Team" title="Coaches & Batch In-charge" description="Primary and supporting coaching team." /><div className="batch-detail-coach-grid">
        <CoachCard title="Head Coach / Batch In-charge" name={batch.headCoachName || batch.coach?.name} countryCode={batch.headCoachCountryCode} phone={batch.headCoachPhone} achievements={batch.headCoachAchievements} />
        <CoachCard title="Assistant Coach" name={batch.assistantCoachName} countryCode={batch.assistantCoachCountryCode} phone={batch.assistantCoachPhone} achievements={batch.assistantCoachAchievements} />
        {extraCoaches.map((coach, index) => <CoachCard key={`coach-${index}`} title={`Additional Coach ${index + 1}`} {...coach} />)}
      </div>{!extraCoaches.length ? <p className="batch-detail-empty-note">No additional coaches added.</p> : null}</section>

      <div className="batch-detail-secondary-grid">
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={Dumbbell} eyebrow="07 · Training" title="Sports / Martial Arts" description="Training disciplines configured for this batch." /><div className="batch-detail-option-tiles">{martialArts.length ? <IconOptionGrid kind="sport" options={martialArts} interactive={false} /> : <p>No sports or martial arts added.</p>}</div></section>
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={Languages} eyebrow="08 · Communication" title="Languages Spoken" description="Languages supported by the batch coaching team." /><div className="batch-detail-option-tiles">{languages.length ? <IconOptionGrid kind="language" options={languages} interactive={false} /> : <p>No languages added.</p>}</div></section>
      </div>

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={MessageCircleMore} eyebrow="09 · Online" title="Links & Communication" description="Read-only WhatsApp and Google Meet resources." /><div className="batch-detail-links batch-detail-links--section"><ResourceLink href={batch.whatsappGroupLink} label="Open WhatsApp Group" icon={MessageCircleMore} /><ResourceLink href={batch.googleMeetLink} label="Open Google Meet" icon={Video} /></div></section>

      <section className="batch-detail-card batch-detail-students"><div className="batch-detail-students__header"><div><span><UsersRound size={19} /></span><div><small>Students</small><h2>Students in this Batch</h2><p>Active students currently assigned to this batch.</p></div></div><Link to={`/attendance/batch/${batch._id}`}>Attendance History <ExternalLink size={14} /></Link></div>
        {!students.length ? <div className="batch-detail-students__empty"><UsersRound size={30} /><strong>No active students</strong><p>Add students to begin managing this batch.</p><Link className="btn btn-primary" to="/students/new"><Plus size={15} /> Add Student</Link></div> : <div className="batch-detail-table-wrap"><table className="batch-detail-table"><thead><tr><th>Code</th><th>Name</th><th>Phone</th><th>Belt</th><th>Monthly Fee</th></tr></thead><tbody>{students.map((student) => <tr key={student._id} className="batch-detail-student-row" role="link" tabIndex={0} aria-label={`View ${getStudentName(student)} details`} title={`View ${getStudentName(student)} details`} onClick={() => openStudent(student._id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openStudent(student._id); } }}><td><code>{student.studentCode || student.admissionNumber || "-"}</code></td><td><Link to={`/students/${student._id}`}>{getStudentName(student)}</Link></td><td>{student.phone || "-"}</td><td>{student.beltRank || "-"}</td><td><strong>{currency(batch.monthlyFee, batch.branch)}</strong></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
};

export default BatchDetail;
