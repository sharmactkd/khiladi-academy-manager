import api from "./api.js";

export const attendanceApi = {
  mark: (payload) => api.post("/attendance/mark", payload),
  getAll: (params = {}) => api.get("/attendance", { params }),
  getStudentHistory: (studentId, params = {}) =>
    api.get(`/attendance/student/${studentId}`, { params }),
  getBatchHistory: (batchId, params = {}) =>
    api.get(`/attendance/batch/${batchId}`, { params }),
};