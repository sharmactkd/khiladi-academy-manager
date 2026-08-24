import api from "./api.js";

export const academyEventApi = {
  getAll: (params = {}) => api.get("/academy-events", { params }),
  getById: (id) => api.get(`/academy-events/${id}`),
  create: (payload) => api.post("/academy-events", payload),
  update: (id, payload) => api.patch(`/academy-events/${id}`, payload),
  remove: (id) => api.delete(`/academy-events/${id}`),
  addParticipants: (id, participants) => api.post(`/academy-events/${id}/participants`, { participants }),
  updateParticipant: (id, participantId, payload) => api.patch(`/academy-events/${id}/participants/${participantId}`, payload),
  removeParticipant: (id, participantId) => api.delete(`/academy-events/${id}/participants/${participantId}`),
  finalize: (id) => api.post(`/academy-events/${id}/finalize`),
};
