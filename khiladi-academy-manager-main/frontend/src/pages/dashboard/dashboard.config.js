import {
  Award,
  CalendarCheck2,
  IdCard,
  IndianRupee,
  Medal,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

export const getQuickActions = (canManageFees) => [
  {
    icon: CalendarCheck2,
    label: "Attendance",
    to: "/attendance",
  },
  {
    icon: UserPlus,
    label: "Add student",
    to: "/students/new",
  },
  canManageFees
    ? {
        icon: IndianRupee,
        label: "Collect fee",
        to: "/fees",
      }
    : null,
  {
    icon: IdCard,
    label: "Generate ID",
    to: "/id-cards/generate",
  },
  {
    icon: Award,
    label: "Belt tests",
    to: "/belt-tests",
  },
  {
    icon: Trophy,
    label: "Championships",
    to: "/championship-records",
  },
].filter(Boolean);

export const MANAGEMENT_GROUPS = [
  {
    icon: Users,
    title: "Academy records",
    description: "Students, branches, batches and reports.",
    links: [
      { label: "Students", to: "/students" },
      { label: "Branches", to: "/branches" },
      { label: "Reports", to: "/reports" },
    ],
  },
  {
    icon: Trophy,
    title: "Achievements",
    description: "Belt tests, championships and performance.",
    links: [
      { label: "Belt tests", to: "/belt-tests" },
      { label: "Championships", to: "/championship-records" },
      { label: "Skills", to: "/skills" },
    ],
  },
  {
    icon: IdCard,
    title: "Documents",
    description: "Generate professional identity and award documents.",
    links: [
      { label: "ID cards", to: "/id-cards/generate" },
      { label: "Certificates", to: "/certificates/generate" },
      { label: "Templates", to: "/certificate-templates" },
    ],
  },
  {
    icon: Medal,
    title: "Communication",
    description: "Parent links, announcements and reminders.",
    links: [
      { label: "Parents", to: "/parent-links" },
      { label: "Announcements", to: "/announcements" },
      { label: "Logs", to: "/communication-logs" },
    ],
  },
];
