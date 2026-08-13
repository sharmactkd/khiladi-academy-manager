import { Building2, LoaderCircle } from "lucide-react";
import PageState from "../../../components/common/PageState.jsx";

const AcademyProfileState = ({ loading, onRetry }) => (
  <PageState
    action={!loading ? (
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
    ) : null}
    className={`academy-profile-state${loading ? "" : " academy-profile-state--error"}`}
    icon={loading ? LoaderCircle : Building2}
    iconClassName={loading ? "academy-profile-state__spinner" : ""}
    loading={loading}
    title={loading ? "Loading academy profile…" : "Academy not found."}
  />
);

export default AcademyProfileState;
