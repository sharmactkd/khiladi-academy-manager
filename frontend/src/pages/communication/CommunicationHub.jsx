import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, BellRing, ChevronRight, LayoutDashboard, Link2, Megaphone, MessageSquareText, RefreshCw, Send } from "lucide-react";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import CommunicationOverview from "../../components/communication/CommunicationOverview.jsx";
import AnnouncementsPanel from "../../components/communication/AnnouncementsPanel.jsx";
import ReminderComposer from "../../components/communication/ReminderComposer.jsx";
import ParentAccessPanel from "../../components/communication/ParentAccessPanel.jsx";
import DeliveryLogsPanel from "../../components/communication/DeliveryLogsPanel.jsx";
import NotificationInbox from "../../components/communication/NotificationInbox.jsx";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import useCommunicationHub from "./hooks/useCommunicationHub.js";
import { joinAddress } from "./communicationHub.utils.js";
import styles from "./CommunicationHub.module.css";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "reminders", label: "Reminders", icon: Send },
  { id: "parent-access", label: "Parent Access", icon: Link2 },
  { id: "logs", label: "Delivery Logs", icon: MessageSquareText },
  { id: "inbox", label: "Inbox", icon: Bell },
];

const CommunicationHub = () => {
  const state = useCommunicationHub(); const [params, setParams] = useSearchParams();
  const requested = params.get("tab") || "overview"; const active = tabs.some((tab) => tab.id === requested) ? requested : "overview";
  const mainBranch = state.branches.find((item) => item.isMainBranch) || state.branches[0];
  const setTab = (tab) => { const next = new URLSearchParams(params); tab === "overview" ? next.delete("tab") : next.set("tab", tab); setParams(next, { replace: true }); };
  const heroItems = useMemo(() => [{ key: "links", icon: Link2, value: state.stats.activeLinks, label: "Parent Links" }, { key: "unread", icon: BellRing, value: state.stats.unread, label: "Unread Alerts" }], [state.stats]);
  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="communication-academy" academyName={state.academy?.academyName || "KHILADI Academy"} ownerName={state.academy?.ownerName || state.user?.name || "Academy Owner"} logoUrl={state.academy?.logo ? getAcademyLogoUrl(state.academy) : ""} eyebrow="Family engagement desk" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(state.academy) || "Complete main branch address not available"} summaryItems={heroItems} action={<button type="button" className={styles.heroAction} onClick={state.refresh} disabled={state.refreshing}><RefreshCw size={16} className={state.refreshing ? styles.spin : ""}/>{state.refreshing ? "Refreshing" : "Refresh"}</button>}/>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><ChevronRight size={13}/><strong>Communication Hub</strong></nav>
    <header className={styles.heading}><span><MessageSquareText size={25}/></span><div><small>Connected academy</small><h1>Communication Hub</h1><p>Announcements, reminders, family access, delivery records and notifications in one secure workspace.</p></div></header>
    <nav className={styles.tabs}>{tabs.map((tab) => { const Icon = tab.icon; return <button type="button" key={tab.id} className={active === tab.id ? styles.activeTab : ""} onClick={() => setTab(tab.id)}><Icon size={17}/><span>{tab.label}</span>{tab.id === "inbox" && state.unreadCount ? <b>{state.unreadCount}</b> : null}</button>; })}</nav>
    {state.error ? <div className={styles.error}>{state.error}<button type="button" onClick={state.refresh}>Retry</button></div> : null}
    {state.loading ? <div className={styles.loading}><RefreshCw size={27}/><strong>Opening communication workspace...</strong><span>Loading announcements, access controls and delivery activity.</span></div> : <main>{active === "overview" ? <CommunicationOverview state={state} styles={styles} onTab={setTab}/> : null}{active === "announcements" ? <AnnouncementsPanel announcements={state.announcements} onArchive={state.archiveAnnouncement} styles={styles}/> : null}{active === "reminders" ? <ReminderComposer batches={state.batches} canManageFees={state.canManageFees} initialType={params.get("type") || "attendance"} onAttendance={state.sendAttendanceReminder} onFee={state.sendFeeReminder} styles={styles}/> : null}{active === "parent-access" ? <ParentAccessPanel links={state.parentLinks} onDeactivate={state.deactivateParentLink} styles={styles}/> : null}{active === "logs" ? <DeliveryLogsPanel logs={state.logs} pagination={state.logPagination} styles={styles}/> : null}{active === "inbox" ? <NotificationInbox notifications={state.notifications} unreadCount={state.unreadCount} onRead={state.markRead} onReadAll={state.markAllRead} styles={styles}/> : null}</main>}
  </div>;
};
export default CommunicationHub;
