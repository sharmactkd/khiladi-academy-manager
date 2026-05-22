import api from "./api.js";

export const feePlanApi = {
  create: (payload) => api.post("/fee-plans", payload),
  getAll: (params = {}) => api.get("/fee-plans", { params }),
  getById: (id) => api.get(`/fee-plans/${id}`),
  update: (id, payload) => api.patch(`/fee-plans/${id}`, payload),
  remove: (id) => api.delete(`/fee-plans/${id}`),
};

export const feePaymentApi = {
  create: (payload) => api.post("/fee-payments", payload),
  getAll: (params = {}) => api.get("/fee-payments", { params }),
  getById: (id) => api.get(`/fee-payments/${id}`),
  getStudentHistory: (studentId) =>
    api.get(`/fee-payments/student/${studentId}`),
  update: (id, payload) => api.patch(`/fee-payments/${id}`, payload),
  remove: (id) => api.delete(`/fee-payments/${id}`),
};