import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const Sidebar = () => {
  const { user } = useAuth();

  const canManageAcademy = ["super_admin", "academy_owner", "assistant_coach"].includes(
    user?.role
  );

  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>KHILADI</h2>
        <p>Academy Manager</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/onboarding/create-academy">Academy Profile</NavLink>

        {canManageAcademy && (
          <>
            <div className="sidebar-section-title">Academy</div>
            <NavLink to="/students">Students</NavLink>
            <NavLink to="/batches">Batches</NavLink>
            <NavLink to="/attendance">Attendance</NavLink>

            <div className="sidebar-section-title">Records</div>
            <NavLink to="/belt-tests">Belt Tests</NavLink>
            <NavLink to="/championship-records">Championships</NavLink>
            <NavLink to="/id-card-templates">ID Card Templates</NavLink>
            <NavLink to="/id-cards/generate">Generate ID Card</NavLink>
            <NavLink to="/certificate-templates">Certificate Templates</NavLink>
            <NavLink to="/certificates/generate">Generate Certificate</NavLink>
          </>
        )}

        {canManageFees && (
          <>
            <div className="sidebar-section-title">Finance</div>
            <NavLink to="/fees">Fees</NavLink>
          </>
        )}

        {user?.role === "super_admin" && (
          <>
            <div className="sidebar-section-title">Admin</div>
            <NavLink to="/admin/users">Admin Users</NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;