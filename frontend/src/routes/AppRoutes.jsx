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

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

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