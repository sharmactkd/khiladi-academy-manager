import {
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth.js";
import useSidebarWorkspace from "../../hooks/useSidebarWorkspace.js";
import {
  ACADEMY_ROLES,
  dashboardItem,
  isAllowed,
  ownerNavigation,
  PORTAL_ROLES,
  portalNavigation,
  quickCreateItems,
  SIDEBAR_STORAGE_KEY,
  utilityNavigation,
} from "./sidebar.config.js";
import styles from "./Sidebar.module.css";

const isItemActive = (pathname, item) => {
  if (item.activePrefixes?.some((prefix) => {
    const pattern = prefix.replace(/:[^/]+/g, "[^/]+");
    return new RegExp(`^${pattern}(?:/|$)`).test(pathname);
  })) return true;

  if (item.to === "/dashboard" || item.to === "/parent") {
    return pathname === item.to;
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

const activeGroupId = (pathname, groups) =>
  groups.find((group) =>
    group.children.some((item) => isItemActive(pathname, item))
  )?.id || "";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "KA";

const SidebarLink = ({ item, onNavigate, nested = false }) => {
  const Icon = item.icon;
  const { pathname } = useLocation();
  const active = isItemActive(pathname, item);
  return (
    <NavLink
      to={item.to}
      end={item.to === "/dashboard" || item.to === "/parent"}
      onClick={onNavigate}
      className={
        [styles.navLink, nested ? styles.nestedLink : "", active ? styles.activeLink : ""]
          .filter(Boolean)
          .join(" ")
      }
    >
      {Icon ? <Icon size={17} strokeWidth={2} aria-hidden="true" /> : null}
      <span>{item.label}</span>
      {!nested ? <ChevronRight className={styles.linkArrow} size={14} /> : null}
    </NavLink>
  );
};

const NavigationGroup = ({ badge, group, isOpen, onNavigate, onToggle, role }) => {
  const Icon = group.icon;
  const visibleChildren = group.children.filter((item) => isAllowed(item.roles, role));
  if (!visibleChildren.length) return null;

  return (
    <section className={[styles.group, isOpen ? styles.groupOpen : ""].filter(Boolean).join(" ")}>
      <button
        type="button"
        className={styles.groupButton}
        onClick={() => onToggle(group.id)}
        aria-expanded={isOpen}
        aria-controls={`sidebar-group-${group.id}`}
      >
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
        <span>{group.label}</span>
        {badge > 0 ? (
          <b className={styles.badge} aria-label={`${badge} unread`}>
            {badge > 99 ? "99+" : badge}
          </b>
        ) : null}
        <ChevronDown className={styles.groupChevron} size={16} />
      </button>

      <div id={`sidebar-group-${group.id}`} className={styles.groupChildren} hidden={!isOpen}>
        {visibleChildren.map((item) => (
          <SidebarLink key={item.id} item={item} nested onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};

const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const { user, logout } = useAuth();
  const role = user?.role;
  const isPortalUser = PORTAL_ROLES.includes(role);
  const canManageAcademy = ACADEMY_ROLES.includes(role);
  const workspace = useSidebarWorkspace({ enabled: canManageAcademy });
  const groups = useMemo(() => (isPortalUser ? portalNavigation : ownerNavigation), [isPortalUser]);
  const routeGroup = useMemo(
    () => activeGroupId(location.pathname, groups),
    [groups, location.pathname]
  );
  const [openGroup, setOpenGroup] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  useEffect(() => {
    if (routeGroup) setOpenGroup(routeGroup);
  }, [routeGroup]);

  useEffect(() => {
    try {
      if (openGroup) localStorage.setItem(SIDEBAR_STORAGE_KEY, openGroup);
      else localStorage.removeItem(SIDEBAR_STORAGE_KEY);
    } catch {
      // Sidebar stays functional when browser storage is unavailable.
    }
  }, [openGroup]);

  useEffect(() => {
    const closePopovers = (event) => {
      if (!popoverRef.current?.contains(event.target)) {
        setQuickCreateOpen(false);
        setWorkspaceOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setQuickCreateOpen(false);
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("pointerdown", closePopovers);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closePopovers);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleNavigate = () => {
    setQuickCreateOpen(false);
    setWorkspaceOpen(false);
    onClose?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onClose?.();
      navigate("/login", { replace: true });
    }
  };

  const visibleQuickCreate = quickCreateItems.filter((item) => isAllowed(item.roles, role));
  const visibleUtilities = utilityNavigation.filter((item) => isAllowed(item.roles, role));
  const unreadCommunication = Number(
    user?.unreadCommunicationCount || user?.unreadNotificationCount || 0
  );
  const userName = user?.name || user?.fullName || "Academy User";
  const roleLabel = String(role || "member")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <aside
      id="academy-sidebar"
      className={["sidebar", styles.root, isOpen ? "is-open" : ""].filter(Boolean).join(" ")}
      aria-label="Primary navigation"
    >
      <header className={styles.brand}>
        <img src="/khiladi-logo.png" alt="KHILADI" />
        <div><h2>KHILADI</h2><p>Academy Manager</p></div>
        <button
          type="button"
          className={`sidebar-close ${styles.closeButton}`}
          onClick={onClose}
          aria-label="Close navigation menu"
        ><X size={20} /></button>
      </header>

      <div className={styles.body} ref={popoverRef}>
        {canManageAcademy ? (
          <div className={styles.workspaceWrap}>
            <button
              type="button"
              className={styles.workspaceButton}
              onClick={() => {
                setWorkspaceOpen((current) => !current);
                setQuickCreateOpen(false);
              }}
              aria-expanded={workspaceOpen}
            >
              <span className={styles.workspaceLogo}>
                {workspace.logoUrl ? <img src={workspace.logoUrl} alt="" /> : initialsOf(workspace.academyName)}
              </span>
              <span className={styles.workspaceCopy}>
                <strong>{workspace.loading ? "Loading academy…" : workspace.academyName}</strong>
                <small>{workspace.mainBranch?.branchName || "Main Branch"}</small>
              </span>
              <ChevronsUpDown size={16} />
            </button>

            {workspaceOpen ? (
              <div className={styles.workspaceMenu}>
                <NavLink to="/academy/profile" onClick={handleNavigate}>
                  <span className={styles.workspaceMenuIcon}><Building2 size={16} /></span>
                  <span><strong>Academy profile</strong><small>Identity and configuration</small></span>
                </NavLink>
                <div className={styles.workspaceMenuTitle}>Active branches</div>
                {workspace.branches.length ? workspace.branches.slice(0, 6).map((branch) => (
                  <NavLink key={branch._id} to={`/branches/${branch._id}`} onClick={handleNavigate}>
                    <span className={styles.branchDot} />
                    <span>
                      <strong>{branch.branchName || "Branch"}</strong>
                      <small>{branch.isMainBranch ? "Main branch" : "Open details"}</small>
                    </span>
                  </NavLink>
                )) : <p className={styles.workspaceEmpty}>No active branches found.</p>}
              </div>
            ) : null}
          </div>
        ) : null}

        {canManageAcademy ? (
          <div className={styles.quickCreateWrap}>
            <button
              type="button"
              className={styles.quickCreateButton}
              onClick={() => {
                setQuickCreateOpen((current) => !current);
                setWorkspaceOpen(false);
              }}
              aria-expanded={quickCreateOpen}
            >
              <Plus size={18} /><span>Quick Create</span><ChevronDown size={15} />
            </button>
            {quickCreateOpen ? (
              <div className={styles.quickCreateMenu}>
                <header><strong>Create new</strong><small>Start a common workflow</small></header>
                {visibleQuickCreate.map((item) => {
                  const Icon = item.icon;
                  return <NavLink key={item.id} to={item.to} onClick={handleNavigate}><Icon size={16} /><span>{item.label}</span></NavLink>;
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <nav className={`sidebar-nav ${styles.nav}`} aria-label="Workspace navigation">
          {!isPortalUser ? <SidebarLink item={dashboardItem} onNavigate={handleNavigate} /> : null}
          {groups.map((group) => (
            <NavigationGroup
              key={group.id}
              group={group}
              role={role}
              isOpen={openGroup === group.id}
              onToggle={(groupId) => setOpenGroup((current) => current === groupId ? "" : groupId)}
              onNavigate={handleNavigate}
              badge={group.badgeKey === "communication" ? unreadCommunication : 0}
            />
          ))}
        </nav>
      </div>

      <footer className={`sidebar-footer ${styles.footer}`}>
        {visibleUtilities.length ? (
          <div className={styles.utilities}>
            {visibleUtilities.map((item) => <SidebarLink key={item.id} item={item} onNavigate={handleNavigate} />)}
          </div>
        ) : null}
        <div className={styles.userCard}>
          <span className={styles.userAvatar}>{initialsOf(userName)}</span>
          <span className={styles.userCopy}><strong>{userName}</strong><small>{roleLabel}</small></span>
          <UserRound size={17} />
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          <LogOut size={18} /><span>Logout</span>
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
