import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const canManageAcademy = [
    "super_admin",
    "academy_owner",
    "assistant_coach",
  ].includes(user?.role);

  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const canManageBilling = ["super_admin", "academy_owner"].includes(user?.role);
  const canManageOwnerOnly = ["super_admin", "academy_owner"].includes(user?.role);
  const isParentPortalUser = ["parent", "student"].includes(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>KHILADI</h2>
        <p>Academy Manager</p>
      </div>

      <nav className="sidebar-nav">
        {!isParentPortalUser && <NavLink to="/dashboard">Dashboard</NavLink>}

        {isParentPortalUser && (
          <>
            <div className="sidebar-section-title">Parent Portal</div>
            <NavLink to="/parent">My Students</NavLink>
            <NavLink to="/my-announcements">My Announcements</NavLink>
            <NavLink to="/notifications">Notifications</NavLink>
          </>
        )}

      
        {canManageAcademy && (
          <>
                       <div className="sidebar-section-title">Academy</div>
                       <NavLink to="/academy/profile">Academy Profile</NavLink>
                       
                  <NavLink to="/branches">Branches</NavLink>
            <NavLink to="/batches">Batches</NavLink>
            <NavLink to="/attendance">Attendance</NavLink>
            <NavLink to="/attendance/monthly-register">Monthly Attendance</NavLink>
            <NavLink to="/students">Students</NavLink>
           
                 <NavLink to="/fees">Fees</NavLink>
            
              <div className="sidebar-section-title">Records</div>
            <NavLink to="/belt-tests">Belt Tests</NavLink>
            <NavLink to="/championship-records">Championships</NavLink>
            
            <NavLink to="/id-cards/generate">Generate ID Card</NavLink>
            
            <NavLink to="/certificates/generate">Generate Certificate</NavLink>
            <NavLink to="/id-card-templates">ID Card Templates</NavLink>
            <NavLink to="/certificate-templates">Certificate Templates</NavLink>

            <div className="sidebar-section-title">Analytics</div>
            <NavLink to="/analytics">Dashboard Analytics</NavLink>
            <NavLink to="/analytics/students">Student Analytics</NavLink>
            <NavLink to="/analytics/attendance">Attendance Analytics</NavLink>
            {canManageFees && <NavLink to="/analytics/fees">Fees Analytics</NavLink>}
            <NavLink to="/analytics/performance">Performance Analytics</NavLink>
            <NavLink to="/reports">Reports</NavLink>

            <div className="sidebar-section-title">Skills</div>
            <NavLink to="/skills">Skills</NavLink>
            {canManageOwnerOnly && <NavLink to="/skills/new">Add Skill</NavLink>}
            <NavLink to="/skill-assessments">Skill Assessments</NavLink>

          

            <div className="sidebar-section-title">Communication</div>
            <NavLink to="/parent-links">Parent Links</NavLink>
            <NavLink to="/announcements">Announcements</NavLink>
            <NavLink to="/communication-logs">Communication Logs</NavLink>
            <NavLink to="/reminders/attendance">Attendance Reminder</NavLink>
            {canManageFees && <NavLink to="/reminders/fee">Fee Reminder</NavLink>}
            <NavLink to="/notifications">Notifications</NavLink>
          </>
        )}

       

          {canManageBilling && (
          <>
            <div className="sidebar-section-title">SaaS Billing</div>
            <NavLink to="/plans">Plans</NavLink>
            <NavLink to="/billing">Billing</NavLink>
            <NavLink to="/billing/invoices">Invoices</NavLink>
            <NavLink to="/billing/payments">Payments</NavLink>
          </>
        )}

        {user?.role === "super_admin" && (
          <>
            <div className="sidebar-section-title">Admin</div>
            <NavLink to="/admin/users">Admin Users</NavLink>
            <NavLink to="/admin/grants">Admin Grants</NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;