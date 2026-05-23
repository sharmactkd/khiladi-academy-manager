import api from "./api.js";

export const planApi = {
  getAll: () => api.get("/plans"),
  getByCode: (code) => api.get(`/plans/${code}`),
  seedDefaults: () => api.post("/plans/seed-defaults"),
};