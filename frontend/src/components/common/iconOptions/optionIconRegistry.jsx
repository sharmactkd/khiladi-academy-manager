import {
  Armchair,
  Bath,
  BriefcaseMedical,
  Cctv,
  CircleEllipsis,
  CircleParking,
  Droplets,
  Dumbbell,
  Grid3X3,
  Infinity,
  Radar,
  Warehouse,
} from "lucide-react";
import MartialArtIcon from "./MartialArtIcon.jsx";

const normalize = (value) => String(value || "").trim().toLowerCase();

const FACILITY_ICONS = {
  "mat area": Grid3X3,
  "mat arena": Grid3X3,
  "changing room": Warehouse,
  washroom: Bath,
  "drinking water": Droplets,
  parking: CircleParking,
  cctv: Cctv,
  "first aid": BriefcaseMedical,
  "pss / sensor system": Radar,
  "gym equipment": Dumbbell,
  "waiting area": Armchair,
};

const LANGUAGE_GLYPHS = {
  hindi: "अ",
  english: "A",
  urdu: "ا",
  punjabi: "ਅ",
  bengali: "অ",
  marathi: "म",
  tamil: "அ",
  telugu: "అ",
  kannada: "ಅ",
  malayalam: "അ",
};

const BELT_COLORS = {
  white: { main: "#ffffff", stripe: "#cbd5e1", outline: "#94a3b8" },
  yellow: { main: "#facc15", stripe: "#eab308", outline: "#ca8a04" },
  green: { main: "#16a34a", stripe: "#15803d", outline: "#166534" },
  "green one": { main: "#16a34a", stripe: "#facc15", outline: "#166534" },
  blue: { main: "#2563eb", stripe: "#1d4ed8", outline: "#1e40af" },
  "blue one": { main: "#2563eb", stripe: "#facc15", outline: "#1e40af" },
  red: { main: "#dc2626", stripe: "#b91c1c", outline: "#991b1b" },
  "red one": { main: "#dc2626", stripe: "#111827", outline: "#991b1b" },
  black: { main: "#111827", stripe: "#020617", outline: "#020617" },
};

const BeltIcon = ({ belt }) => {
  const colors = BELT_COLORS[normalize(belt)] || {
    main: "#94a3b8",
    stripe: "#64748b",
    outline: "#475569",
  };
  return (
    <svg viewBox="0 0 48 32" role="img" aria-label={`${belt} belt`}>
      <path d="M4 9h26v11H4z" fill={colors.main} stroke={colors.outline} strokeWidth="1.4" />
      <path d="M30 9h5v11h-5z" fill={colors.stripe} stroke={colors.outline} strokeWidth="1.2" />
      <path d="m35 9 9 3-3 5 3 5-9-2z" fill={colors.main} stroke={colors.outline} strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M12 9v11" stroke={colors.outline} strokeWidth="1.2" opacity=".55" />
    </svg>
  );
};

export const OptionIcon = ({ kind = "generic", value }) => {
  const key = normalize(value);
  if (kind === "sport") return <MartialArtIcon sport={value} />;
  if (kind === "belt") {
    if (key === "no limit") return <Infinity aria-hidden="true" />;
    return <BeltIcon belt={value} />;
  }
  if (kind === "language") {
    return <span aria-hidden="true">{LANGUAGE_GLYPHS[key] || String(value || "?").charAt(0).toUpperCase()}</span>;
  }
  const map = kind === "facility" ? FACILITY_ICONS : {};
  const Icon = map[key] || (kind === "facility" ? Warehouse : CircleEllipsis);
  return <Icon aria-hidden="true" />;
};

export const optionKindLabel = (kind) => ({
  sport: "sport or martial art",
  facility: "facility",
  language: "language",
  belt: "belt",
}[kind] || "option");
