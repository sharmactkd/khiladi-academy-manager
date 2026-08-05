import api from "./api.js";

export const attendanceApi = {
  mark: (payload) => api.post("/attendance/mark", payload),
  getAll: (params = {}) => api.get("/attendance", { params }),
  getStudentHistory: (studentId, params = {}) =>
    api.get(`/attendance/student/${studentId}`, { params }),
  getStudentYearlyProfile: (studentId, params = {}) =>
    api.get(`/attendance/student/${studentId}/yearly-profile`, { params }),
  getBatchHistory: (batchId, params = {}) =>
    api.get(`/attendance/batch/${batchId}`, { params }),
  getMonthlyRegister: (params = {}) =>
    api.get("/attendance/monthly-register", { params }),
  getYearlyRegister: (params = {}) =>
    api.get("/attendance/yearly-register", { params }),
  saveMonthlyRegister: (payload) =>
    api.post("/attendance/monthly-register", payload),
  saveDayNote: (payload) => api.put("/attendance/day-note", payload),
  removeDayNote: (payload) =>
    api.delete("/attendance/day-note", { data: payload }),
  importOldAttendance: (payload) => api.post("/attendance/import", payload),
};
