import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>KHILADI</h2>
        <p>Academy Manager</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/onboarding/create-academy">Academy Profile</NavLink>

        {user?.role === "super_admin" && (
          <NavLink to="/admin/users">Admin Users</NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;