import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;