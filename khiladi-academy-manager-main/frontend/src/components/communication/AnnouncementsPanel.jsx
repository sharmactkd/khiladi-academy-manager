import { Archive, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { dateTime, pretty } from "../../pages/communication/communicationHub.utils.js";

const AnnouncementsPanel = ({ announcements, onArchive, styles }) => <section className={styles.panel}>
  <header><div><small>Broadcast centre</small><h2>Announcements</h2><p>Create, publish and audit academy-wide information.</p></div><Link className={styles.primaryAction} to="/announcements/new"><Plus size={16}/>New announcement</Link></header>
  <div className={styles.toolbar}><label><Search size={16}/><input placeholder="Search announcements..." onChange={(event) => { const query = event.target.value.toLowerCase(); document.querySelectorAll("[data-announcement]").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); }); }}/></label></div>
  <div className={styles.tableWrap}><table><thead><tr><th>Announcement</th><th>Audience</th><th>Priority</th><th>Channels</th><th>Publish</th><th>Status</th><th aria-label="Actions"/></tr></thead><tbody>{announcements.map((item) => <tr key={item._id} data-announcement><td><strong>{item.title}</strong><small>{item.message}</small></td><td>{pretty(item.audienceType)}</td><td><span className={styles.pill}>{pretty(item.priority)}</span></td><td>{item.channels?.map(pretty).join(", ") || "Internal"}</td><td>{dateTime(item.publishAt || item.createdAt)}</td><td><span className={`${styles.status} ${styles[item.status]}`}>{pretty(item.status)}</span></td><td>{item.status !== "archived" ? <button className={styles.iconButton} type="button" title="Archive" onClick={() => window.confirm("Archive this announcement?") && onArchive(item._id)}><Archive size={16}/></button> : null}</td></tr>)}</tbody></table>{!announcements.length ? <div className={styles.empty}>No announcements found.</div> : null}</div>
</section>;

export default AnnouncementsPanel;
