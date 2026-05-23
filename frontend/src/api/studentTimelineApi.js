import api from "./api.js";

export const studentTimelineApi = {
  getByStudent: (studentId, params = {}) =>
    api.get(`/student-timeline/${studentId}`, { params }),

  createNote: (payload) => api.post("/student-timeline", payload),
};