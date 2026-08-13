import { Globe2 } from "lucide-react";
import styles from "./SocialLinksField.module.css";

const DEFAULT_PLATFORMS = [
  { key: "website", label: "Website", icon: Globe2, placeholder: "https://youracademy.com" },
  { key: "instagram", label: "Instagram", icon: Globe2, placeholder: "https://instagram.com/youracademy" },
  { key: "facebook", label: "Facebook", icon: Globe2, placeholder: "https://facebook.com/youracademy" },
  { key: "youtube", label: "YouTube", icon: Globe2, placeholder: "https://youtube.com/@youracademy" },
];

const SocialLinksField = ({ className = "", onChange, platforms = DEFAULT_PLATFORMS, value = {} }) => (
  <div className={`${styles.root} ${className}`.trim()}>{platforms.map(({ icon: Icon, key, label, placeholder }) => <label key={key}><span className={styles.icon}><Icon size={15} aria-hidden="true" /></span><span>{label}</span><input type="url" value={value[key] || ""} placeholder={placeholder} onChange={(event) => onChange?.(key, event.target.value)} /></label>)}</div>
);

export default SocialLinksField;
