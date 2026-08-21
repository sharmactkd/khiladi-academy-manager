import { BellRing, CircleCheckBig, Clock3, Link2, Megaphone, MessageSquareText, TriangleAlert } from "lucide-react";

const CommunicationOverview = ({ state, styles, onTab }) => {
  const cards = [
    { icon: Megaphone, label: "Published", value: state.stats.published, detail: "Active announcements", tone: "red", tab: "announcements" },
    { icon: Clock3, label: "Scheduled / Draft", value: state.stats.scheduled, detail: "Waiting for action", tone: "amber", tab: "announcements" },
    { icon: Link2, label: "Parent Access", value: state.stats.activeLinks, detail: "Active student links", tone: "green", tab: "parent-access" },
    { icon: BellRing, label: "Unread", value: state.stats.unread, detail: "Inbox notifications", tone: "blue", tab: "inbox" },
  ];
  const recent = state.logs.slice(0, 6);
  return <div className={styles.overview}>
    <section className={styles.kpis}>{cards.map(({ icon: Icon, ...card }) => <button type="button" key={card.label} className={`${styles.kpi} ${styles[card.tone]}`} onClick={() => onTab(card.tab)}><span><Icon size={21}/></span><p><small>{card.label}</small><strong>{card.value}</strong><i>{card.detail}</i></p></button>)}</section>
    <section className={styles.overviewGrid}>
      <article className={styles.panel}><header><div><small>Operations</small><h2>Communication health</h2><p>Current delivery status across available channels.</p></div></header><div className={styles.healthGrid}><div><CircleCheckBig size={19}/><p><strong>{state.stats.sent}</strong><span>Sent successfully</span></p></div><div className={styles.dangerMetric}><TriangleAlert size={19}/><p><strong>{state.stats.failed}</strong><span>Failed deliveries</span></p></div><div><MessageSquareText size={19}/><p><strong>{state.logs.length}</strong><span>Recent log records</span></p></div></div></article>
      <article className={styles.panel}><header><div><small>Recent activity</small><h2>Latest communications</h2><p>Most recent messages and delivery events.</p></div><button type="button" onClick={() => onTab("logs")}>View logs</button></header><div className={styles.compactList}>{recent.length ? recent.map((item) => <div key={item._id}><span className={styles.statusDot}/><p><strong>{item.subject || "Communication"}</strong><small>{item.relatedStudent?.name || item.recipientUser?.name || "Recipient"} · {item.channel}</small></p><b className={styles[`status${String(item.status || "pending").replace(/\b\w/g, c => c.toUpperCase())}`]}>{item.status}</b></div>) : <div className={styles.empty}>No communication activity yet.</div>}</div></article>
    </section>
  </div>;
};

export default CommunicationOverview;
