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
            <NavLink to="/students">Students</NavLink>
            <NavLink to="/batches">Batches</NavLink>
            <NavLink to="/attendance">Attendance</NavLink>
          </>
        )}

        {canManageFees && <NavLink to="/fees">Fees</NavLink>}

        {user?.role === "super_admin" && (
          <NavLink to="/admin/users">Admin Users</NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;