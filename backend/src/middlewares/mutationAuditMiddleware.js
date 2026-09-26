import { persistAuditLog } from "../services/auditMonitoringService.js";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const mutationAuditMiddleware = (req, res, next) => {
  if (!MUTATION_METHODS.has(req.method) || req.path.startsWith("/auth/")) {
    return next();
  }

  res.once("finish", () => {
    if (!req.user?._id) return;

    const pathParts = req.path.split("/").filter(Boolean);
    void persistAuditLog({
      user: req.user._id,
      academy: req.academyId || null,
      action: `${req.method}_${res.statusCode < 400 ? "SUCCESS" : "FAILED"}`,
      module: pathParts[0] || "api",
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
      metadata: {
        path: req.path,
        statusCode: res.statusCode,
        resourceId: req.params?.id || req.params?.studentId || null,
      },
    }).catch(() => {});
  });

  return next();
};
