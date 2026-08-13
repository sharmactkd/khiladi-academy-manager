import { Link } from "react-router-dom";
import { ChevronRight, UserCheck } from "lucide-react";

const DashboardAlertsPanel = ({ alerts }) => (
  <article className="owner-panel owner-alerts">
    <header className="owner-panel__header"><div><span>Attention</span><h2>Alerts</h2></div></header>
    <div className="owner-alerts__list">
      {alerts.length ? alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <Link key={alert.title} to={alert.to} className={`owner-alert owner-alert--${alert.tone}`}>
            <span><Icon size={17} /></span>
            <div><strong>{alert.title}</strong><small>{alert.text}</small></div>
            {alert.count !== null ? <b>{alert.count}</b> : <ChevronRight size={16} />}
          </Link>
        );
      }) : <div className="owner-alerts__clear"><UserCheck size={28} /><strong>All clear</strong><small>No action-required alerts right now.</small></div>}
    </div>
  </article>
);

export default DashboardAlertsPanel;
