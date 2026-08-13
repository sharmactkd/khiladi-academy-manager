import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeIndianRupee, CalendarDays, CheckCircle2, Clock3, Dumbbell, Edit3, ExternalLink, GraduationCap, Languages, Link2, MapPin, Plus, ShieldCheck, Target, UserRound, UsersRound, WalletCards, XCircle } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { studentApi } from "../../api/studentApi.js";
import MetricGrid from "../../components/common/MetricGrid.jsx";
import PageState from "../../components/common/PageState.jsx";
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

const ResourceLink = ({ href, label }) => href ? (
  <a href={href} target="_blank" rel="noreferrer"><Link2 size={16} /><span>{label}</span><ExternalLink size={14} /></a>
) : <span><Link2 size={16} /><span>{label} not added</span></span>;

const BatchDetail = () => {
  const { id } = useParams();
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
  const languages = useMemo(() => normalizeList(batch?.batchLanguages, batch?.batchLanguage), [batch?.batchLanguages, batch?.batchLanguage]);

  if (loading) return <PageState className="batch-detail-state" loading title="Loading batch profile…" />;
  if (error || !batch) return <PageState className="batch-detail-state batch-detail-state--error" icon={XCircle} title={error || "Batch not found."} action={<button className="btn btn-primary" type="button" onClick={loadPage}>Try Again</button>} />;

  const count = students.length || batch.students?.length || 0;
  const capacity = Number(batch.capacity || batch.maxStudents || 0);
  const seats = availableSeats(capacity, count);
  const firstSchedule = schedules[0] || {};
  const type = formatBatchLabel(firstValue(batch.batchType, batch.batchTypes));
  const level = formatBatchLabel(firstValue(batch.skillLevel, batch.skillLevels));
  const sport = firstValue(batch.martialArt, batch.martialArts);
  const mode = formatBatchLabel(firstValue(batch.mode, batch.modes));
  const slot = formatBatchLabel(firstValue(batch.sessionSlot, batch.sessionSlots));
  const branchName = batch.branch?.branchName || batch.branch?.branchCode || "Not assigned";

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
        { id: "time", className: "is-blue", icon: Clock3, label: "Training Time", value: `${formatBatchTime(firstSchedule.startTime)} – ${formatBatchTime(firstSchedule.endTime)}` },
        { id: "fee", className: "is-orange", icon: BadgeIndianRupee, label: "Monthly Fee", value: currency(batch.monthlyFee) },
        { id: "level", className: "is-purple", icon: GraduationCap, label: "Skill Level", value: level },
      ]} getCardProps={() => ({ iconSize: 21 })} />

      <div className="batch-detail-primary-grid">
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={Dumbbell} eyebrow="Identity" title="Batch Information" description="Core training profile and operating setup." /><div className="batch-detail-items">
          <DetailItem icon={Dumbbell} label="Batch Type">{type}</DetailItem><DetailItem icon={GraduationCap} label="Skill Level">{level}</DetailItem>
          <DetailItem icon={Target} label="Martial Art / Sport">{sport}</DetailItem><DetailItem icon={UsersRound} label="Gender Group">{formatGenderGroup(batch.genderGroup)}</DetailItem>
          <DetailItem icon={ShieldCheck} label="Training Mode">{mode}</DetailItem><DetailItem icon={Clock3} label="Session Slot">{slot}</DetailItem>
          <DetailItem icon={MapPin} label="Branch">{branchName}</DetailItem><DetailItem icon={MapPin} label="Venue / Hall">{displayValue(batch.venue)}</DetailItem>
          <DetailItem icon={Target} label="Batch Color Tag">{displayValue(batch.batchColor)}</DetailItem><DetailItem icon={Target} label="Competition Batch">{batch.isCompetitionBatch ? "Yes" : "No"}</DetailItem>
          <DetailItem icon={Link2} label="Notes" wide>{displayValue(batch.notes)}</DetailItem>
        </div></section>

        <section className="batch-detail-card"><BatchDetailSectionHeader icon={CalendarDays} eyebrow="Timetable" title="Training Schedule" description="Weekly training days and session timings." /><div className="batch-detail-schedule">
          {schedules.length ? schedules.map((item, index) => <div key={`${item.day}-${index}`}><span><CalendarDays size={16} /></span><strong>{formatBatchLabel(item.day)}</strong><time><Clock3 size={14} />{formatBatchTime(item.startTime)} – {formatBatchTime(item.endTime)}</time></div>) : <p>No training schedule added.</p>}
        </div></section>
      </div>

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={UsersRound} eyebrow="Team" title="Coaches in Charge" description="Primary and supporting coaching team." /><div className="batch-detail-coach-grid">
        <CoachCard title="Head Coach" name={batch.headCoachName || batch.coach?.name} countryCode={batch.headCoachCountryCode} phone={batch.headCoachPhone} achievements={batch.headCoachAchievements} />
        <CoachCard title="Assistant Coach" name={batch.assistantCoachName} countryCode={batch.assistantCoachCountryCode} phone={batch.assistantCoachPhone} achievements={batch.assistantCoachAchievements} />
        {extraCoaches.map((coach, index) => <CoachCard key={`coach-${index}`} title={`Additional Coach ${index + 1}`} {...coach} />)}
      </div>{!extraCoaches.length ? <p className="batch-detail-empty-note">No additional coaches added.</p> : null}</section>

      <div className="batch-detail-secondary-grid">
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={Target} eyebrow="Eligibility" title="Capacity & Eligibility" description="Student limits, age range and belt requirements." /><div className="batch-detail-items">
          <DetailItem icon={UsersRound} label="Capacity">{capacity || "No limit"}</DetailItem><DetailItem icon={UsersRound} label="Current Students">{count}</DetailItem>
          <DetailItem icon={CheckCircle2} label="Available Seats">{seats}</DetailItem><DetailItem icon={GraduationCap} label="Minimum Age">{batch.minAge ?? "No limit"}</DetailItem>
          <DetailItem icon={GraduationCap} label="Maximum Age">{batch.maxAge ?? "No limit"}</DetailItem><DetailItem icon={ShieldCheck} label="Minimum Belt">{displayValue(batch.minBelt)}</DetailItem>
          <DetailItem icon={ShieldCheck} label="Maximum Belt">{displayValue(batch.maxBelt)}</DetailItem><DetailItem icon={Target} label="Minimum Attendance">{batch.minimumAttendancePercentage ?? 75}%</DetailItem>
        </div></section>
        <section className="batch-detail-card"><BatchDetailSectionHeader icon={WalletCards} eyebrow="Finance" title="Batch Fee Structure" description="Recurring and additional batch charges." /><div className="batch-detail-items">
          <DetailItem icon={BadgeIndianRupee} label="Monthly Fee" accent>{currency(batch.monthlyFee)}</DetailItem><DetailItem icon={BadgeIndianRupee} label="Quarterly Fee" accent>{currency(batch.quarterlyFee)}</DetailItem>
          <DetailItem icon={BadgeIndianRupee} label="Annual Fee" accent>{currency(batch.annualFee)}</DetailItem><DetailItem icon={BadgeIndianRupee} label="Registration Fee" accent>{currency(batch.registrationFee)}</DetailItem>
          <DetailItem icon={BadgeIndianRupee} label="Uniform Fee" accent>{currency(batch.uniformFee)}</DetailItem><DetailItem icon={BadgeIndianRupee} label="Examination Fee" accent>{currency(batch.examinationFee)}</DetailItem>
          <DetailItem icon={BadgeIndianRupee} label="Late Fee" accent>{currency(batch.lateFee)}</DetailItem><DetailItem icon={CalendarDays} label="Fee Due Day">Day {batch.feeDueDay || 10}</DetailItem>
        </div></section>
      </div>

      <section className="batch-detail-card"><BatchDetailSectionHeader icon={Languages} eyebrow="Communication" title="Languages & Online Links" description="Communication languages and batch resources." /><div className="batch-detail-communication">
        <div className="batch-detail-language-tags">{languages.length ? languages.map((item) => <span key={item}><Languages size={13} />{item}</span>) : <em>No languages added.</em>}</div>
        <div className="batch-detail-links"><ResourceLink href={batch.whatsappGroupLink} label="Open WhatsApp Group" /><ResourceLink href={batch.googleMeetLink} label="Open Google Meet" /></div>
      </div></section>

      <section className="batch-detail-card batch-detail-students"><div className="batch-detail-students__header"><div><span><UsersRound size={19} /></span><div><small>Students</small><h2>Students in this Batch</h2><p>Active students currently assigned to this batch.</p></div></div><Link to={`/attendance/batch/${batch._id}`}>Attendance History <ExternalLink size={14} /></Link></div>
        {!students.length ? <div className="batch-detail-students__empty"><UsersRound size={30} /><strong>No active students</strong><p>Add students to begin managing this batch.</p><Link className="btn btn-primary" to="/students/new"><Plus size={15} /> Add Student</Link></div> : <div className="batch-detail-table-wrap"><table className="batch-detail-table"><thead><tr><th>Code</th><th>Name</th><th>Phone</th><th>Belt</th><th>Monthly Fee</th></tr></thead><tbody>{students.map((student) => <tr key={student._id}><td><code>{student.studentCode || student.admissionNumber || "-"}</code></td><td><Link to={`/students/${student._id}`}>{getStudentName(student)}</Link></td><td>{student.phone || "-"}</td><td>{student.beltRank || "-"}</td><td><strong>{currency(batch.monthlyFee)}</strong></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
};

export default BatchDetail;