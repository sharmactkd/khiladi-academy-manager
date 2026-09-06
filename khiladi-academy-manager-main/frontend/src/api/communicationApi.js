import api from "./api.js";

export const communicationApi = {
  getLogs: (params = {}) => api.get("/communication-logs", { params }),
  sendFeeReminder: (payload) => api.post("/reminders/fee", payload),
  sendAttendanceReminder: (payload) => api.post("/reminders/attendance", payload),
};