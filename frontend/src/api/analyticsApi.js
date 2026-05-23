import api from "../api";

export const getDashboardAnalytics = async (params = {}) => {
  const res = await api.get("/analytics/dashboard", { params });
  return res.data;
};

export const getStudentAnalytics = async (params = {}) => {
  const res = await api.get("/analytics/students", { params });
  return res.data;
};

export const getAttendanceAnalytics = async (params = {}) => {
  const res = await api.get("/analytics/attendance", { params });
  return res.data;
};

export const getFeesAnalytics = async (params = {}) => {
  const res = await api.get("/analytics/fees", { params });
  return res.data;
};

export const getPerformanceAnalytics = async (params = {}) => {
  const res = await api.get("/analytics/performance", { params });
  return res.data;
};