import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";

import OwnerDashboard from "../pages/dashboard/OwnerDashboard.jsx";
import CreateAcademy from "../pages/onboarding/CreateAcademy.jsx";

import AdminControlCenter from "../pages/admin/AdminControlCenter.jsx";

import Unauthorized from "../pages/errors/Unauthorized.jsx";
import NotFound from "../pages/errors/NotFound.jsx";

import AcademyProfile from "../pages/academy/AcademyProfile.jsx";

import Students from "../pages/students/Students.jsx";
import AddStudent from "../pages/students/AddStudent.jsx";
import EditStudent from "../pages/students/EditStudent.jsx";
import StudentProfile from "../pages/students/StudentProfile.jsx";

import Batches from "../pages/batches/Batches.jsx";
import AddBatch from "../pages/batches/AddBatch.jsx";
import EditBatch from "../pages/batches/EditBatch.jsx";
import BatchDetail from "../pages/batches/BatchDetail.jsx";

import Attendance from "../pages/attendance/Attendance.jsx";
import StudentAttendanceHistory from "../pages/attendance/StudentAttendanceHistory.jsx";
import BatchAttendanceHistory from "../pages/attendance/BatchAttendanceHistory.jsx";

import FeesDashboard from "../pages/fees/FeesDashboard.jsx";
import FeePlans from "../pages/fees/FeePlans.jsx";
import CollectFee from "../pages/fees/CollectFee.jsx";
import PendingFees from "../pages/fees/PendingFees.jsx";
import StudentFeeHistory from "../pages/fees/StudentFeeHistory.jsx";
import ReceiptView from "../pages/fees/ReceiptView.jsx";
import AllStudentsFeeStatus from "../pages/fees/AllStudentsFeeStatus.jsx";
import PaymentHistory from "../pages/fees/PaymentHistory.jsx";

import BeltTests from "../pages/beltTests/BeltTests.jsx";
import AddBeltTest from "../pages/beltTests/AddBeltTest.jsx";
import EditBeltTest from "../pages/beltTests/EditBeltTest.jsx";
import StudentBeltHistory from "../pages/beltTests/StudentBeltHistory.jsx";

import ChampionshipRecords from "../pages/championships/ChampionshipRecords.jsx";
import AddChampionshipRecord from "../pages/championships/AddChampionshipRecord.jsx";
import EditChampionshipRecord from "../pages/championships/EditChampionshipRecord.jsx";
import StudentChampionshipHistory from "../pages/championships/StudentChampionshipHistory.jsx";

import StudentTimeline from "../pages/timeline/StudentTimeline.jsx";

import IdCardTemplates from "../pages/idCards/IdCardTemplates.jsx";
import GenerateIdCard from "../pages/idCards/GenerateIdCard.jsx";
import PrintIdCard from "../pages/idCards/PrintIdCard.jsx";
import StudentIdCards from "../pages/idCards/StudentIdCards.jsx";
import VerifyIdCard from "../pages/idCards/VerifyIdCard.jsx";

import CertificateTemplates from "../pages/certificates/CertificateTemplates.jsx";
import GenerateCertificate from "../pages/certificates/GenerateCertificate.jsx";
import PrintCertificate from "../pages/certificates/PrintCertificate.jsx";
import StudentCertificates from "../pages/certificates/StudentCertificates.jsx";
import VerifyCertificate from "../pages/certificates/VerifyCertificate.jsx";

import CreateParentLink from "../pages/parentLinks/CreateParentLink.jsx";
import StudentParentLinks from "../pages/parentLinks/StudentParentLinks.jsx";

import ParentDashboard from "../pages/parentPortal/ParentDashboard.jsx";
import ParentStudentProfile from "../pages/parentPortal/ParentStudentProfile.jsx";
import ParentStudentAttendance from "../pages/parentPortal/ParentStudentAttendance.jsx";
import ParentStudentFees from "../pages/parentPortal/ParentStudentFees.jsx";
import ParentStudentProgress from "../pages/parentPortal/ParentStudentProgress.jsx";
import ParentStudentDocuments from "../pages/parentPortal/ParentStudentDocuments.jsx";

