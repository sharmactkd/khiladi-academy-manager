import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, RefreshCw, UserPlus } from "lucide-react";
import admissionEnquiryApi from "../../api/admissionEnquiryApi.js";
import "./AdmissionsFollowUps.css";

const sections = [
  { key: "overdue", title: "Overdue follow-ups", empty: "No overdue follow-ups", icon: AlertTriangle, tone: "danger" },
  { key: "today", title: "Due today", empty: "Nothing due today", icon: Clock3, tone: "today" },
  { key: "upcomingTrials", title: "Upcoming trials", empty: "No trials in the next 7 days", icon: CalendarClock, tone: "trial" },
  { key: "stale", title: "Needs attention", empty: "No unattended leads", icon: UserPlus, tone: "stale" },
];
const formatDate = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not scheduled";

export default function AdmissionsFollowUps() {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const response = await admissionEnquiryApi.dashboard(); setData(response.data?.data || {}); } catch (error) { toast.error(error.response?.data?.message || "Follow-up dashboard load nahi hua"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const update = async (item, payload, message) => { try { await admissionEnquiryApi.update(item._id, payload); toast.success(message); load(); } catch (error) { toast.error(error.response?.data?.message || "Action failed"); } };
  const tomorrow = () => { const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(10, 0, 0, 0); return date.toISOString(); };
  if (loading) return <div className="follow-page"><div className="follow-empty">Preparing today’s follow-ups…</div></div>;
  return <div className="follow-page">
    <header className="follow-head"><div><span>Admissions workspace</span><h1>Follow-up Dashboard</h1><p>Today’s priorities, overdue leads and upcoming trials.</p></div><div className="follow-head-actions"><button onClick={load}><RefreshCw size={16}/> Refresh</button><Link to="/admissions/enquiries">View all enquiries</Link></div></header>
    <section className="follow-summary"><div><strong>{data?.overdue?.length || 0}</strong><span>Overdue</span></div><div><strong>{data?.today?.length || 0}</strong><span>Due today</span></div><div><strong>{data?.upcomingTrials?.length || 0}</strong><span>Upcoming trials</span></div><div><strong>{data?.totals?.converted || 0}</strong><span>Converted</span></div></section>
    <div className="follow-grid">{sections.map(({ key, title, empty, icon: Icon, tone }) => <section className={`follow-section follow-${tone}`} key={key}><div className="follow-title"><span><Icon size={18}/></span><h2>{title}</h2><b>{data?.[key]?.length || 0}</b></div>{data?.[key]?.length ? <div className="follow-list">{data[key].map((item) => <article key={item._id}><div className="follow-person"><strong>{item.name}</strong><span>{item.phone}</span></div><div className="follow-meta"><span>{item.martialArt || "Any program"}</span><span>{key === "upcomingTrials" ? formatDate(item.trialSchedule?.date) : formatDate(item.followUpAt || item.createdAt)}</span></div><div className="follow-actions"><a href={`tel:${item.phone}`}>Call</a><button onClick={() => update(item, { status: "contacted", followUpAt: null }, "Marked contacted")}><CheckCircle2 size={14}/> Contacted</button><button onClick={() => update(item, { followUpAt: tomorrow() }, "Follow-up moved to tomorrow")}>Tomorrow</button></div></article>)}</div> : <div className="follow-empty"><CheckCircle2 size={22}/><span>{empty}</span></div>}</section>)}</div>
  </div>;
}
