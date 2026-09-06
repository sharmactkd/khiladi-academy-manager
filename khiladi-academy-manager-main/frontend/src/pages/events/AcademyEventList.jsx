import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Award, Banknote, CalendarDays, Coins, Plus, Search, Trophy, Users } from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { academyEventApi } from "../../api/academyEventApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { formatMoney } from "../../utils/currency.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import styles from "./AcademyEventStudio.module.css";

const payloadOf = (response) => response?.data?.data || response?.data || response || {};
const addressOf = (value) => [value?.address, value?.city, value?.state, value?.country].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date not added";

const AcademyEventList = ({ mode }) => {
  const type = mode === "belt" ? "belt_test" : "championship";
  const title = mode === "belt" ? "Belt Test" : "Championship";
  const basePath = mode === "belt" ? "/belt-tests" : "/championship-records";
  const Icon = mode === "belt" ? Award : Trophy;
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const [eventResult, academyResult, branchResult] = await Promise.allSettled([academyEventApi.getAll({ type }), academyApi.getMyAcademy(), getBranches({ status: "active" })]);
    if (eventResult.status === "fulfilled") setEvents(payloadOf(eventResult.value).events || []); else toast.error("Events could not be loaded");
    if (academyResult.status === "fulfilled") setAcademy(payloadOf(academyResult.value).academy || null);
    if (branchResult.status === "fulfilled") { const list = branchResult.value?.data?.data || branchResult.value?.data || []; setBranches(Array.isArray(list) ? list : []); }
    setLoading(false);
  })(); }, [type]);

  const visible = useMemo(() => { const query = search.trim().toLowerCase(); return events.filter((event) => (!status || event.status === status) && (!query || [event.name, event.venue, event.organizer, event.sport].some((value) => String(value || "").toLowerCase().includes(query)))); }, [events, search, status]);
  const totals = useMemo(() => events.reduce((result, event) => ({ participants: result.participants + Number(event.summary?.participants || 0), payable: result.payable + Number(event.summary?.payable || 0), collected: result.collected + Number(event.summary?.collected || 0) }), { participants: 0, payable: 0, collected: 0 }), [events]);
  const mainBranch = branches.find((branch) => branch.isMainBranch) || branches[0];

  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="academy-event-list" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""} eyebrow={`${title} operations`} addressLabel={mainBranch?.branchName || "Main Branch"} address={addressOf(mainBranch) || addressOf(academy) || "Main branch address not available"} summaryItems={[{ key: "events", icon: Icon, value: events.length, label: "Events" }, { key: "participants", icon: Users, value: totals.participants, label: "Participants" }]}/>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><span>/</span><Link to={basePath}>{title} Records</Link><span>/</span><strong>Events</strong></nav>
    <header className={styles.heading}><div><span><Icon size={26}/></span><div><small>Multi-participant management</small><h1>{title} Events</h1><p>Create common event details once and manage individual fees and results.</p></div></div><Link className={styles.primaryLink} to={`${basePath}/new`}><Plus size={16}/>Create {title}</Link></header>
    <section className={styles.metrics}>{[["Total Events", events.length, Icon], ["Participants", totals.participants, Users], ["Expected", formatMoney(totals.payable, mainBranch), Coins], ["Collected", formatMoney(totals.collected, mainBranch), Banknote]].map(([label, value, MetricIcon]) => <article key={label}><span><MetricIcon size={20}/></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
    <section className={styles.listControls}><label><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()} events…`}/></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="open">Open</option><option value="finalized">Finalized</option><option value="cancelled">Cancelled</option></select></section>
    <section className={styles.eventList}>{loading ? <div className={styles.loading}><span/><h2>Loading events…</h2></div> : visible.length ? visible.map((event) => <Link key={event._id} to={`${basePath}/events/${event._id}`}><span className={styles.eventIcon}><Icon size={21}/></span><div className={styles.eventCopy}><small>{event.status}</small><strong>{event.name}</strong><p><CalendarDays size={13}/>{dateLabel(event.startDate)} · {event.venue || "Venue not added"}</p></div><dl><div><dt>Participants</dt><dd>{event.summary?.participants || 0}</dd></div><div><dt>Expected</dt><dd>{formatMoney(event.summary?.payable || 0, event.branch || mainBranch)}</dd></div><div><dt>Pending</dt><dd>{formatMoney(event.summary?.pending || 0, event.branch || mainBranch)}</dd></div></dl><ArrowRight size={18}/></Link>) : <div className={styles.emptyList}><Icon size={29}/><h3>No {title.toLowerCase()} events found</h3><p>Create the first event and register multiple students together.</p><Link to={`${basePath}/new`}><Plus size={15}/>Create {title}</Link></div>}</section>
  </div>;
};

export default AcademyEventList;
