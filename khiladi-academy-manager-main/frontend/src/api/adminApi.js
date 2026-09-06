import api from "./api.js";

export const adminApi = {
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  getOverview: () => api.get("/admin/overview"),
  getAcademies: (params = {}) => api.get("/admin/academies", { params }),
  getSubscriptions: (params = {}) => api.get("/admin/subscriptions", { params }),
  getGrants: () => api.get("/admin/grants"),
  createGrant: (payload) => api.post("/admin/grants", payload),
  revokeGrant: (id) => api.patch(`/admin/grants/${id}/revoke`),
};
