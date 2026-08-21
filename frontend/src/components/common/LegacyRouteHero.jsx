import { Bell, BookOpenCheck, CalendarDays, FileBadge, GraduationCap, Link2, Medal, ShieldCheck, Trophy, Users } from "lucide-react";
import { useLocation } from "react-router-dom";
import BatchAcademyHeader from "../../pages/batches/components/BatchAcademyHeader.jsx";
import useAuth from "../../hooks/useAuth.js";

const ROUTES = [
  { pattern: /^\/fees\/(plans|pending|students-status)/, eyebrow: "Fee operations", title: "Fee Management", description: "Plans, outstanding accounts and student fee status.", icon: ShieldCheck },
  { pattern: /^\/fees\/student\//, eyebrow: "Student accounts", title: "Student Fee History", description: "Complete payment, due and receipt history.", icon: ShieldCheck },
  { pattern: /^\/attendance\/batch\//, eyebrow: "Attendance records", title: "Batch Attendance History", description: "Batch consistency and historical attendance records.", icon: CalendarDays },
  { pattern: /^\/students\/[^/]+\/belt-history/, eyebrow: "Progress records", title: "Belt History", description: "Promotion journey, assessments and certification records.", icon: Medal },
  { pattern: /^\/students\/[^/]+\/(timeline|smart-timeline|performance)/, eyebrow: "Athlete intelligence", title: "Student Development", description: "Timeline, performance and training progress.", icon: GraduationCap },
  { pattern: /^\/announcements\/(new|[^/]+)/, eyebrow: "Communication desk", title: "Announcement Workspace", description: "Create, review and publish academy communication.", icon: Bell },
  { pattern: /^\/parent-links\/new|^\/students\/[^/]+\/parent-links/, eyebrow: "Family access", title: "Parent Access", description: "Secure guardian access and portal permissions.", icon: Link2 },
  { pattern: /^\/tournament-sync|^\/students\/[^/]+\/tournament-history/, eyebrow: "Tournament integration", title: "Tournament Workspace", description: "Entries, synchronization and imported competition results.", icon: Trophy },
  { pattern: /^\/students\/[^/]+\/(id-cards|certificates)/, eyebrow: "Student documents", title: "Issued Documents", description: "Student identity cards and certificate history.", icon: FileBadge },
  { pattern: /^\/onboarding\/create-academy/, eyebrow: "Academy setup", title: "Create Academy Profile", description: "Identity, location, branding and operational settings.", icon: BookOpenCheck },
];

const isParentPortalRoute = (pathname) => pathname === "/parent" || pathname.startsWith("/parent/");
export const isLegacyThemedRoute = (pathname) => ROUTES.some((item) => item.pattern.test(pathname)) || pathname === "/notifications" || pathname === "/my-announcements" || isParentPortalRoute(pathname);

const LegacyRouteHero = () => {
  const { pathname } = useLocation(); const { user } = useAuth();
  if (isParentPortalRoute(pathname) || pathname === "/notifications" || pathname === "/my-announcements") {
    return <header className="legacy-parent-hero"><div><span><Users size={24}/></span><section><small>KHILADI FAMILY PORTAL</small><h1>Parent & Student Portal</h1><p>Attendance, fees, progress, documents and academy updates in one secure place.</p></section></div><aside><ShieldCheck size={18}/><p><strong>{user?.name || "Portal User"}</strong><small>{user?.role === "student" ? "Student access" : "Verified family access"}</small></p></aside></header>;
  }
  const config = ROUTES.find((item) => item.pattern.test(pathname));
  if (!config) return null;
  const Icon = config.icon;
  return <><BatchAcademyHeader/><div className="legacy-workspace-title"><span><Icon size={23}/></span><div><small>{config.eyebrow}</small><h1>{config.title}</h1><p>{config.description}</p></div></div></>;
};

export default LegacyRouteHero;
