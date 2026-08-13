import { IndianRupee, UserPlus } from "lucide-react";
import { formatRelativeTime } from "../dashboard.utils.js";

const RecentActivityPanel = ({ items }) => (
  <article className="owner-panel owner-activity">
    <header className="owner-panel__header"><div><span>Updates</span><h2>Recent activity</h2></div></header>
    <div className="owner-activity__list">
      {items.length ? items.map((item) => {
        const Icon = item.type === "payment" ? IndianRupee : UserPlus;
        return (
          <div key={item.id} className={`owner-activity__item owner-activity__item--${item.type}`}>
            <span><Icon size={16} /></span>
            <div><strong>{item.title}</strong><small>{item.meta}</small></div>
            <time>{formatRelativeTime(item.time)}</time>
          </div>
        );
      }) : <p className="owner-panel__empty">No recent activity.</p>}
    </div>
  </article>
);

export default RecentActivityPanel;
