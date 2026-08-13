import { Link } from "react-router-dom";

const QuickActionsPanel = ({ actions }) => (
  <article className="owner-panel owner-quick-actions">
    <header className="owner-panel__header"><div><span>Shortcuts</span><h2>Quick actions</h2></div></header>
    <div className="owner-quick-actions__grid">
      {actions.map(({ icon: Icon, label, to }) => (
        <Link key={to} to={to}><Icon /><span>{label}</span></Link>
      ))}
    </div>
  </article>
);

export default QuickActionsPanel;
