import api from "./api.js";

export const billingApi = {
  createOrder: (payload) => api.post("/billing/create-order", payload),
  verifyPayment: (payload) => api.post("/billing/verify-payment", payload),
  getMySubscription: () => api.get("/billing/my-subscription"),
  getPayments: () => api.get("/billing/payments"),
  getInvoices: () => api.get("/billing/invoices"),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  cancelSubscription: () => api.post("/billing/cancel-subscription"),
  getAddOns: () => api.get("/billing/add-ons"),
  createAddOnOrder: (payload) => api.post("/billing/add-ons/create-order", payload),
  verifyAddOnPayment: (payload) => api.post("/billing/add-ons/verify-payment", payload),
  cancelEntitlement: (id, reason = "") => api.post(`/billing/add-ons/${id}/cancel`, { reason }),
};
