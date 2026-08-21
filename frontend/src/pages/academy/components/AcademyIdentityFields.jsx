import { Building2 } from "lucide-react";
import AcademyProfileCardHeader from "./AcademyProfileCardHeader.jsx";

const AcademyIdentityFields = ({ academy, currentYear, onChange }) => (
  <section className="academy-profile-card academy-profile-basic-card">
    <AcademyProfileCardHeader eyebrow="Identity" icon={Building2} title="Basic Information" />
    <div className="academy-profile-fields academy-profile-fields--stacked">
      <label>Owner / Director Name<input value={academy.ownerName || ""} onChange={(event) => onChange("ownerName", event.target.value)} placeholder="Owner / Director Name" /></label>
      <label>Academy Name<input value={academy.academyName || ""} onChange={(event) => onChange("academyName", event.target.value)} placeholder="Academy Name" /></label>
      <label>Since Year<select value={academy.since || ""} onChange={(event) => onChange("since", event.target.value)}><option value="">Select Year</option>{Array.from({ length: currentYear - 1949 }, (_, index) => { const year = currentYear - index; return <option key={year} value={year}>{year} ({currentYear - year} Years)</option>; })}</select></label>
    </div>
  </section>
);

export default AcademyIdentityFields;
