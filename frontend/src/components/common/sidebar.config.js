import {
  BarChart3,
  Building2,
  CalendarCheck2,
  CircleDollarSign,
  CreditCard,
  FileChartColumn,
  FileStack,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Medal,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

export const SIDEBAR_STORAGE_KEY = "khiladi.sidebar.open-group";

export const OWNER_ROLES = ["super_admin", "academy_owner"];
export const ACADEMY_ROLES = [
  "super_admin",
  "academy_owner",
  "assistant_coach",
];
export const PORTAL_ROLES = ["parent", "student"];

export const isAllowed = (roles, role) => !roles || roles.includes(role);

export const dashboardItem = {
  id: "dashboard",
  label: "Dashboard",
  to: "/dashboard",
  icon: LayoutDashboard,
};

export const ownerNavigation = [
  {
    id: "academy",
    label: "Academy",
    icon: Building2,
    children: [
      { id: "academy-profile", label: "Academy Profile", to: "/academy/profile" },
      { id: "branches", label: "Branches", to: "/branches" },
      { id: "batches", label: "Batches", to: "/batches" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: FileStack,
    children: [
      { id: "students", label: "Students", to: "/students", icon: GraduationCap },
      { id: "attendance", label: "Attendance", to: "/attendance", icon: CalendarCheck2 },
      {
        id: "fees",
        label: "Fees",
        to: "/fees",
        icon: CircleDollarSign,
        roles: OWNER_ROLES,
      },
    ],
  },
  {
    id: "development",
    label: "Development",
    icon: Trophy,
    children: [
      {
        id: "belt-tests",
        label: "Belt Tests",
        to: "/belt-tests",
        icon: Medal,
        activePrefixes: ["/belt-tests", "/students/:studentId/belt-history"],
      },
      {
        id: "championships",
        label: "Championships",
        to: "/championship-records",
        icon: Trophy,
        activePrefixes: [
          "/championship-records",
          "/students/:studentId/championship-history",
        ],
      },
      { id: "skills", label: "Skills & Assessments", to: "/skills", icon: Sparkles },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: IdCard,
    children: [
      {
        id: "id-card-studio",
        label: "ID Card Studio",
        to: "/id-card-templates",
        icon: IdCard,
        activePrefixes: ["/id-card-templates", "/id-cards", "/students/:studentId/id-cards"],
      },
      {
        id: "certificate-studio",
        label: "Certificate Studio",
        to: "/certificate-templates",
        icon: ShieldCheck,
        activePrefixes: [
          "/certificate-templates",
          "/certificates",
          "/students/:studentId/certificates",
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: BarChart3,
    children: [
      { id: "analytics", label: "Analytics Studio", to: "/analytics", icon: BarChart3 },
      { id: "reports", label: "Reports", to: "/reports", icon: FileChartColumn },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: MessageSquareText,
    badgeKey: "communication",
    children: [
      {
        id: "communication-hub",
        label: "Communication Hub",
        to: "/communication",
        icon: MessageSquareText,
      },
    ],
  },
];

export const portalNavigation = [
  {
    id: "portal",
    label: "Parent Portal",
    icon: UsersRound,
    children: [
      { id: "my-students", label: "My Students", to: "/parent", icon: UsersRound },
      {
        id: "my-announcements",
        label: "My Announcements",
        to: "/my-announcements",
        icon: MessageSquareText,
      },
      {
        id: "notifications",
        label: "Notifications",
        to: "/notifications",
        icon: CalendarCheck2,
      },
    ],
  },
];

export const utilityNavigation = [
  {
    id: "billing",
    label: "Subscription & Billing",
    to: "/billing",
    icon: CreditCard,
    roles: OWNER_ROLES,
  },
  {
    id: "admin",
    label: "Admin Control Center",
    to: "/admin",
    icon: UserRoundCog,
    roles: ["super_admin"],
  },
];

export const quickCreateItems = [
  { id: "student", label: "Add student", to: "/students/new", icon: GraduationCap },
  { id: "attendance", label: "Mark attendance", to: "/attendance", icon: CalendarCheck2 },
  {
    id: "fee",
    label: "Collect fee",
    to: "/fees/collect",
    icon: CircleDollarSign,
    roles: OWNER_ROLES,
  },
  { id: "belt-test", label: "Add belt test", to: "/belt-tests/new", icon: Medal },
  {
    id: "championship",
    label: "Add championship",
    to: "/championship-records/new",
    icon: Trophy,
  },
  { id: "branch", label: "Add branch", to: "/branches/new", icon: Building2 },
  { id: "batch", label: "Add batch", to: "/batches/new", icon: Plus },
];
