import api from "./api.js";

export const planApi = {
  getAll: () => api.get("/plans"),
  getByCode: (code) => api.get(`/plans/${code}`),
  seedDefaults: () => api.post("/plans/seed-defaults"),
  update: (id, payload) => api.patch(`/plans/${id}`, payload),
};
