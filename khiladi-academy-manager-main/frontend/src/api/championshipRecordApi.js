import api from "./api.js";

export const championshipRecordApi = {
  getAll: (params = {}) => api.get("/championship-records", { params }),
  getById: (id) => api.get(`/championship-records/${id}`),
  getByStudent: (studentId) =>
    api.get(`/championship-records/student/${studentId}`),
  create: (payload) => api.post("/championship-records", payload),
  update: (id, payload) => api.patch(`/championship-records/${id}`, payload),
  remove: (id) => api.delete(`/championship-records/${id}`),
};