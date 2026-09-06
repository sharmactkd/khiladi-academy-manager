import { Globe2 } from "lucide-react";
import styles from "./SocialLinksField.module.css";

const BrandIcon = ({ children, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Instagram = (props) => <BrandIcon {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" /></BrandIcon>;
const Facebook = (props) => <BrandIcon {...props}><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3.5l.5-4h-4V9c0-.7.3-1 1-1Z" /></BrandIcon>;
const Youtube = (props) => <BrandIcon {...props}><path d="M22 12s0-4-1-6c-.5-1-1.5-1.5-2.5-1.6C16.5 4 12 4 12 4s-4.5 0-6.5.4C4.5 4.5 3.5 5 3 6c-1 2-1 6-1 6s0 4 1 6c.5 1 1.5 1.5 2.5 1.6 2 .4 6.5.4 6.5.4s4.5 0 6.5-.4c1-.1 2-.6 2.5-1.6 1-2 1-6 1-6Z" /><path d="m10 9 5 3-5 3Z" /></BrandIcon>;

const DEFAULT_PLATFORMS = [
  { key: "website", label: "Website", icon: Globe2, placeholder: "https://youracademy.com" },
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/youracademy" },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/youracademy" },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@youracademy" },
];

const SocialLinksField = ({ className = "", onChange, platforms = DEFAULT_PLATFORMS, value = {} }) => (
  <div className={`${styles.root} ${className}`.trim()}>{platforms.map(({ icon: Icon, key, label, placeholder }) => <label key={key}><span className={styles.icon}><Icon size={15} aria-hidden="true" /></span><span>{label}</span><input type="url" value={value[key] || ""} placeholder={placeholder} onChange={(event) => onChange?.(key, event.target.value)} /></label>)}</div>
);

export default SocialLinksField;
