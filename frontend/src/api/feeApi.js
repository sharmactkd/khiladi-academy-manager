import api from "./api.js";

const notifyFeeChange = async request => {
  const response = await request;
  try { localStorage.setItem("khiladi.fees.changed", `${Date.now()}:${Math.random()}`); } catch { /* private browser */ }
  window.dispatchEvent(new Event("khiladi:fees-changed"));
  return response;
};

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
  collect: (payload) => notifyFeeChange(api.post("/fees/collect", payload, { timeout: 120000 })),
  getPending: (params = {}) => api.get("/fees/pending", { params }),
  getPayments: (params = {}) => api.get("/fees/payments", { params }),
  getReceipt: (id) => api.get(`/fees/receipt/${id}`),
  getStudentHistory: (studentId) => api.get(`/fees/student/${studentId}`),
  update: (id, payload) => notifyFeeChange(api.patch(`/fees/${id}`, payload)),
  reverse: (id, reason) => notifyFeeChange(api.post(`/fees/${id}/reverse`, { reason })),
  remove: (id) => api.delete(`/fees/${id}`),
};
