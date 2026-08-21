import { MapPin } from "lucide-react";
import PhoneLocationFields from "../../../components/common/PhoneLocationFields.jsx";
import AcademyProfileCardHeader from "./AcademyProfileCardHeader.jsx";

const AcademyContactFields = ({ academy, normalizePhoneNumbers, onChange }) => (
  <section className="academy-profile-card academy-profile-contact-card" id="contact">
    <AcademyProfileCardHeader eyebrow="Contact" icon={MapPin} title="Phone & Location" />
    <div className="academy-profile-location-fields">
      <PhoneLocationFields countryCode={academy.countryCode || "+91"} phone={academy.phone || ""} phoneNumbers={normalizePhoneNumbers(academy.phoneNumbers, academy)} maxPhones={4} country={academy.country || "India"} state={academy.state || ""} city={academy.city || ""} phoneLabel="Phone" onChange={onChange} />
      <label className="academy-profile-contact-email">Email<input type="email" value={academy.email || ""} onChange={(event) => onChange("email", event.target.value)} placeholder="academy@example.com" /></label>
      <label className="academy-profile-contact-address">Address<textarea value={academy.address || ""} onChange={(event) => onChange("address", event.target.value)} placeholder="Enter complete academy address" rows={3} /></label>
    </div>
  </section>
);

export default AcademyContactFields;
