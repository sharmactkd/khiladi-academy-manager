import api from "./api.js";

export const certificateTemplateApi = {
  getAll: (params = {}) => api.get("/certificate-templates", { params }),
  getById: (id) => api.get(`/certificate-templates/${id}`),
  create: (payload) => api.post("/certificate-templates", payload),
  update: (id, payload) => api.patch(`/certificate-templates/${id}`, payload),
  remove: (id) => api.delete(`/certificate-templates/${id}`),
};

export const certificateApi = {
  generate: (payload) => api.post("/certificates/generate", payload),
  getByStudent: (studentId) => api.get(`/certificates/student/${studentId}`),
  getById: (id) => api.get(`/certificates/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/certificates/${id}/status`, { status }),
};