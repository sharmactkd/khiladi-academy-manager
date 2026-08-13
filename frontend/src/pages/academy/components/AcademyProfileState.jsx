import { Building2, LoaderCircle } from "lucide-react";

const AcademyProfileState = ({ loading, onRetry }) => (
  <div
    className={`academy-profile-state${loading ? "" : " academy-profile-state--error"}`}
    aria-live={loading ? "polite" : undefined}
  >
    {loading ? (
      <LoaderCircle className="academy-profile-state__spinner" />
    ) : (
      <Building2 />
    )}
    <strong>{loading ? "Loading academy profile…" : "Academy not found."}</strong>
    {!loading ? (
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
    ) : null}
  </div>
);

export default AcademyProfileState;
