import api from "./api.js";

export const feePlanApi = {
  create: (payload) => api.post("/fees/plans", payload),
  getAll: (params = {}) => api.get("/fees/plans", { params }),
  getById: (id) => api.get(`/fees/plans/${id}`),
  update: (id, payload) => api.patch(`/fees/plans/${id}`, payload),
  remove: (id) => api.delete(`/fees/plans/${id}`),
};

export const feePaymentApi = {
  getDashboard: (params = {}) => api.get("/fees/dashboard", { params }),
  getStudentsStatus: (params = {}) =>
    api.get("/fees/students-status", { params }),
  collect: (payload) => api.post("/fees/collect", payload),
  getPending: (params = {}) => api.get("/fees/pending", { params }),
  getPayments: (params = {}) => api.get("/fees/payments", { params }),
  getReceipt: (id) => api.get(`/fees/receipt/${id}`),
  getStudentHistory: (studentId) => api.get(`/fees/student/${studentId}`),
  update: (id, payload) => api.patch(`/fees/${id}`, payload),
  remove: (id) => api.delete(`/fees/${id}`),
};