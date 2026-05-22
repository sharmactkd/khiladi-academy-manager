import api from "./api.js";

export const batchApi = {
  create: (payload) => api.post("/batches", payload),
  getAll: (params = {}) => api.get("/batches", { params }),
  getById: (id) => api.get(`/batches/${id}`),
  update: (id, payload) => api.patch(`/batches/${id}`, payload),
  remove: (id) => api.delete(`/batches/${id}`),
};