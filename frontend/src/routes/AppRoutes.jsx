import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";

import OwnerDashboard from "../pages/dashboard/OwnerDashboard.jsx";
import CreateAcademy from "../pages/onboarding/CreateAcademy.jsx";
import Users from "../pages/admin/Users.jsx";
import AdminGrants from "../pages/admin/AdminGrants.jsx";
import Unauthorized from "../pages/errors/Unauthorized.jsx";
import NotFound from "../pages/errors/NotFound.jsx";

import Students from "../pages/students/Students.jsx";
import AddStudent from "../pages/students/AddStudent.jsx";
import EditStudent from "../pages/students/EditStudent.jsx";
import StudentProfile from "../pages/students/StudentProfile.jsx";

import Batches from "../pages/batches/Batches.jsx";
import AddBatch from "../pages/batches/AddBatch.jsx";
import EditBatch from "../pages/batches/EditBatch.jsx";
import BatchDetail from "../pages/batches/BatchDetail.jsx";

import AttendanceSheet from "../pages/attendance/AttendanceSheet.jsx";
import MonthlyAttendanceRegister from "../pages/attendance/MonthlyAttendanceRegister.jsx";
import StudentAttendanceHistory from "../pages/attendance/StudentAttendanceHistory.jsx";
import BatchAttendanceHistory from "../pages/attendance/BatchAttendanceHistory.jsx";

import FeesDashboard from "../pages/fees/FeesDashboard.jsx";
import FeePlans from "../pages/fees/FeePlans.jsx";
import CollectFee from "../pages/fees/CollectFee.jsx";
import PendingFees from "../pages/fees/PendingFees.jsx";
import StudentFeeHistory from "../pages/fees/StudentFeeHistory.jsx";
import ReceiptView from "../pages/fees/ReceiptView.jsx";

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

import CertificateTemplates from "../pages/certificates/CertificateTemplates.jsx";
import GenerateCertificate from "../pages/certificates/GenerateCertificate.jsx";
import PrintCertificate from "../pages/certificates/PrintCertificate.jsx";
import StudentCertificates from "../pages/certificates/StudentCertificates.jsx";

import ParentLinks from "../pages/parentLinks/ParentLinks.jsx";
import CreateParentLink from "../pages/parentLinks/CreateParentLink.jsx";
import StudentParentLinks from "../pages/parentLinks/StudentParentLinks.jsx";

import ParentDashboard from "../pages/parentPortal/ParentDashboard.jsx";
import ParentStudentProfile from "../pages/parentPortal/ParentStudentProfile.jsx";
import ParentStudentAttendance from "../pages/parentPortal/ParentStudentAttendance.jsx";
import ParentStudentFees from "../pages/parentPortal/ParentStudentFees.jsx";
import ParentStudentProgress from "../pages/parentPortal/ParentStudentProgress.jsx";
import ParentStudentDocuments from "../pages/parentPortal/ParentStudentDocuments.jsx";

import Announcements from "../pages/announcements/Announcements.jsx";
import CreateAnnouncement from "../pages/announcements/CreateAnnouncement.jsx";
import AnnouncementDetail from "../pages/announcements/AnnouncementDetail.jsx";
import MyAnnouncements from "../pages/announcements/MyAnnouncements.jsx";

import Notifications from "../pages/notifications/Notifications.jsx";
import CommunicationLogs from "../pages/communication/CommunicationLogs.jsx";
import FeeReminder from "../pages/reminders/FeeReminder.jsx";
import AttendanceReminder from "../pages/reminders/AttendanceReminder.jsx";

import Plans from "../pages/plans/Plans.jsx";
import BillingDashboard from "../pages/billing/BillingDashboard.jsx";
import Checkout from "../pages/billing/Checkout.jsx";
import PaymentSuccess from "../pages/billing/PaymentSuccess.jsx";
import PaymentFailed from "../pages/billing/PaymentFailed.jsx";
import Invoices from "../pages/billing/Invoices.jsx";
import InvoiceDetail from "../pages/billing/InvoiceDetail.jsx";
import PaymentHistory from "../pages/billing/PaymentHistory.jsx";

import Branches from "../pages/branches/Branches.jsx";
import AddBranch from "../pages/branches/AddBranch.jsx";
import EditBranch from "../pages/branches/EditBranch.jsx";
import BranchDetail from "../pages/branches/BranchDetail.jsx";

import AnalyticsDashboard from "../pages/analytics/AnalyticsDashboard.jsx";
import StudentAnalytics from "../pages/analytics/StudentAnalytics.jsx";
import AttendanceAnalytics from "../pages/analytics/AttendanceAnalytics.jsx";
import FeesAnalytics from "../pages/analytics/FeesAnalytics.jsx";
import PerformanceAnalytics from "../pages/analytics/PerformanceAnalytics.jsx";

import Reports from "../pages/reports/Reports.jsx";
import ReportPreview from "../pages/reports/ReportPreview.jsx";

import Skills from "../pages/skills/Skills.jsx";
import AddSkill from "../pages/skills/AddSkill.jsx";
import SkillAssessments from "../pages/skills/SkillAssessments.jsx";
import StudentSkillProfile from "../pages/skills/StudentSkillProfile.jsx";

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

