import api from "./api.js";

export const idCardTemplateApi = {
  getAll: () => api.get("/id-card-templates"),
  getById: (id) => api.get(`/id-card-templates/${id}`),
  create: (payload) => api.post("/id-card-templates", payload, payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  update: (id, payload) => api.patch(`/id-card-templates/${id}`, payload, payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  remove: (id) => api.delete(`/id-card-templates/${id}`),
};

export const idCardApi = {
  generate: (payload) => api.post("/id-cards/generate", payload),
  generateBulk: (payload) => api.post("/id-cards/generate-bulk", payload),
  getBatch: (ids) => api.get("/id-cards/batch", { params: { ids: Array.isArray(ids) ? ids.join(",") : ids } }),
  getByStudent: (studentId) => api.get(`/id-cards/student/${studentId}`),
  getById: (id) => api.get(`/id-cards/${id}`),
  updateStatus: (id, status) => api.patch(`/id-cards/${id}/status`, { status }),
  verify: (verificationId, token) => api.get(`/id-cards/verify/${verificationId}`, { params: { token } }),
};
