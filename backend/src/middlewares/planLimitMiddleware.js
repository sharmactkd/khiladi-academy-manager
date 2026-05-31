import { errorResponse } from "../utils/apiResponse.js";
import { getPlanLimit, isLimitUnlimited } from "../services/planService.js";
import { getResourceUsage } from "../services/usageService.js";

export const enforceLimit = (resourceName) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === "super_admin") {
        return next();
      }

      if (!req.academyId) {
        return errorResponse(res, "Academy is required", 400);
      }

      const limit = await getPlanLimit({
        academyId: req.academyId,
        resourceName,
      });

      if (isLimitUnlimited(limit)) {
        return next();
      }

      const numericLimit = Number(limit || 0);

      const currentUsage = await getResourceUsage({
        academyId: req.academyId,
        resourceName,
      });

      if (currentUsage >= numericLimit) {
        return errorResponse(
          res,
          `Plan limit reached for ${resourceName}. Current limit is ${numericLimit}. Please upgrade your plan.`,
          403
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};