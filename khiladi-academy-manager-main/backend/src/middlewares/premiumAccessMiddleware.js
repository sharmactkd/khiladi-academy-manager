import { errorResponse } from "../utils/apiResponse.js";
import {
  getEffectiveSubscription,
  hasFeature,
} from "../services/planService.js";

export const attachCurrentSubscription = async (req, res, next) => {
  try {
    if (!req.academyId) {
      return next();
    }

    const subscription = await getEffectiveSubscription({
      academyId: req.academyId,
    });

    req.currentSubscription = subscription;
    req.currentPlan = subscription?.plan || null;

    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.academyId) {
        return errorResponse(res, "Academy is required", 400);
      }

      const allowed = await hasFeature({
        academyId: req.academyId,
        featureName,
      });

      if (!allowed) {
        return errorResponse(
          res,
          `This feature requires a premium plan: ${featureName}`,
          403
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};