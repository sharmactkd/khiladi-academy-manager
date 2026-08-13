import { ChevronRight, LoaderCircle, Save } from "lucide-react";
import FormActionBar from "../../../components/common/FormActionBar.jsx";

const AcademyProfileActions = ({ onCancel, saving }) => (
  <FormActionBar className="academy-profile-actions" actions={<>
    <a href="#identity" className="academy-profile-actions__back">
      Back to top <ChevronRight size={15} aria-hidden="true" />
    </a>
    <button type="reset" className="btn btn-secondary" disabled={saving} onClick={onCancel}>
      Cancel
    </button>
    <button type="submit" className="btn btn-primary" disabled={saving}>
      {saving ? (
        <LoaderCircle className="academy-profile-state__spinner" size={18} aria-hidden="true" />
      ) : (
        <Save size={18} aria-hidden="true" />
      )}
      {saving ? "Saving…" : "Update Academy"}
    </button>
  </>} />
);

export default AcademyProfileActions;
