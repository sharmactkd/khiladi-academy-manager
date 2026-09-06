import { errorResponse } from "../utils/apiResponse.js";
import { getPlanLimit, isLimitUnlimited } from "../services/planService.js";

export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, "Authentication required", 401);
      }

      if (!req.academyId) {
        return errorResponse(
          res,
          "Academy is required for this feature. Please create or select an academy.",
          400
        );
      }

      if (req.user.role === "super_admin") {
        return next();
      }

      const value = await getPlanLimit({
        academyId: req.academyId,
        resourceName: featureName,
      });

      const allowed =
        value === true ||
        value === "true" ||
        value === "enabled" ||
        value === "yes" ||
        value === 1 ||
        value === "1" ||
        isLimitUnlimited(value) ||
        Number(value || 0) > 0;

      if (!allowed) {
        return errorResponse(
          res,
          `Your current plan does not include ${featureName}. Please upgrade your plan.`,
          403
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};