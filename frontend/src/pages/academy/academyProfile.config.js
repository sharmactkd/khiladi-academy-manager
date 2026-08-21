import { Award, Building2, Dumbbell, Globe2, Info, MapPin } from "lucide-react";

export const MARTIAL_ART_OPTIONS = [
  "Taekwondo", "Karate", "Judo", "Boxing", "Kickboxing", "Wrestling",
  "MMA", "Kung Fu", "Wushu", "Muay Thai", "Brazilian Jiu-Jitsu",
  "Self Defence", "Fitness", "Yoga",
];

export const CREDENTIAL_TYPES = ["affiliation", "recognition", "registration", "other"];
export const DEFAULT_CREDENTIAL_TYPES = ["affiliation", "recognition", "registration"];

export const PROFILE_SECTIONS = [
  { id: "identity", label: "Identity", icon: Building2 },
  { id: "contact", label: "Contact", icon: MapPin },
  { id: "martial-arts", label: "Martial Arts", icon: Dumbbell },
  { id: "about", label: "About", icon: Info },
  { id: "affiliations", label: "Affiliations", icon: Award },
  { id: "social", label: "Social", icon: Globe2 },
];
