import api from "./api.js";

export const announcementApi = {
  getAll: (params = {}) => api.get("/announcements", { params }),
  getMine: () => api.get("/announcements/my"),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (payload) => api.post("/announcements", payload),
  update: (id, payload) => api.patch(`/announcements/${id}`, payload),
  remove: (id) => api.delete(`/announcements/${id}`),
};