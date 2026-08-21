import { Image as ImageIcon, Upload } from "lucide-react";
import AcademyProfileCardHeader from "./AcademyProfileCardHeader.jsx";

const AcademyLogoField = ({ logoPreview, onChange }) => (
  <section className="academy-profile-card academy-profile-logo-card">
    <AcademyProfileCardHeader eyebrow="Identity" icon={ImageIcon} title="Academy Logo" />
    <div className="academy-profile-logo-card__body">
      <label className="academy-profile-logo-preview" title="Upload or change academy logo">
        {logoPreview ? <img src={logoPreview} alt="Academy Logo" /> : <ImageIcon aria-hidden="true" />}
        <span className="academy-profile-logo-upload">
          <Upload size={22} aria-hidden="true" />
          <strong>Upload / Change Logo</strong>
          <small>JPG, PNG or WEBP · Maximum 2 MB</small>
        </span>
        <input className="academy-profile-logo-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={onChange} />
      </label>
    </div>
  </section>
);

export default AcademyLogoField;