import CreateAnnouncement from "../pages/announcements/CreateAnnouncement.jsx";
import AnnouncementDetail from "../pages/announcements/AnnouncementDetail.jsx";
import MyAnnouncements from "../pages/announcements/MyAnnouncements.jsx";

import Notifications from "../pages/notifications/Notifications.jsx";

import CommunicationHub from "../pages/communication/CommunicationHub.jsx";

import SubscriptionBillingHub from "../pages/billing/SubscriptionBillingHub.jsx";
import Checkout from "../pages/billing/Checkout.jsx";
import PaymentSuccess from "../pages/billing/PaymentSuccess.jsx";
import PaymentFailed from "../pages/billing/PaymentFailed.jsx";
import InvoiceDetail from "../pages/billing/InvoiceDetail.jsx";

import Branches from "../pages/branches/Branches.jsx";
import AddBranch from "../pages/branches/AddBranch.jsx";
import EditBranch from "../pages/branches/EditBranch.jsx";
import BranchDetail from "../pages/branches/BranchDetail.jsx";

import AnalyticsStudio from "../pages/analytics/AnalyticsStudio.jsx";

import Reports from "../pages/reports/Reports.jsx";
import ReportPreview from "../pages/reports/ReportPreview.jsx";

import SkillsStudio from "../pages/skills/SkillsStudio.jsx";
import LegacyStudentSkillRedirect from "../pages/skills/LegacyStudentSkillRedirect.jsx";

import SmartTimeline from "../pages/smartTimeline/SmartTimeline.jsx";

import StudentPerformance from "../pages/performance/StudentPerformance.jsx";

import TournamentIntegration from "../pages/tournamentIntegration/TournamentIntegration.jsx";
import SubmitTournamentEntry from "../pages/tournamentIntegration/SubmitTournamentEntry.jsx";
import SyncedTournamentEntries from "../pages/tournamentIntegration/SyncedTournamentEntries.jsx";
import ImportTournamentResults from "../pages/tournamentIntegration/ImportTournamentResults.jsx";
import StudentTournamentHistory from "../pages/tournamentIntegration/StudentTournamentHistory.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

const managementRoles = [
  "super_admin",
  "academy_owner",
  "assistant_coach",
];

const ownerRoles = [
  "super_admin",
  "academy_owner",
];

const feeRoles = [
  "super_admin",
  "academy_owner",
];

const parentPortalRoles = [
  "parent",
  "student",
];

