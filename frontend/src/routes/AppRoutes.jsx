import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Login = lazy(() => import("../pages/auth/Login.jsx"));
const Register = lazy(() => import("../pages/auth/Register.jsx"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("../pages/auth/VerifyEmail.jsx"));
const AccountSecurity = lazy(() => import("../pages/account/AccountSecurity.jsx"));
const OwnerDashboard = lazy(() => import("../pages/dashboard/OwnerDashboard.jsx"));
const CreateAcademy = lazy(() => import("../pages/onboarding/CreateAcademy.jsx"));
const AdminControlCenter = lazy(() => import("../pages/admin/AdminControlCenter.jsx"));
const Unauthorized = lazy(() => import("../pages/errors/Unauthorized.jsx"));
const NotFound = lazy(() => import("../pages/errors/NotFound.jsx"));
const AcademyProfile = lazy(() => import("../pages/academy/AcademyProfile.jsx"));
const Students = lazy(() => import("../pages/students/Students.jsx"));
const Imports = lazy(() => import("../pages/imports/Imports.jsx"));
const AddStudent = lazy(() => import("../pages/students/AddStudent.jsx"));
const EditStudent = lazy(() => import("../pages/students/EditStudent.jsx"));
const StudentProfile = lazy(() => import("../pages/students/StudentProfile.jsx"));
const Batches = lazy(() => import("../pages/batches/Batches.jsx"));
const AddBatch = lazy(() => import("../pages/batches/AddBatch.jsx"));
const EditBatch = lazy(() => import("../pages/batches/EditBatch.jsx"));
const BatchDetail = lazy(() => import("../pages/batches/BatchDetail.jsx"));
const Attendance = lazy(() => import("../pages/attendance/Attendance.jsx"));
const StudentAttendanceHistory = lazy(() => import("../pages/attendance/StudentAttendanceHistory.jsx"));
const BatchAttendanceHistory = lazy(() => import("../pages/attendance/BatchAttendanceHistory.jsx"));
const FeesDashboard = lazy(() => import("../pages/fees/FeesDashboard.jsx"));
const FeePlans = lazy(() => import("../pages/fees/FeePlans.jsx"));
const CollectFee = lazy(() => import("../pages/fees/CollectFee.jsx"));
const PendingFees = lazy(() => import("../pages/fees/PendingFees.jsx"));
const StudentFeeHistory = lazy(() => import("../pages/fees/StudentFeeHistory.jsx"));
const ReceiptView = lazy(() => import("../pages/fees/ReceiptView.jsx"));
const AllStudentsFeeStatus = lazy(() => import("../pages/fees/AllStudentsFeeStatus.jsx"));
const PaymentHistory = lazy(() => import("../pages/fees/PaymentHistory.jsx"));
const BeltTests = lazy(() => import("../pages/beltTests/BeltTests.jsx"));
const EditBeltTest = lazy(() => import("../pages/beltTests/EditBeltTest.jsx"));
const StudentBeltHistory = lazy(() => import("../pages/beltTests/StudentBeltHistory.jsx"));
const ChampionshipRecords = lazy(() => import("../pages/championships/ChampionshipRecords.jsx"));
const EditChampionshipRecord = lazy(() => import("../pages/championships/EditChampionshipRecord.jsx"));
const StudentChampionshipHistory = lazy(() => import("../pages/championships/StudentChampionshipHistory.jsx"));
const AcademyEventStudio = lazy(() => import("../pages/events/AcademyEventStudio.jsx"));
const AcademyEventList = lazy(() => import("../pages/events/AcademyEventList.jsx"));
const StudentTimeline = lazy(() => import("../pages/timeline/StudentTimeline.jsx"));
const IdCardTemplates = lazy(() => import("../pages/idCards/IdCardTemplates.jsx"));
const GenerateIdCard = lazy(() => import("../pages/idCards/GenerateIdCard.jsx"));
const PrintIdCard = lazy(() => import("../pages/idCards/PrintIdCard.jsx"));
const StudentIdCards = lazy(() => import("../pages/idCards/StudentIdCards.jsx"));
const VerifyIdCard = lazy(() => import("../pages/idCards/VerifyIdCard.jsx"));
const CertificateTemplates = lazy(() => import("../pages/certificates/CertificateTemplates.jsx"));
const GenerateCertificate = lazy(() => import("../pages/certificates/GenerateCertificate.jsx"));
const PrintCertificate = lazy(() => import("../pages/certificates/PrintCertificate.jsx"));
const StudentCertificates = lazy(() => import("../pages/certificates/StudentCertificates.jsx"));
const VerifyCertificate = lazy(() => import("../pages/certificates/VerifyCertificate.jsx"));
const CreateParentLink = lazy(() => import("../pages/parentLinks/CreateParentLink.jsx"));
const StudentParentLinks = lazy(() => import("../pages/parentLinks/StudentParentLinks.jsx"));
const ParentDashboard = lazy(() => import("../pages/parentPortal/ParentDashboard.jsx"));
const ParentStudentProfile = lazy(() => import("../pages/parentPortal/ParentStudentProfile.jsx"));
const ParentStudentAttendance = lazy(() => import("../pages/parentPortal/ParentStudentAttendance.jsx"));
const ParentStudentFees = lazy(() => import("../pages/parentPortal/ParentStudentFees.jsx"));
const ParentStudentProgress = lazy(() => import("../pages/parentPortal/ParentStudentProgress.jsx"));
const ParentStudentDocuments = lazy(() => import("../pages/parentPortal/ParentStudentDocuments.jsx"));
const CreateAnnouncement = lazy(() => import("../pages/announcements/CreateAnnouncement.jsx"));
const AnnouncementDetail = lazy(() => import("../pages/announcements/AnnouncementDetail.jsx"));
const MyAnnouncements = lazy(() => import("../pages/announcements/MyAnnouncements.jsx"));
const Notifications = lazy(() => import("../pages/notifications/Notifications.jsx"));
const CommunicationHub = lazy(() => import("../pages/communication/CommunicationHub.jsx"));
const SubscriptionBillingHub = lazy(() => import("../pages/billing/SubscriptionBillingHub.jsx"));
const Checkout = lazy(() => import("../pages/billing/Checkout.jsx"));
const PaymentSuccess = lazy(() => import("../pages/billing/PaymentSuccess.jsx"));
const PaymentFailed = lazy(() => import("../pages/billing/PaymentFailed.jsx"));
const InvoiceDetail = lazy(() => import("../pages/billing/InvoiceDetail.jsx"));
const Branches = lazy(() => import("../pages/branches/Branches.jsx"));
const AddBranch = lazy(() => import("../pages/branches/AddBranch.jsx"));
const EditBranch = lazy(() => import("../pages/branches/EditBranch.jsx"));
const BranchDetail = lazy(() => import("../pages/branches/BranchDetail.jsx"));
const AnalyticsStudio = lazy(() => import("../pages/analytics/AnalyticsStudio.jsx"));
const Reports = lazy(() => import("../pages/reports/Reports.jsx"));
const ReportPreview = lazy(() => import("../pages/reports/ReportPreview.jsx"));
const SkillsStudio = lazy(() => import("../pages/skills/SkillsStudio.jsx"));
const LegacyStudentSkillRedirect = lazy(() => import("../pages/skills/LegacyStudentSkillRedirect.jsx"));
const SmartTimeline = lazy(() => import("../pages/smartTimeline/SmartTimeline.jsx"));
const StudentPerformance = lazy(() => import("../pages/performance/StudentPerformance.jsx"));
const TournamentIntegration = lazy(() => import("../pages/tournamentIntegration/TournamentIntegration.jsx"));
const SubmitTournamentEntry = lazy(() => import("../pages/tournamentIntegration/SubmitTournamentEntry.jsx"));
const SyncedTournamentEntries = lazy(() => import("../pages/tournamentIntegration/SyncedTournamentEntries.jsx"));
const ImportTournamentResults = lazy(() => import("../pages/tournamentIntegration/ImportTournamentResults.jsx"));
const StudentTournamentHistory = lazy(() => import("../pages/tournamentIntegration/StudentTournamentHistory.jsx"));

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";

import DashboardLayout from "../layouts/DashboardLayout.jsx";
import useAuth from "../hooks/useAuth.js";
import { getRoleLandingPath } from "../utils/authLanding.js";

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

const RoleLandingRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? getRoleLandingPath(user?.role) : "/login"} replace />;
};

