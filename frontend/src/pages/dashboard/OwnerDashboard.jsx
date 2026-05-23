import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { academyApi } from "../../api/academyApi.js";
import { billingApi } from "../../api/billingApi.js";
import { getDashboardAnalytics } from "../../api/analyticsApi.js";

import useAuth from "../../hooks/useAuth.js";
import UsageMeter from "../../components/billing/UsageMeter.jsx";

const OwnerDashboard = () => {
  const { user } = useAuth();

  const [academy, setAcademy] = useState(null);
  const [billing, setBilling] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const canManageRecords = [
    "super_admin",
    "academy_owner",
    "assistant_coach",
  ].includes(user?.role);

  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const canManageBilling = ["super_admin", "academy_owner"].includes(user?.role);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const academyResponse = await academyApi.getMyAcademy();
        setAcademy(academyResponse.data?.data?.academy || null);

        if (canManageBilling) {
          const billingResponse = await billingApi.getMySubscription();
          setBilling(billingResponse.data?.data || null);
        }

        if (canManageRecords) {
          try {
            const analyticsResponse = await getDashboardAnalytics();
            setAnalytics(analyticsResponse.data || null);
          } catch {
            setAnalytics(null);
          }
        }
      } catch {
        setAcademy(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [canManageBilling, canManageRecords]);

  const plan = billing?.plan || {};
  const usage = billing?.usage || {};
  const limits = plan?.limits || {};

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p className="muted">Manage your academy foundation from here.</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Current User</h3>
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email || "Not added"}
          </p>
          <p>
            <strong>Phone:</strong> {user?.phone || "Not added"}
          </p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
        </div>

        <div className="card">
          <h3>Academy Profile</h3>

          {loading ? (
            <p>Loading academy...</p>
          ) : academy ? (
            <>
              <p>
                <strong>Name:</strong> {academy.academyName}
              </p>
              <p>
                <strong>Martial Arts:</strong>{" "}
                {academy.martialArts?.join(", ")}
              </p>
              <p>
                <strong>City:</strong> {academy.city || "Not added"}
              </p>
              <p>
                <strong>Plan:</strong> {academy.subscriptionPlan || "free"}
              </p>
            </>
          ) : (
            <>
              <p className="muted">
                You have not created your academy profile yet.
              </p>
              <Link className="btn btn-primary" to="/onboarding/create-academy">
                Create Academy Profile
              </Link>
            </>
          )}
        </div>
      </div>

      {canManageBilling && billing && (
        <div className="card dashboard-section">
          <h3>Phase 5 — SaaS Billing</h3>
          <p className="muted">
            Current plan: <strong>{plan.name || "Free"}</strong>
          </p>

          <div className="usage-grid">
            <UsageMeter
              label="Students"
              used={usage.students}
              limit={limits.students}
            />
            <UsageMeter
              label="Batches"
              used={usage.batches}
              limit={limits.batches}
            />
            <UsageMeter
              label="Certificates"
              used={usage.certificates}
              limit={limits.certificates}
            />
            <UsageMeter
              label="ID Cards"
              used={usage.idCards}
              limit={limits.idCards}
            />
            <UsageMeter
              label="Announcements"
              used={usage.announcements}
              limit={limits.announcements}
            />
          </div>

          <div className="dashboard-actions">
            <Link to="/plans">View Plans</Link>
            <Link to="/billing">Billing Dashboard</Link>
            <Link to="/billing/invoices">Invoices</Link>
            <Link to="/billing/payments">Payment History</Link>
          </div>
        </div>
      )}

      {canManageRecords && analytics && (
        <div className="card dashboard-section">
          <h3>Phase 6 — Analytics & Multi-Branch</h3>
          <p className="muted">
            View branch-wise analytics, reports, skill tracking and student
            performance.
          </p>

          <div className="usage-grid">
            <UsageMeter
              label="Total Students"
              used={analytics.totalStudents || 0}
              limit="∞"
            />
            <UsageMeter
              label="Active Students"
              used={analytics.activeStudents || 0}
              limit="∞"
            />
            <UsageMeter
              label="Batches"
              used={analytics.totalBatches || 0}
              limit="∞"
            />
            <UsageMeter
              label="Certificates"
              used={analytics.certificatesIssued || 0}
              limit="∞"
            />
          </div>

          <div className="dashboard-actions">
            <Link to="/branches">Branches</Link>
            <Link to="/analytics">Analytics Dashboard</Link>
            <Link to="/reports">Reports</Link>
            <Link to="/skills">Skills</Link>
            <Link to="/skill-assessments">Skill Assessments</Link>
          </div>
        </div>
      )}

      {canManageRecords && (
        <>
          <div className="card dashboard-section">
            <h3>Phase 3 — Records & Documents</h3>
            <p className="muted">
              Manage belt tests, championships, student timelines, ID cards and
              certificates.
            </p>

            <div className="dashboard-actions">
              <Link to="/belt-tests">Belt Tests</Link>
              <Link to="/championship-records">Championship Records</Link>
              <Link to="/id-card-templates">ID Card Templates</Link>
              <Link to="/id-cards/generate">Generate ID Card</Link>
              <Link to="/certificate-templates">Certificate Templates</Link>
              <Link to="/certificates/generate">Generate Certificate</Link>
            </div>
          </div>

          <div className="card dashboard-section">
            <h3>Phase 4 — Parent Portal & Communication</h3>
            <p className="muted">
              Link parents, publish announcements, send reminders and track
              communication logs.
            </p>

            <div className="dashboard-actions">
              <Link to="/parent-links">Parent Links</Link>
              <Link to="/announcements">Announcements</Link>
              <Link to="/announcements/new">Create Announcement</Link>
              <Link to="/communication-logs">Communication Logs</Link>
              <Link to="/reminders/attendance">Attendance Reminder</Link>
              {canManageFees && <Link to="/reminders/fee">Fee Reminder</Link>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnerDashboard;