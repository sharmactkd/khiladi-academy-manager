import { errorResponse } from "../utils/apiResponse.js";
import { verifyStepUpToken } from "../utils/generateToken.js";

export const requireStepUp = (operation) => (req, res, next) => {
  const issuedAt = req.authIssuedAt?.getTime() || 0;
  if (issuedAt && Date.now() - issuedAt <= 10 * 60 * 1000) return next();

  const token = String(req.get("x-step-up-token") || "").trim();
  if (!token) {
    return errorResponse(res, "Recent authentication is required", 428, {
      code: "STEP_UP_REQUIRED",
      operation,
    });
  }
  try {
    const payload = verifyStepUpToken(token);
    if (
      payload.purpose !== "step-up" ||
      payload.id !== String(req.user?._id) ||
      payload.operation !== operation
    ) throw new Error("Invalid step-up scope");
    return next();
  } catch {
    return errorResponse(res, "Step-up authentication is invalid or expired", 401, {
      code: "STEP_UP_INVALID",
      operation,
    });
  }
};
