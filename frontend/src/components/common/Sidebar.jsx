import {
  BadgeIndianRupee,
  BarChart3,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarCheck2,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileBadge,
  FileChartColumn,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Link2,
  LogOut,
  Medal,
  Megaphone,
  MessageSquareText,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth.js";

const SidebarLink = ({
  to,
  label,
  icon: Icon,
  onNavigate,
}) => {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        isActive ? "active" : undefined
      }
    >
      <Icon
        className="sidebar-link-icon"
        size={17}
        strokeWidth={2}
        aria-hidden="true"
      />

      <span className="sidebar-link-label">
        {label}
      </span>

      <ChevronRight
        className="sidebar-link-arrow"
        size={14}
        aria-hidden="true"
      />
    </NavLink>
  );
};

const SidebarSection = ({ children, title }) => {
  return (
    <div className="sidebar-section">
      {title && (
        <div className="sidebar-section-title">
          {title}
        </div>
      )}

      {children}
    </div>
  );
};

const Sidebar = ({
  isOpen = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.role;

  const canManageAcademy = [
    "super_admin",
    "academy_owner",
    "assistant_coach",
  ].includes(role);

  const canManageFees = [
    "super_admin",
    "academy_owner",
  ].includes(role);

  const canManageBilling = [
    "super_admin",
    "academy_owner",
  ].includes(role);

  const canManageOwnerOnly = [
    "super_admin",
    "academy_owner",
  ].includes(role);

  const isParentPortalUser = [
    "parent",
    "student",
  ].includes(role);

  const handleNavigate = () => {
    onClose?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onClose?.();
      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <aside
      id="academy-sidebar"
      className={[
        "sidebar",
        isOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Primary navigation"
    >
      <div className="sidebar-brand">
        <img
          src="/khiladi-logo.png"
          alt="KHILADI"
          className="sidebar-logo"
        />

        <div className="sidebar-brand-copy">
          <h2>KHILADI</h2>
          <p>Academy Manager</p>
        </div>

        <button
          type="button"
          className="icon-btn sidebar-close"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X
            size={20}
            aria-hidden="true"
          />
        </button>
      </div>

      <nav className="sidebar-nav">
        {!isParentPortalUser && (
          <SidebarSection>
            <SidebarLink
              to="/dashboard"
              label="Dashboard"
              icon={LayoutDashboard}
              onNavigate={handleNavigate}
            />
          </SidebarSection>
        )}

        {isParentPortalUser && (
          <SidebarSection title="Parent Portal">
            <SidebarLink
              to="/parent"
              label="My Students"
              icon={Users}
              onNavigate={handleNavigate}
            />

            <SidebarLink
              to="/my-announcements"
              label="My Announcements"
              icon={Megaphone}
              onNavigate={handleNavigate}
            />

            <SidebarLink
              to="/notifications"
              label="Notifications"
              icon={Bell}
              onNavigate={handleNavigate}
            />
          </SidebarSection>
        )}

        {canManageAcademy && (
          <>
            <SidebarSection title="Academy">
              <SidebarLink
                to="/academy/profile"
                label="Academy Profile"
                icon={Building2}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/branches"
                label="Branches"
                icon={Building2}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/batches"
                label="Batches"
                icon={Users}
                onNavigate={handleNavigate}
              />

             <SidebarLink
  to="/attendance"
  label="Attendance"
  icon={CalendarCheck2}
  onNavigate={handleNavigate}
/>

              <SidebarLink
                to="/students"
                label="Students"
                icon={GraduationCap}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/fees"
                label="Fees"
                icon={BadgeIndianRupee}
                onNavigate={handleNavigate}
              />
            </SidebarSection>

            <SidebarSection title="Records">
              <SidebarLink
                to="/belt-tests"
                label="Belt Tests"
                icon={Medal}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/championship-records"
                label="Championships"
                icon={Trophy}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/id-cards/generate"
                label="Generate ID Card"
                icon={IdCard}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/certificates/generate"
                label="Generate Certificate"
                icon={FileBadge}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/id-card-templates"
                label="ID Card Templates"
                icon={WalletCards}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/certificate-templates"
                label="Certificate Templates"
                icon={FileText}
                onNavigate={handleNavigate}
              />
            </SidebarSection>

            <SidebarSection title="Analytics">
              <SidebarLink
                to="/analytics"
                label="Dashboard Analytics"
                icon={BarChart3}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/analytics/students"
                label="Student Analytics"
                icon={ChartNoAxesCombined}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/analytics/attendance"
                label="Attendance Analytics"
                icon={CalendarCheck2}
                onNavigate={handleNavigate}
              />

              {canManageFees && (
                <SidebarLink
                  to="/analytics/fees"
                  label="Fees Analytics"
                  icon={CircleDollarSign}
                  onNavigate={handleNavigate}
                />
              )}

              <SidebarLink
                to="/analytics/performance"
                label="Performance Analytics"
                icon={ChartNoAxesCombined}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/reports"
                label="Reports"
                icon={FileChartColumn}
                onNavigate={handleNavigate}
              />
            </SidebarSection>

            <SidebarSection title="Skills">
              <SidebarLink
                to="/skills"
                label="Skills"
                icon={Sparkles}
                onNavigate={handleNavigate}
              />

              {canManageOwnerOnly && (
                <SidebarLink
                  to="/skills/new"
                  label="Add Skill"
                  icon={BookOpenCheck}
                  onNavigate={handleNavigate}
                />
              )}

              <SidebarLink
                to="/skill-assessments"
                label="Skill Assessments"
                icon={ClipboardCheck}
                onNavigate={handleNavigate}
              />
            </SidebarSection>

            <SidebarSection title="Communication">
              <SidebarLink
                to="/parent-links"
                label="Parent Links"
                icon={Link2}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/announcements"
                label="Announcements"
                icon={Megaphone}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/communication-logs"
                label="Communication Logs"
                icon={MessageSquareText}
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/reminders/attendance"
                label="Attendance Reminder"
                icon={Bell}
                onNavigate={handleNavigate}
              />

              {canManageFees && (
                <SidebarLink
                  to="/reminders/fee"
                  label="Fee Reminder"
                  icon={ReceiptIndianRupee}
                  onNavigate={handleNavigate}
                />
              )}

              <SidebarLink
                to="/notifications"
                label="Notifications"
                icon={Bell}
                onNavigate={handleNavigate}
              />
            </SidebarSection>
          </>
        )}

        {canManageBilling && (
          <SidebarSection title="SaaS Billing">
            <SidebarLink
              to="/plans"
              label="Plans"
              icon={WalletCards}
              onNavigate={handleNavigate}
            />

            <SidebarLink
              to="/billing"
              label="Billing"
              icon={CreditCard}
              onNavigate={handleNavigate}
            />

            <SidebarLink
              to="/billing/invoices"
              label="Invoices"
              icon={FileText}
              onNavigate={handleNavigate}
            />

            <SidebarLink
              to="/billing/payments"
              label="Payments"
              icon={CircleDollarSign}
              onNavigate={handleNavigate}
            />
          </SidebarSection>
        )}

        {role === "super_admin" && (
          <SidebarSection title="Admin">
            <SidebarLink
              to="/admin/users"
              label="Admin Users"
              icon={UserRoundCog}
              onNavigate={handleNavigate}
            />

            <SidebarLink
              to="/admin/grants"
              label="Admin Grants"
              icon={ShieldCheck}
              onNavigate={handleNavigate}
            />
          </SidebarSection>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut
            size={18}
            aria-hidden="true"
          />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;