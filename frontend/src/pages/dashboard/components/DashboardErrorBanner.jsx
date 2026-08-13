import { AlertTriangle } from "lucide-react";
import InlineAlert from "../../../components/common/InlineAlert.jsx";

const DashboardErrorBanner = ({ error, onRetry }) => {
  if (!error) return null;

  return <InlineAlert
    action={<button type="button" onClick={onRetry}>
        Retry
      </button>}
    className="owner-dashboard__error"
    icon={AlertTriangle}
    message={error}
  />;
};

export default DashboardErrorBanner;
