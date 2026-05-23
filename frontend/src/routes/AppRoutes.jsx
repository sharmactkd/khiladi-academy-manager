import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";

import OwnerDashboard from "../pages/dashboard/OwnerDashboard.jsx";
import CreateAcademy from "../pages/onboarding/CreateAcademy.jsx";
import Users from "../pages/admin/Users.jsx";
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

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const managementRoles = ["super_admin", "academy_owner", "assistant_coach"];
const feeRoles = ["super_admin", "academy_owner"];

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
          <Route path="/onboarding/create-academy" element={<CreateAcademy />} />

          <Route element={<RoleRoute allowedRoles={managementRoles} />}>
            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<AddStudent />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/students/:id/edit" element={<EditStudent />} />

            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/new" element={<AddBatch />} />
            <Route path="/batches/:id" element={<BatchDetail />} />
            <Route path="/batches/:id/edit" element={<EditBatch />} />

            <Route path="/attendance" element={<AttendanceSheet />} />
            <Route
              path="/attendance/student/:studentId"
              element={<StudentAttendanceHistory />}
            />
            <Route
              path="/attendance/batch/:batchId"
              element={<BatchAttendanceHistory />}
            />

            <Route path="/belt-tests" element={<BeltTests />} />
            <Route path="/belt-tests/new" element={<AddBeltTest />} />
            <Route path="/belt-tests/:id/edit" element={<EditBeltTest />} />
            <Route
              path="/students/:studentId/belt-history"
              element={<StudentBeltHistory />}
            />

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

            <Route
              path="/students/:studentId/timeline"
              element={<StudentTimeline />}
            />

            <Route path="/id-card-templates" element={<IdCardTemplates />} />
            <Route path="/id-cards/generate" element={<GenerateIdCard />} />
            <Route path="/id-cards/:id/print" element={<PrintIdCard />} />
            <Route
              path="/students/:studentId/id-cards"
              element={<StudentIdCards />}
            />

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
          </Route>

          <Route element={<RoleRoute allowedRoles={feeRoles} />}>
            <Route path="/fees" element={<FeesDashboard />} />
            <Route path="/fees/plans" element={<FeePlans />} />
            <Route path="/fees/collect" element={<CollectFee />} />
            <Route path="/fees/pending" element={<PendingFees />} />
            <Route
              path="/fees/student/:studentId"
              element={<StudentFeeHistory />}
            />
            <Route path="/fees/receipt/:paymentId" element={<ReceiptView />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["super_admin"]} />}>
            <Route path="/admin/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;