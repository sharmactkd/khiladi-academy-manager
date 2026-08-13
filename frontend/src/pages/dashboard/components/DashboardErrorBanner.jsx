import { AlertTriangle } from "lucide-react";

const DashboardErrorBanner = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="owner-dashboard__error" role="alert">
      <AlertTriangle size={18} />
      <span>{error}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
};

export default DashboardErrorBanner;
