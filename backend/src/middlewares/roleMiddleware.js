import { errorResponse } from "../utils/apiResponse.js";

export const hasRole = (user, roles = []) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required", 401);
    }

    if (!hasRole(req.user, roles)) {
      return errorResponse(res, "You are not authorized for this action", 403);
    }

    next();
  };
};