const managementRoles = ["super_admin", "academy_owner", "assistant_coach"];
const ownerRoles = ["super_admin", "academy_owner"];
const feeRoles = ["super_admin", "academy_owner"];
const parentPortalRoles = ["parent", "student"];
const billingRoles = ["super_admin", "academy_owner"];

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<OwnerDashboard />} />

          <Route element={<RoleRoute allowedRoles={billingRoles} />}>
            <Route path="/plans" element={<Plans />} />
            <Route path="/billing" element={<BillingDashboard />} />
            <Route path="/billing/checkout/:planCode" element={<Checkout />} />
            <Route path="/billing/success" element={<PaymentSuccess />} />
            <Route path="/billing/failed" element={<PaymentFailed />} />
            <Route path="/billing/invoices" element={<Invoices />} />
            <Route path="/billing/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/billing/payments" element={<PaymentHistory />} />
          </Route>

          <Route path="/onboarding/create-academy" element={<CreateAcademy />} />

          <Route element={<RoleRoute allowedRoles={parentPortalRoles} />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/students/:studentId" element={<ParentStudentProfile />} />
            <Route path="/parent/students/:studentId/attendance" element={<ParentStudentAttendance />} />
            <Route path="/parent/students/:studentId/fees" element={<ParentStudentFees />} />
            <Route path="/parent/students/:studentId/progress" element={<ParentStudentProgress />} />
            <Route path="/parent/students/:studentId/documents" element={<ParentStudentDocuments />} />
            <Route path="/my-announcements" element={<MyAnnouncements />} />
          </Route>

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail />} />

          <Route element={<RoleRoute allowedRoles={managementRoles} />}>
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/:id" element={<BranchDetail />} />

            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/analytics/students" element={<StudentAnalytics />} />
            <Route path="/analytics/attendance" element={<AttendanceAnalytics />} />
            <Route path="/analytics/performance" element={<PerformanceAnalytics />} />

            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/preview" element={<ReportPreview />} />

            <Route path="/skills" element={<Skills />} />
            <Route path="/skill-assessments" element={<SkillAssessments />} />

            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<AddStudent />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/students/:id/edit" element={<EditStudent />} />

            <Route path="/students/:studentId/skills" element={<StudentSkillProfile />} />
            <Route path="/students/:studentId/smart-timeline" element={<SmartTimeline />} />
            <Route path="/students/:studentId/performance" element={<StudentPerformance />} />
            <Route path="/students/:studentId/tournament-history" element={<StudentTournamentHistory />} />

            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/new" element={<AddBatch />} />
            <Route path="/batches/:id" element={<BatchDetail />} />
            <Route path="/batches/:id/edit" element={<EditBatch />} />

            <Route path="/attendance" element={<AttendanceSheet />} />
            <Route path="/attendance/monthly-register" element={<MonthlyAttendanceRegister />} />
            <Route path="/attendance/student/:studentId" element={<StudentAttendanceHistory />} />
            <Route path="/attendance/batch/:batchId" element={<BatchAttendanceHistory />} />

            <Route path="/belt-tests" element={<BeltTests />} />
            <Route path="/belt-tests/new" element={<AddBeltTest />} />
            <Route path="/belt-tests/:id/edit" element={<EditBeltTest />} />
            <Route path="/students/:studentId/belt-history" element={<StudentBeltHistory />} />

            <Route path="/championship-records" element={<ChampionshipRecords />} />
            <Route path="/championship-records/new" element={<AddChampionshipRecord />} />
            <Route path="/championship-records/:id/edit" element={<EditChampionshipRecord />} />
            <Route path="/students/:studentId/championship-history" element={<StudentChampionshipHistory />} />

            <Route path="/students/:studentId/timeline" element={<StudentTimeline />} />

            <Route path="/id-card-templates" element={<IdCardTemplates />} />
            <Route path="/id-cards/generate" element={<GenerateIdCard />} />
            <Route path="/id-cards/:id/print" element={<PrintIdCard />} />
            <Route path="/students/:studentId/id-cards" element={<StudentIdCards />} />

            <Route path="/certificate-templates" element={<CertificateTemplates />} />
            <Route path="/certificates/generate" element={<GenerateCertificate />} />
            <Route path="/certificates/:id/print" element={<PrintCertificate />} />
            <Route path="/students/:studentId/certificates" element={<StudentCertificates />} />

            <Route path="/parent-links" element={<ParentLinks />} />
            <Route path="/parent-links/new" element={<CreateParentLink />} />
            <Route path="/students/:studentId/parent-links" element={<StudentParentLinks />} />

            <Route path="/announcements" element={<Announcements />} />
            <Route path="/announcements/new" element={<CreateAnnouncement />} />

            <Route path="/communication-logs" element={<CommunicationLogs />} />
            <Route path="/reminders/attendance" element={<AttendanceReminder />} />

            <Route path="/tournament-sync/entries/new" element={<SubmitTournamentEntry />} />
            <Route path="/tournament-sync/entries" element={<SyncedTournamentEntries />} />
            <Route path="/tournament-sync/results/import" element={<ImportTournamentResults />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={ownerRoles} />}>
            <Route path="/branches/new" element={<AddBranch />} />
            <Route path="/branches/:id/edit" element={<EditBranch />} />
            <Route path="/skills/new" element={<AddSkill />} />
            <Route path="/integrations/tournament" element={<TournamentIntegration />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={feeRoles} />}>
            <Route path="/analytics/fees" element={<FeesAnalytics />} />

            <Route path="/fees" element={<FeesDashboard />} />
            <Route path="/fees/plans" element={<FeePlans />} />
            <Route path="/fees/collect" element={<CollectFee />} />
            <Route path="/fees/pending" element={<PendingFees />} />
            <Route path="/fees/student/:studentId" element={<StudentFeeHistory />} />
            <Route path="/fees/receipt/:paymentId" element={<ReceiptView />} />
            <Route path="/reminders/fee" element={<FeeReminder />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["super_admin"]} />}>
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/grants" element={<AdminGrants />} />
          </Route>
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;