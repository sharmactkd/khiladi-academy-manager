import api from "../api";

export const tournamentIntegrationApi = {
  getStatus: async () => {
    const res = await api.get("/tournament-integration/status");
    return res.data;
  },

  syncStudents: async (payload = {}) => {
    const res = await api.post(
      "/tournament-integration/sync-students",
      payload
    );

    return res.data;
  },

  syncChampionships: async (payload = {}) => {
    const res = await api.post(
      "/tournament-integration/sync-championships",
      payload
    );

    return res.data;
  },
};

export default tournamentIntegrationApi;