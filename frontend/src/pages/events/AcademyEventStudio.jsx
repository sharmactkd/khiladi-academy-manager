import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Award, Banknote, CalendarDays, Check, CheckCircle2, ChevronDown,
  CircleDollarSign, ClipboardCheck, Coins, CreditCard, Filter, Flag, Medal,
  Plus, ReceiptText, Save, Search, ShieldCheck, Trash2, Trophy, UserPlus,
  Users, WalletCards, X,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { academyEventApi } from "../../api/academyEventApi.js";
import { getBranches } from "../../api/branchApi.js";
import { studentApi } from "../../api/studentApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { currencyMeta, formatMoney } from "../../utils/currency.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import styles from "./AcademyEventStudio.module.css";

const BELTS = ["White", "Yellow", "Green", "Blue", "Red", "Black"];
const DAN_RANKS = ["1st Dan", "2nd Dan", "3rd Dan", "4th Dan", "5th Dan", "6th Dan", "7th Dan", "8th Dan", "9th Dan", "10th Dan"];
const RESULTS = ["pending", "pass", "fail"];
const CHAMP_RESULTS = ["Participation", "Gold", "Silver", "Bronze", "Disqualified"];
const EVENT_TYPES = ["Kyorugi", "Fresher", "Tag Team", "Poomsae"];
const LEVELS = ["District", "Regional", "State", "National", "International"];
const AGE_CATEGORIES = ["Sub-Junior", "Cadet", "Junior", "Senior", "Under-14", "Under-17", "Under-19"];
const today = () => new Date().toISOString().slice(0, 10);
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const payloadOf = (response) => response?.data?.data || response?.data || response || {};
const listOf = (response, key) => {
  const data = response?.data;
  return [response, data, data?.data, data?.data?.[key], data?.[key]].find(Array.isArray) || [];
};
const nameOf = (student) => student?.name || [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
const codeOf = (student) => student?.admissionNumber || student?.studentCode || "No admission number";
const idOf = (value) => String(value?._id || value || "");
const addressOf = (value) => [value?.address, value?.city, value?.state, value?.country].map((part) => String(part || "").trim()).filter(Boolean).join(", ");

const participantDraft = (student, mode, defaultFee) => ({
  student: student._id,
  studentData: student,
  feeOverride: "",
  discount: 0,
  amountPaid: 0,
  paymentMode: "",
  feeNote: "",
  currentBelt: student.beltRank || "",
  currentDanRank: student.danRank || "",
  promotedToBelt: "",
  promotedToDanRank: "",
  result: "pending",
  marks: "",
  outOf: "",
  entries: mode === "championship" ? [{
    label: "Primary Entry",
    eventType: "Kyorugi",
    gender: student.gender || "Male",
    ageCategory: student.ageCategory || "Senior",
    beltCategory: student.beltRank || "",
    result: "Participation",
    entryFeeOverride: null,
    totalBouts: 0,
    bouts: [],
  }] : [],
  calculatedFee: Number(defaultFee || 0),
});

const AcademyEventStudio = ({ mode }) => {
  const eventType = mode === "belt" ? "belt_test" : "championship";
  const { eventId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const isDetail = Boolean(eventId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [expanded, setExpanded] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", branch: "", startDate: today(), endDate: today(), venue: "",
    organizer: "", examinerName: "", sport: "Taekwondo", level: "District",
    country: "India", state: "", city: "", notes: "", status: "open",
    defaultFee: "", additionalEntryFee: "", paymentDeadline: "",
  });

  const basePath = mode === "belt" ? "/belt-tests" : "/championship-records";
  const title = mode === "belt" ? "Belt Test" : "Championship";
  const EventIcon = mode === "belt" ? Award : Trophy;
  const mainBranch = branches.find((branch) => branch.isMainBranch) || branches[0];
  const selectedBranch = branches.find((branch) => idOf(branch) === form.branch) || mainBranch;
  const currency = currencyMeta(selectedBranch);
  const money = (value) => formatMoney(value, selectedBranch);
  const batches = useMemo(() => {
    const map = new Map();
    students.forEach((student) => { if (student.batch?._id) map.set(student.batch._id, student.batch); });
    return [...map.values()];
  }, [students]);
  const selectedIds = useMemo(() => new Set(selected.map((item) => idOf(item.student))), [selected]);
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) =>
      (!batchFilter || idOf(student.batch) === batchFilter) &&
      (!query || [nameOf(student), codeOf(student), student.phone, student.batch?.batchName].some((value) => String(value || "").toLowerCase().includes(query)))
    );
  }, [students, search, batchFilter]);
  const summary = useMemo(() => {
    const rows = isDetail ? participants : selected;
    return rows.reduce((result, participant) => {
      const base = participant.feeOverride === "" || participant.feeOverride === null || participant.feeOverride === undefined
        ? Number(event?.feeRules?.defaultFee ?? form.defaultFee ?? 0)
        : Number(participant.feeOverride || 0);
      const payable = participant.finalPayable ?? Math.max(base - Number(participant.discount || 0), 0);
      result.payable += Number(payable || 0);
      result.collected += Number(participant.amountPaid || 0);
      return result;
    }, { count: rows.length, payable: 0, collected: 0 });
  }, [event, form.defaultFee, isDetail, participants, selected]);

  useEffect(() => {
    let active = true;
    (async () => {
      const requests = [studentApi.getAll({}), academyApi.getMyAcademy(), getBranches({ status: "active" })];
      if (isDetail) requests.push(academyEventApi.getById(eventId));
      const results = await Promise.allSettled(requests);
      if (!active) return;
      if (results[0].status === "fulfilled") setStudents(listOf(results[0].value, "students"));
      else toast.error("Students could not be loaded");
      if (results[1].status === "fulfilled") setAcademy(payloadOf(results[1].value).academy || null);
      if (results[2].status === "fulfilled") {
        const list = results[2].value?.data?.data || results[2].value?.data || [];
        setBranches(Array.isArray(list) ? list : []);
      }
      if (isDetail && results[3]?.status === "fulfilled") {
        const data = payloadOf(results[3].value);
        if (data.event?.type !== eventType) {
          toast.error("This event does not belong to this module");
          navigate(basePath, { replace: true });
          return;
        }
        setEvent(data.event);
        setParticipants(data.participants || []);
        setForm((previous) => ({ ...previous, ...data.event, branch: idOf(data.event.branch), startDate: dateInput(data.event.startDate), endDate: dateInput(data.event.endDate), defaultFee: data.event.feeRules?.defaultFee ?? "", additionalEntryFee: data.event.feeRules?.additionalEntryFee ?? "", paymentDeadline: dateInput(data.event.feeRules?.paymentDeadline) }));
      } else if (isDetail && results[3]?.status === "rejected") toast.error(results[3].reason?.response?.data?.message || "Event could not be loaded");
      setLoading(false);
    })();
    return () => { active = false; };
  }, [basePath, eventId, eventType, isDetail, navigate]);

  useEffect(() => {
    if (isDetail || !students.length || selected.length) return;
    const requestedStudent = searchParams.get("student");
    if (!requestedStudent) return;
    const student = students.find((item) => idOf(item) === requestedStudent);
    if (student) setSelected([participantDraft(student, mode, form.defaultFee)]);
  }, [form.defaultFee, isDetail, mode, searchParams, selected.length, students]);

  useEffect(() => {
    if (!form.branch && branches.length) setForm((previous) => ({ ...previous, branch: idOf(mainBranch) }));
  }, [branches, form.branch, mainBranch]);

  const updateForm = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const toggleStudent = (student) => setSelected((current) => current.some((item) => idOf(item.student) === idOf(student))
    ? current.filter((item) => idOf(item.student) !== idOf(student))
    : [...current, participantDraft(student, mode, form.defaultFee)]);
  const updateSelected = (studentId, key, value) => setSelected((current) => current.map((item) => idOf(item.student) === studentId ? { ...item, [key]: value } : item));
  const selectVisible = () => setSelected((current) => {
    const map = new Map(current.map((item) => [idOf(item.student), item]));
    filteredStudents.forEach((student) => { if (!map.has(idOf(student))) map.set(idOf(student), participantDraft(student, mode, form.defaultFee)); });
    return [...map.values()];
  });

  const createEvent = async (eventObject) => {
    eventObject.preventDefault();
    if (!form.name.trim() || !form.startDate) return toast.error(`${title} name and date are required`);
    if (!selected.length) return toast.error("Select at least one participant");
    try {
      setSaving(true);
      const response = await academyEventApi.create({
        type: eventType, ...form,
        feeRules: { defaultFee: Number(form.defaultFee || 0), additionalEntryFee: Number(form.additionalEntryFee || 0), currencyCode: currency.code, currencySymbol: currency.symbol, paymentDeadline: form.paymentDeadline || null },
        participants: selected.map(({ studentData, calculatedFee, ...participant }) => participant),
        settings: mode === "championship" ? { championshipType: "Open" } : {},
      });
      const created = payloadOf(response).event;
      toast.success(`${title} event created with ${selected.length} participants`);
      navigate(`${basePath}/events/${created._id}`);
    } catch (error) { toast.error(error.response?.data?.message || "Event could not be created"); }
    finally { setSaving(false); }
  };

  const saveParticipant = async (participant) => {
    try {
      const response = await academyEventApi.updateParticipant(eventId, participant._id, participant);
      const updated = payloadOf(response).participant;
      setParticipants((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success(`${nameOf(updated.student)} updated`);
    } catch (error) { toast.error(error.response?.data?.message || "Participant could not be updated"); }
  };
  const updateParticipantLocal = (participantId, key, value) => setParticipants((current) => current.map((item) => item._id === participantId ? { ...item, [key]: value } : item));
  const updateEntryLocal = (participantId, entryIndex, key, value) => setParticipants((current) => current.map((item) => item._id !== participantId ? item : { ...item, entries: item.entries.map((entry, index) => index === entryIndex ? { ...entry, [key]: value } : entry) }));
  const addEntry = (participantId) => setParticipants((current) => current.map((item) => item._id !== participantId ? item : { ...item, entries: [...item.entries, { label: `Entry ${item.entries.length + 1}`, eventType: "Kyorugi", gender: item.student?.gender || "Male", ageCategory: item.student?.ageCategory || "Senior", beltCategory: item.student?.beltRank || "", result: "Participation", totalBouts: 0, bouts: [] }] }));
  const removeParticipant = async (participant) => {
    if (!window.confirm(`Remove ${nameOf(participant.student)} from this event?`)) return;
    try { await academyEventApi.removeParticipant(eventId, participant._id); setParticipants((current) => current.filter((item) => item._id !== participant._id)); toast.success("Participant removed"); }
    catch (error) { toast.error(error.response?.data?.message || "Participant could not be removed"); }
  };
  const finalize = async () => {
    if (!window.confirm(`Finalize this ${title}? Student history records will be generated and editing will be locked.`)) return;
    try { setSaving(true); await academyEventApi.finalize(eventId); toast.success(`${title} finalized successfully`); const refreshed = payloadOf(await academyEventApi.getById(eventId)); setEvent(refreshed.event); setParticipants(refreshed.participants || []); }
    catch (error) { toast.error(error.response?.data?.message || "Event could not be finalized"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={styles.loading}><span /><h2>Preparing {title} workspace…</h2></div>;

  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="academy-event-studio" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""} eyebrow={`${title} operations`} addressLabel={mainBranch?.branchName || "Main Branch"} address={addressOf(mainBranch) || addressOf(academy) || "Main branch address not available"} summaryItems={[{ key: "participants", icon: Users, value: summary.count, label: "Participants" }, { key: "payable", icon: Coins, value: money(summary.payable), label: "Expected" }, { key: "collected", icon: Banknote, value: money(summary.collected), label: "Collected" }]}/>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><span>/</span><Link to={basePath}>{title}s</Link><span>/</span><strong>{isDetail ? event?.name : `Create ${title}`}</strong></nav>
    <header className={styles.heading}><div><span><EventIcon size={26}/></span><div><small>{isDetail ? "Event command center" : "Bulk registration workflow"}</small><h1>{isDetail ? event?.name : `Create ${title} Event`}</h1><p>{isDetail ? "Manage participant fees, individual details and final results." : "Enter common details once, select multiple students and override only the exceptions."}</p></div></div><Link to={basePath}><ArrowLeft size={16}/>Back to records</Link></header>

    {!isDetail ? <form onSubmit={createEvent} className={styles.createGrid}>
      <main>
        <section className={styles.card}><header><span>01</span><div><small>Common information</small><h2>{title} Identity</h2><p>These details apply to every selected participant.</p></div></header><div className={styles.formGrid}>
          <label className={styles.full}><span>{title} Name *</span><input value={form.name} onChange={(eventObject) => updateForm("name", eventObject.target.value)} placeholder={`Official ${title.toLowerCase()} name`}/></label>
          <label><span>Branch</span><select value={form.branch} onChange={(eventObject) => updateForm("branch", eventObject.target.value)}>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.branchName}</option>)}</select></label>
          <label><span>Sport / Martial Art</span><input value={form.sport} onChange={(eventObject) => updateForm("sport", eventObject.target.value)}/></label>
          <label><span>{mode === "belt" ? "Test Date" : "Start Date"} *</span><input type="date" value={form.startDate} onChange={(eventObject) => { updateForm("startDate", eventObject.target.value); if (mode === "belt") updateForm("endDate", eventObject.target.value); }}/></label>
          {mode === "championship" ? <label><span>End Date</span><input type="date" value={form.endDate} min={form.startDate} onChange={(eventObject) => updateForm("endDate", eventObject.target.value)}/></label> : null}
          {mode === "championship" ? <label><span>Competition Level</span><select value={form.level} onChange={(eventObject) => updateForm("level", eventObject.target.value)}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label> : <label><span>Examiner</span><input value={form.examinerName} onChange={(eventObject) => updateForm("examinerName", eventObject.target.value)} placeholder="Examiner's full name"/></label>}
          <label><span>Venue</span><input value={form.venue} onChange={(eventObject) => updateForm("venue", eventObject.target.value)}/></label>
          <label><span>{mode === "belt" ? "Authority / Organizer" : "Organizer"}</span><input value={form.organizer} onChange={(eventObject) => updateForm("organizer", eventObject.target.value)}/></label>
        </div></section>

        <section className={styles.card}><header><span>02</span><div><small>Default with exceptions</small><h2>Fee Configuration</h2><p>Default fee applies automatically; individual overrides remain independent.</p></div></header><div className={styles.feeGrid}>
          <label><span>Default Fee</span><div><b>{currency.symbol}</b><input type="number" min="0" step="0.01" value={form.defaultFee} onChange={(eventObject) => updateForm("defaultFee", eventObject.target.value)}/></div></label>
          {mode === "championship" ? <label><span>Additional Entry Fee</span><div><b>{currency.symbol}</b><input type="number" min="0" step="0.01" value={form.additionalEntryFee} onChange={(eventObject) => updateForm("additionalEntryFee", eventObject.target.value)}/></div></label> : null}
          <label><span>Payment Deadline</span><input type="date" value={form.paymentDeadline} onChange={(eventObject) => updateForm("paymentDeadline", eventObject.target.value)}/></label>
          <article><CircleDollarSign size={20}/><div><small>Currency from branch</small><strong>{currency.code} · {currency.symbol}</strong></div></article>
        </div></section>

        <section className={styles.card}><header><span>03</span><div><small>Bulk registration</small><h2>Select Participants</h2><p>Search or filter students, then select everyone joining this event.</p></div><b className={styles.count}>{selected.length} selected</b></header>
          <div className={styles.studentTools}><label><Search size={16}/><input value={search} onChange={(eventObject) => setSearch(eventObject.target.value)} placeholder="Search name, code, phone or batch…"/></label><select value={batchFilter} onChange={(eventObject) => setBatchFilter(eventObject.target.value)}><option value="">All batches</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName}</option>)}</select><button type="button" onClick={selectVisible}><Check size={15}/>Select visible</button></div>
          <div className={styles.studentGrid}>{filteredStudents.map((student) => { const checked = selectedIds.has(idOf(student)); return <button key={student._id} type="button" className={checked ? styles.selectedStudent : ""} onClick={() => toggleStudent(student)}><span className={styles.check}>{checked ? <Check size={14}/> : null}</span><img src={getStudentPhotoUrl(student)} alt=""/><span><strong>{nameOf(student)}</strong><small>{codeOf(student)}</small><small>{student.batch?.batchName || "No batch"} · {student.beltRank || "No belt"}</small></span></button>; })}</div>
        </section>

        {selected.length ? <section className={styles.card}><header><span>04</span><div><small>Only edit exceptions</small><h2>Participant Fee Overrides</h2><p>Leave Custom Fee blank to continue using the event default.</p></div></header><div className={styles.overrideList}>{selected.map((participant) => <article key={idOf(participant.student)}><div className={styles.person}><img src={getStudentPhotoUrl(participant.studentData)} alt=""/><span><strong>{nameOf(participant.studentData)}</strong><small>{participant.studentData.batch?.batchName || "No batch"}</small></span></div><label><span>Custom Fee</span><div><b>{currency.symbol}</b><input type="number" min="0" step="0.01" value={participant.feeOverride} onChange={(eventObject) => updateSelected(idOf(participant.student), "feeOverride", eventObject.target.value)} placeholder={String(form.defaultFee || 0)}/></div></label><label><span>Discount</span><div><b>{currency.symbol}</b><input type="number" min="0" step="0.01" value={participant.discount} onChange={(eventObject) => updateSelected(idOf(participant.student), "discount", eventObject.target.value)}/></div></label><strong className={styles.payable}>{money(Math.max(Number(participant.feeOverride === "" ? form.defaultFee : participant.feeOverride || 0) - Number(participant.discount || 0), 0))}</strong><button type="button" className={styles.remove} onClick={() => toggleStudent(participant.studentData)}><Trash2 size={15}/></button></article>)}</div></section> : null}
      </main>
      <aside className={styles.review}><header><span><ClipboardCheck size={21}/></span><div><small>Review & create</small><h2>Event Summary</h2></div></header><dl><div><dt>Event</dt><dd>{form.name || "Not added"}</dd></div><div><dt>Date</dt><dd>{form.startDate || "Not added"}</dd></div><div><dt>Participants</dt><dd>{selected.length}</dd></div><div><dt>Default Fee</dt><dd>{money(form.defaultFee || 0)}</dd></div><div className={styles.total}><dt>Expected Collection</dt><dd>{money(summary.payable)}</dd></div></dl><div className={styles.notice}><ShieldCheck size={18}/><p><strong>Safe default fee</strong>Participant overrides are stored as snapshots, so historical records stay accurate.</p></div><button type="submit" disabled={saving}><UserPlus size={17}/>{saving ? "Creating Event…" : `Create ${title} Event`}</button></aside>
    </form> : <EventDetail mode={mode} event={event} participants={participants} setParticipants={setParticipants} expanded={expanded} setExpanded={setExpanded} currency={currency} money={money} updateLocal={updateParticipantLocal} updateEntry={updateEntryLocal} addEntry={addEntry} saveParticipant={saveParticipant} removeParticipant={removeParticipant} finalize={finalize} saving={saving}/>} 
  </div>;
};

