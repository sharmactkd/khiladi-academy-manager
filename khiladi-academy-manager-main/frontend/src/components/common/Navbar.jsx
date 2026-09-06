import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Menu,
  UserRound,
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import { notificationApi } from "../../api/notificationApi.js";
import useAuth from "../../hooks/useAuth.js";

const pageNames = {
  dashboard: "Dashboard",
  academy: "Academy Profile",
  branches: "Branches",
  batches: "Batches",
  attendance: "Attendance",
  students: "Students",
  fees: "Fees",
  "belt-tests": "Belt Tests",
  "championship-records": "Championships",
  "id-cards": "ID Cards",
  "id-card-templates": "ID Card Templates",
  certificates: "Certificates",
  "certificate-templates": "Certificate Templates",
  analytics: "Analytics",
  reports: "Reports",
  skills: "Skills",
  "skill-assessments": "Skill Assessments",
  announcements: "Announcements",
  "my-announcements": "My Announcements",
  "communication-logs": "Communication Logs",
  reminders: "Reminders",
  notifications: "Notifications",
  plans: "Plans",
  billing: "Billing",
  parent: "Parent Portal",
  admin: "Administration",
  onboarding: "Academy Setup",
  "parent-links": "Parent Links",
  "smart-timeline": "Smart Timeline",
  timeline: "Student Timeline",
  performance: "Performance",
  "tournament-integration": "Tournament Integration",
};

const formatPageTitle = (pathname) => {
  const segments = pathname
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) {
    return "Dashboard";
  }

  const firstSegment = segments[0];

  if (pageNames[firstSegment]) {
    return pageNames[firstSegment];
  }

  return firstSegment
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      if (!isAuthenticated || !user) {
        if (isMounted) {
          setUnreadCount(0);
        }

        return;
      }

      try {
        const response =
          await notificationApi.getAll({
            isRead: false,
            limit: 1,
          });

        if (isMounted) {
          setUnreadCount(
            response.data?.data?.unreadCount || 0
          );
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    };

    loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return null;
  }

  const notificationLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  return (
    <Link
      className="notification-bell"
      to="/notifications"
      aria-label={notificationLabel}
      title={notificationLabel}
    >
      <Bell
        size={20}
        aria-hidden="true"
      />

      {unreadCount > 0 && (
        <strong>
          {unreadCount > 99 ? "99+" : unreadCount}
        </strong>
      )}
    </Link>
  );
};

const Navbar = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = useMemo(
    () => formatPageTitle(location.pathname),
    [location.pathname]
  );

  const displayName =
    user?.name ||
    user?.email ||
    user?.phone ||
    "Account";

  const displayRole = user?.role
    ? user.role.replaceAll("_", " ")
    : "User";

  return (
    <header className="navbar">
      <div className="navbar-heading">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-controls="academy-sidebar"
        >
          <Menu
            size={22}
            aria-hidden="true"
          />
        </button>

        <div className="navbar-title">
          <span className="navbar-eyebrow">
            Academy Manager
          </span>

          <h2 title={pageTitle}>
            {pageTitle}
          </h2>
        </div>
      </div>

      <div className="navbar-actions">
        <NotificationBell />

        <div
          className="navbar-user"
          title={`${displayName} — ${displayRole}`}
        >
          <span
            className="navbar-avatar"
            aria-hidden="true"
          >
            <UserRound size={18} />
          </span>

          <span className="navbar-user-copy">
            <strong>{displayName}</strong>
            <small>{displayRole}</small>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;