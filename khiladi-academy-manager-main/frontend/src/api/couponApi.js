import api from "./api.js";

export const couponApi = {
  validate: (payload) => api.post("/coupons/validate", payload),
  create: (payload) => api.post("/coupons", payload),
  getAll: () => api.get("/coupons"),
  update: (id, payload) => api.patch(`/coupons/${id}`, payload),
};