const EventDetail = ({ mode, event, participants, expanded, setExpanded, currency, money, updateLocal, updateEntry, addEntry, saveParticipant, removeParticipant, finalize, saving }) => {
  const locked = event?.status === "finalized";
  return <>
    <section className={styles.metrics}>{[
      ["Participants", participants.length, Users],
      ["Expected", money(participants.reduce((sum, item) => sum + Number(item.finalPayable || 0), 0)), Coins],
      ["Collected", money(participants.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0)), Banknote],
      ["Pending", money(participants.reduce((sum, item) => sum + Number(item.pendingAmount || 0), 0)), ReceiptText],
    ].map(([label, value, Icon]) => <article key={label}><span><Icon size={20}/></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
    <section className={styles.eventBar}><div><CalendarDays size={18}/><span><small>{event.status}</small><strong>{dateInput(event.startDate)} · {event.venue || "Venue not added"}</strong></span></div><div><Flag size={18}/><span><small>Default Fee</small><strong>{money(event.feeRules?.defaultFee || 0)} · {event.feeRules?.currencyCode}</strong></span></div>{!locked ? <button type="button" disabled={saving} onClick={finalize}><CheckCircle2 size={17}/>Finalize & Generate Records</button> : <span className={styles.finalized}><ShieldCheck size={16}/>Finalized</span>}</section>
    <section className={styles.participantTable}><header><div><small>Individual control</small><h2>Participants & Results</h2><p>Default fee, exceptions and performance remain independently editable.</p></div><span>{participants.length} registered</span></header><div className={styles.rows}>{participants.map((participant, index) => { const open = expanded === participant._id; return <article key={participant._id} className={open ? styles.openRow : ""}><button type="button" className={styles.rowSummary} onClick={() => setExpanded(open ? "" : participant._id)}><b>{String(index + 1).padStart(2, "0")}</b><img src={getStudentPhotoUrl(participant.student)} alt=""/><span><strong>{nameOf(participant.student)}</strong><small>{codeOf(participant.student)} · {participant.student?.batch?.batchName || "No batch"}</small></span><span><small>Payable</small><strong>{money(participant.finalPayable)}</strong></span><span><small>Paid</small><strong>{money(participant.amountPaid)}</strong></span><i className={styles[`payment${participant.paymentStatus}`]}>{participant.paymentStatus}</i><ChevronDown size={17}/></button>{open ? <div className={styles.editor}>
        <section><h3><WalletCards size={17}/>Fee & Payment</h3><div className={styles.editorGrid}><label><span>Custom Fee</span><div className={styles.moneyInput}><b>{currency.symbol}</b><input type="number" min="0" value={participant.feeOverride ?? ""} placeholder={String(event.feeRules?.defaultFee || 0)} disabled={locked} onChange={(e) => updateLocal(participant._id, "feeOverride", e.target.value === "" ? null : Number(e.target.value))}/></div></label><label><span>Discount</span><div className={styles.moneyInput}><b>{currency.symbol}</b><input type="number" min="0" value={participant.discount || 0} disabled={locked} onChange={(e) => updateLocal(participant._id, "discount", Number(e.target.value))}/></div></label><label><span>Amount Paid</span><div className={styles.moneyInput}><b>{currency.symbol}</b><input type="number" min="0" value={participant.amountPaid || 0} disabled={locked} onChange={(e) => updateLocal(participant._id, "amountPaid", Number(e.target.value))}/></div></label><label><span>Payment Mode</span><select value={participant.paymentMode || ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "paymentMode", e.target.value)}><option value="">Not selected</option><option value="cash">Cash</option><option value="online">Online</option><option value="cash_online">Cash + Online</option></select></label></div></section>
        {mode === "belt" ? <section><h3><Award size={17}/>Belt Assessment</h3><div className={styles.editorGrid}><label><span>Current Belt</span><select value={participant.currentBelt || ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "currentBelt", e.target.value)}><option value="">Select belt</option>{BELTS.map((belt) => <option key={belt}>{belt}</option>)}</select></label>{participant.currentBelt === "Black" ? <label><span>Current Dan</span><select value={participant.currentDanRank || ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "currentDanRank", e.target.value)}><option value="">Select Dan</option>{DAN_RANKS.map((dan) => <option key={dan}>{dan}</option>)}</select></label> : null}<label><span>Promoted Belt</span><select value={participant.promotedToBelt || ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "promotedToBelt", e.target.value)}><option value="">Select belt</option>{BELTS.map((belt) => <option key={belt}>{belt}</option>)}</select></label>{participant.promotedToBelt === "Black" ? <label><span>Promoted Dan</span><select value={participant.promotedToDanRank || ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "promotedToDanRank", e.target.value)}><option value="">Select Dan</option>{DAN_RANKS.map((dan) => <option key={dan}>{dan}</option>)}</select></label> : null}<label><span>Marks</span><input type="number" min="0" value={participant.marks ?? ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "marks", e.target.value)}/></label><label><span>Out Of</span><input type="number" min="0" value={participant.outOf ?? ""} disabled={locked} onChange={(e) => updateLocal(participant._id, "outOf", e.target.value)}/></label><label><span>Result</span><select value={participant.result} disabled={locked} onChange={(e) => updateLocal(participant._id, "result", e.target.value)}>{RESULTS.map((result) => <option key={result}>{result}</option>)}</select></label></div></section> : <section><div className={styles.entryHeading}><h3><Medal size={17}/>Competition Entries</h3>{!locked ? <button type="button" onClick={() => addEntry(participant._id)}><Plus size={14}/>Add Entry</button> : null}</div>{participant.entries.map((entry, entryIndex) => <div className={styles.entry} key={entry._id || entryIndex}><strong>Entry {entryIndex + 1}</strong><div className={styles.editorGrid}><label><span>Event Type</span><select value={entry.eventType || "Kyorugi"} disabled={locked} onChange={(e) => updateEntry(participant._id, entryIndex, "eventType", e.target.value)}>{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label><span>Age Category</span><select value={entry.ageCategory || "Senior"} disabled={locked} onChange={(e) => updateEntry(participant._id, entryIndex, "ageCategory", e.target.value)}>{AGE_CATEGORIES.map((age) => <option key={age}>{age}</option>)}</select></label><label><span>Weight Category</span><input value={entry.weightCategory || ""} disabled={locked} onChange={(e) => updateEntry(participant._id, entryIndex, "weightCategory", e.target.value)}/></label><label><span>Additional Entry Fee Override</span><div className={styles.moneyInput}><b>{currency.symbol}</b><input type="number" min="0" value={entry.entryFeeOverride ?? ""} placeholder={entryIndex ? String(event.feeRules?.additionalEntryFee || 0) : "Included"} disabled={locked || entryIndex === 0} onChange={(e) => updateEntry(participant._id, entryIndex, "entryFeeOverride", e.target.value === "" ? null : Number(e.target.value))}/></div></label><label><span>Result</span><select value={entry.result || "Participation"} disabled={locked} onChange={(e) => updateEntry(participant._id, entryIndex, "result", e.target.value)}>{CHAMP_RESULTS.map((result) => <option key={result}>{result}</option>)}</select></label>{entry.result === "Disqualified" ? <label><span>Disqualification Reason</span><input value={entry.disqualificationReason || ""} disabled={locked} onChange={(e) => updateEntry(participant._id, entryIndex, "disqualificationReason", e.target.value)}/></label> : null}<label><span>Total Bouts</span><input type="number" min="0" value={entry.totalBouts || 0} disabled={locked} onChange={(e) => updateEntry(participant._id, entryIndex, "totalBouts", Number(e.target.value))}/></label></div></div>)}</section>}
        {!locked ? <footer><button type="button" className={styles.deleteButton} onClick={() => removeParticipant(participant)}><Trash2 size={15}/>Remove</button><button type="button" className={styles.saveButton} onClick={() => saveParticipant(participant)}><Save size={15}/>Save Participant</button></footer> : null}
      </div> : null}</article>; })}</div></section>
  </>;
};

export default AcademyEventStudio;
