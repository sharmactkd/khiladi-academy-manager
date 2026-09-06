import api from "./api.js";

export const beltTestApi = {
  getAll: (params = {}) => api.get("/belt-tests", { params }),
  getById: (id) => api.get(`/belt-tests/${id}`),
  getByStudent: (studentId) => api.get(`/belt-tests/student/${studentId}`),
  create: (payload) => api.post("/belt-tests", payload),
  update: (id, payload) => api.patch(`/belt-tests/${id}`, payload),
  remove: (id) => api.delete(`/belt-tests/${id}`),
};