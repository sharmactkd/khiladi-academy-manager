import api from "./api.js";

export const tournamentIntegrationApi = {
  getStatus: () => api.get("/tournament-integrations/status"),
  getLogs: (params = {}) => api.get("/tournament-integrations/logs", { params }),
  connect: (payload) => api.post("/tournament-integrations/connect", payload),
  disconnect: () => api.patch("/tournament-integrations/disconnect"),
  regenerateKey: () => api.post("/tournament-integrations/regenerate-key"),
};

export default tournamentIntegrationApi;
