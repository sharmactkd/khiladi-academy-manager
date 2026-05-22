import api from "./api.js";

export const studentApi = {
  create: (payload) => api.post("/students", payload),
  getAll: (params = {}) => api.get("/students", { params }),
  getById: (id) => api.get(`/students/${id}`),
  update: (id, payload) => api.patch(`/students/${id}`, payload),
  remove: (id) => api.delete(`/students/${id}`),
};