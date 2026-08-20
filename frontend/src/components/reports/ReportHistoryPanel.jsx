import { Clock3, FileCheck2, FileX2 } from "lucide-react";
import { humanizeKey } from "../../pages/reports/reportStudio.config.js";

const ReportHistoryPanel = ({ history, styles }) => (
  <aside className={styles.history}>
    <header><div><Clock3 size={17}/><span><h2>Recent activity</h2><p>Last generated reports</p></span></div><b>{history.length}</b></header>
    <div>{history.length ? history.slice(0, 6).map((item) => <article key={item._id}><span className={item.status === "failed" ? styles.failedLog : styles.successLog}>{item.status === "failed" ? <FileX2 size={16}/> : <FileCheck2 size={16}/>}</span><p><strong>{humanizeKey(item.reportType)}</strong><small>{new Date(item.generatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {item.generatedBy?.name || "Academy user"}</small></p><b>{item.metadata?.totalRows ?? "—"}</b></article>) : <div className={styles.noHistory}><Clock3 size={22}/><span>No report activity yet.</span></div>}</div>
  </aside>
);

export default ReportHistoryPanel;
