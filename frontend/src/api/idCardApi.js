import api from "./api.js";

export const idCardTemplateApi = {
  getAll: () => api.get("/id-card-templates"),
  getById: (id) => api.get(`/id-card-templates/${id}`),
  create: (payload) => api.post("/id-card-templates", payload),
  update: (id, payload) => api.patch(`/id-card-templates/${id}`, payload),
  remove: (id) => api.delete(`/id-card-templates/${id}`),
};

export const idCardApi = {
  generate: (payload) => api.post("/id-cards/generate", payload),
  getByStudent: (studentId) => api.get(`/id-cards/student/${studentId}`),
  getById: (id) => api.get(`/id-cards/${id}`),
  updateStatus: (id, status) => api.patch(`/id-cards/${id}/status`, { status }),
};