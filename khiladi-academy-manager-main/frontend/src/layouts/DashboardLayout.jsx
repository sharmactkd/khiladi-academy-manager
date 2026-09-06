import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import Sidebar from "../components/common/Sidebar.jsx";
import LegacyRouteHero, { isLegacyThemedRoute } from "../components/common/LegacyRouteHero.jsx";

const DashboardLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const legacyTheme = isLegacyThemedRoute(location.pathname);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Route change hone par mobile sidebar close ho jayega.
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  // Escape key aur background scroll handling.
  useEffect(() => {
    document.body.classList.toggle("drawer-open", sidebarOpen);

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("drawer-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen]);

  return (
    <div className="dashboard-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <button
        type="button"
        className={[
          "sidebar-overlay",
          sidebarOpen ? "is-visible" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Close navigation menu"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={closeSidebar}
      />

      <main className="dashboard-main">
        <Navbar onMenuClick={openSidebar} />

        <section className="dashboard-content">
          <div data-legacy-theme={legacyTheme ? "true" : "false"}>
            {legacyTheme ? <LegacyRouteHero /> : null}
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