const billingRoles = [
  "super_admin",
  "academy_owner",
];

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      <Route path="/verify/id-card/:verificationId" element={<VerifyIdCard />} />
      <Route path="/verify/certificate/:verificationId" element={<VerifyCertificate />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<OwnerDashboard />}
          />


          {/* BILLING */}

          <Route
            element={
              <RoleRoute allowedRoles={billingRoles} />
            }
          >
            <Route path="/plans" element={<Navigate to="/billing?tab=plans" replace />} />

            <Route
              path="/billing"
              element={<SubscriptionBillingHub />}
            />

            <Route
              path="/billing/checkout/:planCode"
              element={<Checkout />}
            />

            <Route
              path="/billing/success"
              element={<PaymentSuccess />}
            />

            <Route
              path="/billing/failed"
              element={<PaymentFailed />}
            />

            <Route
              path="/billing/invoices"
              element={<Navigate to="/billing?tab=invoices" replace />}
            />

            <Route
              path="/billing/payments"
              element={<Navigate to="/billing?tab=payments" replace />}
            />

            <Route
              path="/billing/invoices/:id"
              element={<InvoiceDetail />}
            />
          </Route>

          {/* ONBOARDING */}

          <Route
            path="/onboarding/create-academy"
            element={<CreateAcademy />}
          />

          {/* PARENT PORTAL */}

          <Route
            element={
              <RoleRoute
                allowedRoles={parentPortalRoles}
              />
            }
          >
            <Route
              path="/parent"
              element={<ParentDashboard />}
            />

            <Route
              path="/parent/students/:studentId"
              element={<ParentStudentProfile />}
            />

            <Route
              path="/parent/students/:studentId/attendance"
              element={<ParentStudentAttendance />}
            />

            <Route
              path="/parent/students/:studentId/fees"
              element={<ParentStudentFees />}
            />

            <Route
              path="/parent/students/:studentId/progress"
              element={<ParentStudentProgress />}
            />

            <Route
              path="/parent/students/:studentId/documents"
              element={<ParentStudentDocuments />}
            />

            <Route
              path="/my-announcements"
              element={<MyAnnouncements />}
            />
          </Route>

          {/* COMMON */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/announcements/:id"
            element={<AnnouncementDetail />}
          />

          {/* MANAGEMENT */}

          <Route
            element={
              <RoleRoute
                allowedRoles={managementRoles}
              />
            }
          >

             <Route
    path="/academy/profile"
    element={<AcademyProfile />}
  />
  
            {/* BRANCHES */}

            <Route
              path="/branches"
              element={<Branches />}
            />

            <Route
              path="/branches/:id"
              element={<BranchDetail />}
            />

            {/* ANALYTICS */}

            <Route
              path="/analytics"
              element={<AnalyticsStudio />}
            />

            <Route
              path="/analytics/students"
              element={<Navigate to="/analytics?tab=students" replace />}
            />

            <Route
              path="/analytics/attendance"
              element={<Navigate to="/analytics?tab=attendance" replace />}
            />

            <Route
              path="/analytics/fees"
              element={<Navigate to="/analytics?tab=fees" replace />}
            />

            <Route
              path="/analytics/performance"
              element={<Navigate to="/analytics?tab=performance" replace />}
            />

            {/* REPORTS */}

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/reports/preview"
              element={<ReportPreview />}
            />

            {/* SKILLS */}

            <Route path="/skills" element={<SkillsStudio />} />

            <Route
              path="/skill-assessments"
              element={<Navigate to="/skills?tab=assess" replace />}
            />

            {/* STUDENTS */}

            <Route
              path="/students"
              element={<Students />}
            />

            <Route
              path="/students/new"
              element={<AddStudent />}
            />

            <Route
              path="/students/:id"
              element={<StudentProfile />}
            />

            <Route
              path="/students/:id/edit"
              element={<EditStudent />}
            />

            <Route
              path="/students/:studentId/skills"
              element={<LegacyStudentSkillRedirect />}
            />

            <Route
              path="/students/:studentId/smart-timeline"
              element={<SmartTimeline />}
            />

            <Route
              path="/students/:studentId/performance"
              element={<StudentPerformance />}
            />

            <Route
              path="/students/:studentId/tournament-history"
              element={<StudentTournamentHistory />}
            />

            {/* BATCHES */}

            <Route
              path="/batches"
              element={<Batches />}
            />

            <Route
              path="/batches/new"
              element={<AddBatch />}
            />

            <Route
              path="/batches/:id"
              element={<BatchDetail />}
            />

            <Route
              path="/batches/:id/edit"
              element={<EditBatch />}
            />

           {/* ATTENDANCE */}

<Route
  path="/attendance"
  element={<Attendance />}
/>

<Route
  path="/attendance/monthly-register"
  element={<Navigate to="/attendance" replace />}
/>

<Route
  path="/attendance/student/:studentId"
  element={<StudentAttendanceHistory />}
/>

<Route
  path="/attendance/batch/:batchId"
  element={<BatchAttendanceHistory />}
/>

            {/* FEES */}

            <Route
              element={
                <RoleRoute allowedRoles={feeRoles} />
              }
            >
              <Route
                path="/fees"
                element={<FeesDashboard />}
              />

              <Route
                path="/fees/students-status"
                element={<AllStudentsFeeStatus />}
              />

              <Route
                path="/fees/plans"
                element={<FeePlans />}
              />

              <Route
                path="/fees/collect"
                element={<CollectFee />}
              />

              <Route
                path="/fees/pending"
                element={<PendingFees />}
              />

              <Route
                path="/fees/payments"
                element={<PaymentHistory />}
              />

              <Route
                path="/fees/student/:studentId"
                element={<StudentFeeHistory />}
              />

              <Route
                path="/fees/receipt/:paymentId"
                element={<ReceiptView />}
              />

              <Route
                path="/reminders/fee"
                element={<Navigate to="/communication?tab=reminders&type=fee" replace />}
              />
            </Route>

            {/* BELT TESTS */}

            <Route
              path="/belt-tests"
              element={<BeltTests />}
            />

            <Route
              path="/belt-tests/new"
              element={<AddBeltTest />}
            />

            <Route
              path="/belt-tests/:id/edit"
              element={<EditBeltTest />}
            />

            <Route
              path="/students/:studentId/belt-history"
              element={<StudentBeltHistory />}
            />

            {/* CHAMPIONSHIPS */}

            <Route
              path="/championship-records"
              element={<ChampionshipRecords />}
            />

            <Route
              path="/championship-records/new"
              element={<AddChampionshipRecord />}
            />

            <Route
              path="/championship-records/:id/edit"
              element={<EditChampionshipRecord />}
            />

            <Route
              path="/students/:studentId/championship-history"
              element={<StudentChampionshipHistory />}
            />

            {/* TIMELINE */}

            <Route
              path="/students/:studentId/timeline"
              element={<StudentTimeline />}
            />

            {/* ID CARDS */}

            <Route
              path="/id-card-templates"
              element={<IdCardTemplates />}
            />

            <Route
              path="/id-cards/generate"
              element={<GenerateIdCard />}
            />

            <Route
              path="/id-cards/:id/print"
              element={<PrintIdCard />}
            />

            <Route
              path="/students/:studentId/id-cards"
              element={<StudentIdCards />}
            />

            {/* CERTIFICATES */}

            <Route
              path="/certificate-templates"
              element={<CertificateTemplates />}
            />

            <Route
              path="/certificates/generate"
              element={<GenerateCertificate />}
            />

            <Route
              path="/certificates/:id/print"
              element={<PrintCertificate />}
            />

            <Route
              path="/students/:studentId/certificates"
              element={<StudentCertificates />}
            />

            {/* PARENT LINKS */}

            <Route
              path="/parent-links"
              element={<Navigate to="/communication?tab=parent-access" replace />}
            />

            <Route
              path="/parent-links/new"
              element={<CreateParentLink />}
            />

            <Route
              path="/students/:studentId/parent-links"
              element={<StudentParentLinks />}
            />

            {/* ANNOUNCEMENTS */}

            <Route
              path="/announcements"
              element={<Navigate to="/communication?tab=announcements" replace />}
            />

            <Route
              path="/announcements/new"
              element={<CreateAnnouncement />}
            />

            {/* COMMUNICATION */}

            <Route
              path="/communication"
              element={<CommunicationHub />}
            />

            <Route
              path="/communication-logs"
              element={<Navigate to="/communication?tab=logs" replace />}
            />

            <Route
              path="/reminders/attendance"
              element={<Navigate to="/communication?tab=reminders&type=attendance" replace />}
            />

            {/* TOURNAMENT */}

            <Route
              path="/tournament-sync/entries/new"
              element={<SubmitTournamentEntry />}
            />

            <Route
              path="/tournament-sync/entries"
              element={<SyncedTournamentEntries />}
            />

            <Route
              path="/tournament-sync/results/import"
              element={<ImportTournamentResults />}
            />
          </Route>

          {/* OWNER */}

          <Route
            element={
              <RoleRoute allowedRoles={ownerRoles} />
            }
          >
            <Route
              path="/branches/new"
              element={<AddBranch />}
            />

            <Route
              path="/branches/:id/edit"
              element={<EditBranch />}
            />

            <Route
              path="/skills/new"
              element={<Navigate to="/skills?tab=library&action=new" replace />}
            />

            <Route
              path="/integrations/tournament"
              element={<TournamentIntegration />}
            />
          </Route>

          {/* SUPER ADMIN */}

          <Route
            element={
              <RoleRoute
                allowedRoles={["super_admin"]}
              />
            }
          >
            <Route
              path="/admin"
              element={<AdminControlCenter />}
            />
            <Route
              path="/admin/users"
              element={<Navigate to="/admin?tab=users" replace />}
            />

            <Route
              path="/admin/grants"
              element={<Navigate to="/admin?tab=grants" replace />}
            />
            <Route path="/admin/academies" element={<Navigate to="/admin?tab=academies" replace />} />
            <Route path="/admin/subscriptions" element={<Navigate to="/admin?tab=subscriptions" replace />} />
            <Route path="/admin/plans" element={<Navigate to="/admin?tab=plans" replace />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
