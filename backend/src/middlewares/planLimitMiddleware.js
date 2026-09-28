import { errorResponse } from "../utils/apiResponse.js";
import { getPlanLimit, isLimitUnlimited } from "../services/planService.js";
import { getResourceUsage } from "../services/usageService.js";
import Academy from "../models/Academy.js";
import { getAcademyEntitlementSnapshot } from "../services/entitlementService.js";

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

      let since = null;
      if (["idCards", "certificates"].includes(resourceName)) {
        const academy = await Academy.findById(req.academyId).select("owner").lean();
        const snapshot = academy ? await getAcademyEntitlementSnapshot({ ownerId: academy.owner, academyId: req.academyId }) : null;
        const studioActive = resourceName === "idCards" ? snapshot?.limits?.idCardStudio : snapshot?.limits?.certificateStudio;
        if (studioActive) since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
      }

      const currentUsage = await getResourceUsage({
        academyId: req.academyId,
        resourceName,
        since,
      });

      const requested = resourceName === "idCards" && Array.isArray(req.body?.students)
        ? Math.max(1, req.body.students.length)
        : 1;
      if (currentUsage + requested > numericLimit) {
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
