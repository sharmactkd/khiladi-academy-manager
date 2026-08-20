import { Activity, Award, Blocks, Brain, Dumbbell, Footprints, Gauge, Hand, HeartPulse, Move, PersonStanding, Shield, Sparkles, Swords, Target, Timer, Trophy } from "lucide-react";

export const SKILL_CATEGORIES = [
  { value: "kicks", label: "Kicks", icon: Footprints, tone: "red" },
  { value: "blocks", label: "Blocks", icon: Shield, tone: "blue" },
  { value: "stances", label: "Stances", icon: PersonStanding, tone: "purple" },
  { value: "hand_techniques", label: "Hand Techniques", icon: Hand, tone: "amber" },
  { value: "poomsae", label: "Poomsae", icon: Sparkles, tone: "purple" },
  { value: "sparring", label: "Sparring", icon: Swords, tone: "red" },
  { value: "self_defence", label: "Self Defence", icon: Shield, tone: "blue" },
  { value: "flexibility", label: "Flexibility", icon: Move, tone: "purple" },
  { value: "strength", label: "Strength", icon: Dumbbell, tone: "amber" },
  { value: "stamina", label: "Stamina", icon: HeartPulse, tone: "green" },
  { value: "speed", label: "Speed", icon: Gauge, tone: "blue" },
  { value: "agility", label: "Agility", icon: Activity, tone: "red" },
  { value: "balance", label: "Balance", icon: Target, tone: "green" },
  { value: "coordination", label: "Coordination", icon: Brain, tone: "blue" },
  { value: "discipline", label: "Discipline", icon: Award, tone: "amber" },
  { value: "fitness", label: "Fitness", icon: Timer, tone: "green" },
  { value: "technique", label: "General Technique", icon: Trophy, tone: "red" },
  { value: "other", label: "Other", icon: Blocks, tone: "slate" },
];

export const LEVELS = [
  { value: "all", label: "All Levels" }, { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" },
  { value: "black_belt", label: "Black Belt" },
];

export const BELTS = ["White", "Yellow", "Green", "Blue", "Red", "Black"];
export const DANS = ["1st Dan", "2nd Dan", "3rd Dan", "4th Dan", "5th Dan", "6th Dan", "7th Dan", "8th Dan", "9th Dan", "10th Dan"];
export const DEFAULT_RUBRIC = [{ criterion: "Technique", weight: 35 }, { criterion: "Accuracy", weight: 25 }, { criterion: "Balance", weight: 20 }, { criterion: "Speed", weight: 10 }, { criterion: "Control", weight: 10 }];
export const categoryMeta = (value) => SKILL_CATEGORIES.find((item) => item.value === value) || SKILL_CATEGORIES.at(-1);
export const pretty = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
