import api from "./index.js";

export const tournamentSyncApi = {
  submitEntry: (payload) => api.post("/tournament-sync/entries", payload),

  getEntries: (params = {}) =>
    api.get("/tournament-sync/entries", { params }),

  getStudentEntries: (studentId) =>
    api.get(`/tournament-sync/entries/student/${studentId}`),

  cancelEntry: (id) => api.patch(`/tournament-sync/entries/${id}/cancel`),

  importResult: (payload) =>
    api.post("/tournament-sync/results/import", payload),

  getResults: (params = {}) =>
    api.get("/tournament-sync/results", { params }),

  getStudentResults: (studentId) =>
    api.get(`/tournament-sync/results/student/${studentId}`),
};