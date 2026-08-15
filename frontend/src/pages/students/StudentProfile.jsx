import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity, ArrowLeft, Award, BadgeIndianRupee, BookOpen, CalendarCheck2,
  CalendarDays, CheckCircle2, Clock3, Edit3, ExternalLink, GraduationCap,
  HeartPulse, IdCard, Mail, MapPin, Phone, ReceiptIndianRupee, Ruler,
  ShieldCheck, ShieldPlus, UserRound, UsersRound, WalletCards, Weight, XCircle,
} from "lucide-react";

import { studentApi } from "../../api/studentApi.js";
import MetricGrid from "../../components/common/MetricGrid.jsx";
import PageState from "../../components/common/PageState.jsx";
import BatchAcademyHeader from "../batches/components/BatchAcademyHeader.jsx";
import BatchDetailSectionHeader from "../batches/components/BatchDetailSectionHeader.jsx";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";
import "./StudentProfile.module.css";

const text = (value, fallback = "Not added") => String(value ?? "").trim() || fallback;
const studentName = (student) => text(
  [student?.firstName, student?.lastName].filter(Boolean).join(" ") || student?.name,
  "Student"
);
const formatDate = (value) => {
  if (!value) return "Not added";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not added"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const formatPhone = (countryCode, phone) =>
  String(phone || "").trim() ? `${countryCode || "+91"} ${phone}` : "Not added";
const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const calculateAge = (value) => {
  const birth = value ? new Date(value) : null;
  if (!birth || Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};
const normalizeList = (value) => {
  if (Array.isArray(value)) return value.flatMap(normalizeList);
  if (typeof value !== "string" || !value.trim()) return [];
  try { return normalizeList(JSON.parse(value)); }
  catch { return value.split(",").map((item) => item.trim()).filter(Boolean); }
};
const normalizeContacts = (contacts, legacy) => {
  const list = Array.isArray(contacts) ? contacts.filter((item) => item?.name || item?.phone) : [];
  return list.length ? list : (legacy?.name || legacy?.phone ? [legacy] : []);
};
const normalizePhones = (student) => {
  const stored = Array.isArray(student?.phoneNumbers) ? student.phoneNumbers.filter((item) => item?.phone) : [];
  if (stored.length) return stored;
  return student?.phone ? [{ countryCode: student.countryCode || "+91", phone: student.phone }] : [];
};
const beltLabel = (student) =>
  student?.beltRank === "Black" && student?.danRank
    ? `Black · ${student.danRank}`
    : text(student?.beltRank);
const joinAddress = (student) =>
  [student?.address, student?.city, student?.state, student?.country]
    .map((part) => String(part || "").trim()).filter(Boolean)
    .filter((part, index, items) => items.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index)
    .join(", ");

const DetailItem = ({ icon: Icon, label, children, wide = false, accent = false }) => (
  <div className={`student-detail-item${wide ? " student-detail-item--wide" : ""}${accent ? " student-detail-item--accent" : ""}`}>
    <span className="student-detail-item__icon"><Icon size={17} aria-hidden="true" /></span>
    <div><small>{label}</small><strong>{children}</strong></div>
  </div>
);

const ContactCard = ({ title, eyebrow, contact }) => (
  <article className="student-detail-contact">
    <div className="student-detail-contact__title">
      <span><UserRound size={18} /></span>
      <div><small>{eyebrow}</small><h3>{title}</h3></div>
    </div>
    <dl>
      <div><dt>Name</dt><dd>{text(contact?.name)}</dd></div>
      <div><dt>Relation</dt><dd>{text(contact?.relation)}</dd></div>
      <div><dt>Mobile</dt><dd>{formatPhone(contact?.countryCode, contact?.phone)}</dd></div>
    </dl>
  </article>
);

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await studentApi.getById(id);
      const payload = response?.data;
      setStudent(payload?.data?.student || payload?.data || payload?.student || payload || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load student.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const parents = useMemo(() => normalizeContacts(student?.parentContacts, {
    name: student?.parentName,
    countryCode: student?.parentCountryCode,
    phone: student?.parentPhone,
    relation: "Parent / Guardian",
  }), [student]);
  const emergencyContacts = useMemo(() => normalizeContacts(student?.emergencyContacts, {
    name: student?.emergencyContact?.name || student?.emergencyContactName,
    countryCode: student?.emergencyContact?.countryCode || student?.emergencyContactCountryCode,
    phone: student?.emergencyContact?.phone || student?.emergencyContactPhone,
    relation: "Emergency Contact",
  }), [student]);
  const conditions = useMemo(
    () => normalizeList(student?.medicalConditions || student?.medicalInfo?.medicalConditions),
    [student]
  );
  const phones = useMemo(() => normalizePhones(student), [student]);

  if (loading) return <PageState className="student-detail-state" loading title="Loading student profile…" />;
  if (error || !student) return <PageState className="student-detail-state student-detail-state--error" icon={XCircle} title={error || "Student not found."} action={<button className="btn btn-primary" type="button" onClick={loadPage}>Try Again</button>} />;

  const name = studentName(student);
  const age = student.age ?? calculateAge(student.dateOfBirth || student.dob);
  const status = String(student.status || "inactive").toLowerCase();
  const active = status === "active";
  const branchName = student.branch?.branchName || "Not assigned";
  const batchName = student.batch?.batchName || "Not assigned";
  const height = student.heightCm ?? student.physicalInfo?.heightCm;
  const weight = student.weightKg ?? student.physicalInfo?.weightKg;
  const address = joinAddress(student);

  return (
    <div className="page student-detail-page">
      <BatchAcademyHeader branch={student.branch || null} />

      <nav className="student-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/students">Students</Link><span>/</span><strong>{name}</strong>
      </nav>

      <header className="student-detail-heading">
        <div className="student-detail-heading__title">
          <span><UserRound size={25} /></span>
          <div>
            <div className="student-detail-heading__name-row">
              <h1>{name}</h1>
              <div className="student-detail-heading__badges">
                <code>{text(student.admissionNumber || student.studentCode, "No code")}</code>
                {student.beltRank ? <b><Award size={13} /> {beltLabel(student)}</b> : null}
                <i className={active ? "is-active" : "is-inactive"}>{active ? "Active" : text(student.status, "Inactive")}</i>
              </div>
            </div>
            <p>Complete student identity, training, health and academy activity profile.</p>
          </div>
        </div>
        <div className="student-detail-heading__actions">
          <Link className="btn btn-outline" to="/students"><ArrowLeft size={16} /> Back</Link>
          <Link className="btn btn-primary" to={`/students/${student._id}/edit`}><Edit3 size={16} /> Edit Student</Link>
        </div>
      </header>

      <MetricGrid className="student-detail-metrics" items={[
        { id: "status", icon: CheckCircle2, label: "Student Status", value: active ? "Active" : text(student.status, "Inactive") },
        { id: "age", className: "is-blue", icon: CalendarDays, label: "Current Age", value: age === null ? "—" : `${age} Years` },
        { id: "category", className: "is-purple", icon: GraduationCap, label: "Age Category", value: text(student.ageCategory) },
        { id: "belt", className: "is-orange", icon: Award, label: "Belt Rank", value: beltLabel(student) },
        { id: "batch", className: "is-green", icon: UsersRound, label: "Assigned Batch", value: batchName },
      ]} getCardProps={() => ({ iconSize: 21 })} />

      <section className="student-detail-card student-detail-basic-card">
        <BatchDetailSectionHeader
          icon={IdCard}
          eyebrow="Identity"
          title="Basic Information"
          description="Student identity, admission and membership details."
          action={<div className="student-detail-basic-assignments">
            <div><small>Branch</small><strong>{branchName}</strong></div>
            <div><small>Batch</small><strong>{batchName}</strong></div>
            <div className={active ? "is-active" : "is-inactive"}><small>Status</small><strong><CheckCircle2 size={14} />{active ? "Active Student" : text(student.status, "Inactive Student")}</strong></div>
          </div>}
        />
        <div className="student-detail-basic-layout">
          <div className="student-detail-items student-detail-basic-fields">
            <DetailItem icon={UserRound} label="Full Name">{name}</DetailItem>
            <DetailItem icon={IdCard} label="Admission Number">{text(student.admissionNumber || student.studentCode)}</DetailItem>
            <DetailItem icon={ShieldCheck} label="Aadhaar Number">{text(student.aadhaarNumber)}</DetailItem>
            <DetailItem icon={UserRound} label="Gender">{text(student.gender)}</DetailItem>
            <DetailItem icon={CalendarCheck2} label="Joining Date">{formatDate(student.joiningDate)}</DetailItem>
            <DetailItem icon={CalendarDays} label="Date of Birth">{formatDate(student.dateOfBirth || student.dob)}</DetailItem>
            <DetailItem icon={CalendarDays} label="Age">{age === null ? "Not added" : `${age} Years`}</DetailItem>
            <DetailItem icon={GraduationCap} label="Age Category">{text(student.ageCategory)}</DetailItem>
            <DetailItem icon={BookOpen} label="School Name">{text(student.schoolName || student.education?.schoolName)}</DetailItem>
            <DetailItem icon={GraduationCap} label="Class">{text(student.className || student.education?.className)}</DetailItem>
            <DetailItem icon={GraduationCap} label="Company / Firm Name">{text(student.collegeName || student.education?.collegeName)}</DetailItem>
            <DetailItem icon={UserRound} label="Occupation">{text(student.occupation || student.education?.occupation)}</DetailItem>
          </div>
          <aside className="student-detail-basic-photo">
            <img src={getStudentPhotoUrl(student)} alt={name} onError={(event) => { event.currentTarget.src = "/default-avatar.png"; }} />
            <span className={active ? "is-active" : "is-inactive"}>{active ? "Active Student" : text(student.status, "Inactive")}</span>
            <small>Student Profile</small><h2>{name}</h2>
            <code>{text(student.admissionNumber || student.studentCode, "No admission code")}</code>
          </aside>
        </div>
      </section>

      <section className="student-detail-card">
        <BatchDetailSectionHeader icon={MapPin} eyebrow="Contact" title="Contact & Location" description="Primary contact and residential location." />
        <div className="student-detail-items">
          {phones.length
            ? phones.map((item, index) => <DetailItem key={`${item.countryCode}-${item.phone}-${index}`} icon={Phone} label={index === 0 ? "Student Phone" : `Additional Phone ${index + 1}`}>{formatPhone(item.countryCode, item.phone)}</DetailItem>)
            : <DetailItem icon={Phone} label="Student Phone">Not added</DetailItem>}
          <DetailItem icon={Mail} label="Email">{text(student.email)}</DetailItem>
          <DetailItem icon={MapPin} label="Country">{text(student.country)}</DetailItem>
          <DetailItem icon={MapPin} label="State">{text(student.state)}</DetailItem>
          <DetailItem icon={MapPin} label="District">{text(student.city)}</DetailItem>
          <DetailItem icon={MapPin} label="Address" wide>{address || "Not added"}</DetailItem>
        </div>
      </section>

      <div className="student-detail-primary-grid">
        <section className="student-detail-card">
          <BatchDetailSectionHeader icon={UserRound} eyebrow="Guardian" title="Parent Contact" description="Parent or guardian contact details." />
          <div className="student-detail-contact-grid student-detail-contact-grid--single">
            {parents.map((contact, index) => <ContactCard key={`parent-${index}`} title={parents.length > 1 ? `Parent / Guardian ${index + 1}` : "Parent / Guardian"} eyebrow="Guardian" contact={contact} />)}
          </div>
          {!parents.length ? <p className="student-detail-empty-note">No parent or guardian contact added.</p> : null}
        </section>

        <section className="student-detail-card">
          <BatchDetailSectionHeader icon={ShieldPlus} eyebrow="Safety" title="Emergency Contact" description="Contacts to use in an urgent situation." />
          <div className="student-detail-contact-grid student-detail-contact-grid--single">
            {emergencyContacts.map((contact, index) => <ContactCard key={`emergency-${index}`} title={emergencyContacts.length > 1 ? `Emergency Contact ${index + 1}` : "Emergency Contact"} eyebrow="Safety" contact={contact} />)}
          </div>
          {!emergencyContacts.length ? <p className="student-detail-empty-note">No emergency contact added.</p> : null}
        </section>
      </div>

      <div className="student-detail-primary-grid">
        <section className="student-detail-card">
          <BatchDetailSectionHeader icon={Award} eyebrow="Training" title="Training Information" description="Martial art, belt and rank assignment." />
          <div className="student-detail-items">
            <DetailItem icon={Activity} label="Martial Art / Sport">{text(student.martialArt)}</DetailItem>
            <DetailItem icon={Award} label="Belt Rank" accent>{beltLabel(student)}</DetailItem>
            {student.beltRank === "Black" ? <DetailItem icon={ShieldPlus} label="Dan Rank">{text(student.danRank)}</DetailItem> : null}
          </div>
        </section>

        <section className="student-detail-card">
          <BatchDetailSectionHeader icon={HeartPulse} eyebrow="Health" title="Medical Information" description="Health details important for safe training." />
          <div className="student-detail-items">
            <DetailItem icon={Ruler} label="Height">{height ? `${height} cm` : "Not added"}</DetailItem>
            <DetailItem icon={Weight} label="Weight">{weight ? `${weight} kg` : "Not added"}</DetailItem>
            <DetailItem icon={HeartPulse} label="Blood Group" accent>{text(student.bloodGroup || student.medicalInfo?.bloodGroup)}</DetailItem>
          </div>
          <div className="student-detail-tags">
            {conditions.length ? conditions.map((condition) => <span key={condition}><HeartPulse size={13} />{condition}</span>) : <p>No medical conditions added.</p>}
          </div>
          <div className="student-detail-items student-detail-items--notes">
            <DetailItem icon={Activity} label="Medical Notes" wide>{text(student.notes || student.medicalInfo?.notes)}</DetailItem>
          </div>
        </section>
      </div>

      <div className="student-detail-secondary-grid">
        <section className="student-detail-card">
          <BatchDetailSectionHeader icon={WalletCards} eyebrow="Finance" title="Student Fee Setup" description="Fee, scholarship and discount configuration." />
          <div className="student-detail-items">
            <DetailItem icon={BadgeIndianRupee} label="Monthly Fee" accent>{currency(student.monthlyFeeOverride)}</DetailItem>
            <DetailItem icon={CalendarDays} label="Fee Due Day">{student.feeDueDay ? `Day ${student.feeDueDay}` : "Not added"}</DetailItem>
            <DetailItem icon={BadgeIndianRupee} label="Scholarship" accent>{currency(student.scholarshipAmount)}</DetailItem>
            <DetailItem icon={ReceiptIndianRupee} label="Discount">{Number(student.discountPercent || 0)}%</DetailItem>
          </div>
          <div className="student-detail-card-action">
            <Link className="btn btn-outline" to={`/fees/student/${student._id}`}>Fee History <ExternalLink size={14} /></Link>
            <Link className="btn btn-primary" to={`/fees/collect?student=${student._id}`}><BadgeIndianRupee size={15} /> Collect Fee</Link>
          </div>
        </section>

        <section className="student-detail-card student-detail-quick-links">
          <BatchDetailSectionHeader icon={ExternalLink} eyebrow="Activity" title="Quick Links" description="Open student records and academy workflows." />
          <div className="student-detail-link-grid">
            {[
              [CalendarCheck2, "Attendance History", `/attendance/student/${student._id}`],
              [WalletCards, "Fee History", `/fees/student/${student._id}`],
              [Award, "Belt History", `/students/${student._id}/belt-history`],
              [Award, "Championship History", `/students/${student._id}/championship-history`],
              [Activity, "Tournament History", `/students/${student._id}/tournament-history`],
              [Clock3, "Progress Timeline", `/students/${student._id}/timeline`],
              [IdCard, "ID Cards", `/students/${student._id}/id-cards`],
              [GraduationCap, "Certificates", `/students/${student._id}/certificates`],
            ].map(([Icon, label, href]) => <Link key={label} to={href}><Icon size={16} /><span>{label}</span><ExternalLink size={13} /></Link>)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentProfile;