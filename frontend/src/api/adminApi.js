import api from "./api.js";

export const adminApi = {
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  getOverview: () => api.get("/admin/overview"),
  getAcademies: (params = {}) => api.get("/admin/academies", { params }),
  getSubscriptions: (params = {}) => api.get("/admin/subscriptions", { params }),
  getGrants: () => api.get("/admin/grants"),
  createGrant: (payload) => api.post("/admin/grants", payload),
  revokeGrant: (id) => api.patch(`/admin/grants/${id}/revoke`),
  getAddOns: () => api.get("/admin/add-ons"),
  getPlans: () => api.get("/admin/plans"),
  getEntitlements: () => api.get("/admin/entitlements"),
  grantEntitlement: (payload) => api.post("/admin/entitlements", payload),
  revokeEntitlement: (id, reason) => api.patch(`/admin/entitlements/${id}/revoke`, { reason }),
  updateAddOn: (id, payload) => api.patch(`/admin/add-ons/${id}`, payload),
  updateUserStatus: (id, payload) => api.patch(`/admin/users/${id}/status`, payload),
  updateAcademyStatus: (id, payload) => api.patch(`/admin/academies/${id}/status`, payload),
};
