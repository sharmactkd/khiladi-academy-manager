import api from "./api.js";

export const parentLinkApi = {
  getAll: (params = {}) => api.get("/parent-links", { params }),
  getMyStudents: () => api.get("/parent-links/my-students"),
  getByStudent: (studentId) => api.get(`/parent-links/student/${studentId}`),
  create: (payload) => api.post("/parent-links", payload),
  update: (id, payload) => api.patch(`/parent-links/${id}`, payload),
  remove: (id) => api.delete(`/parent-links/${id}`),
};