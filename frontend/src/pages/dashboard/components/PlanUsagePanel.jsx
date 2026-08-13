import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import UsageMeter from "../../../components/billing/UsageMeter.jsx";

const PlanUsagePanel = ({ billing, limits, plan, usage }) => {
  if (!billing) return null;

  return (
    <section className="owner-plan owner-panel">
      <header className="owner-panel__header">
        <div><span>Subscription</span><h2>{plan.name || "Free"} plan usage</h2></div>
        <Link to="/billing">Billing dashboard <ChevronRight size={15} /></Link>
      </header>
      <div className="usage-grid">
        <UsageMeter label="Students" used={usage.students} limit={limits.students} />
        <UsageMeter label="Batches" used={usage.batches} limit={limits.batches} />
        <UsageMeter label="Certificates" used={usage.certificates} limit={limits.certificates} />
        <UsageMeter label="ID Cards" used={usage.idCards} limit={limits.idCards} />
        <UsageMeter label="Announcements" used={usage.announcements} limit={limits.announcements} />
      </div>
      <div className="owner-plan__links"><Link to="/plans">View plans</Link><Link to="/billing/invoices">Invoices</Link><Link to="/billing/payments">Payment history</Link></div>
    </section>
  );
};

export default PlanUsagePanel;