const RouteLoadingFallback = () => (
  <div
    role="status"
    aria-live="polite"
    style={{
      minHeight: "38vh",
      display: "grid",
      placeItems: "center",
      color: "#64748b",
      fontSize: 14,
      fontWeight: 700,
    }}
  >
    Loading page…
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      <Route
        path="/"
        element={<RoleLandingRedirect />}
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
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify/id-card/:verificationId" element={<VerifyIdCard />} />
      <Route path="/verify/certificate/:verificationId" element={<VerifyCertificate />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/account/security" element={<AccountSecurity />} />


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
            <Route path="/dashboard" element={<OwnerDashboard />} />

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
            <Route path="/imports" element={<Imports />} />

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
              element={<AcademyEventStudio mode="belt" />}
            />

            <Route
              path="/belt-tests/events"
              element={<AcademyEventList mode="belt" />}
            />

            <Route
              path="/belt-tests/events/:eventId"
              element={<AcademyEventStudio mode="belt" />}
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
              element={<AcademyEventStudio mode="championship" />}
            />

            <Route
              path="/championship-records/events"
              element={<AcademyEventList mode="championship" />}
            />

            <Route
              path="/championship-records/events/:eventId"
              element={<AcademyEventStudio mode="championship" />}
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
              path="/id-cards/print-batch"
              element={<PrintIdCard batch />}
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
            <Route path="/academy/profile" element={<AcademyProfile />} />

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
    </Suspense>
  );
};

export default AppRoutes;
