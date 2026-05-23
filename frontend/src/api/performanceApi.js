import api from "../api";

export const getStudentPerformance = async (studentId) => {
  const res = await api.get(`/performance/student/${studentId}`);
  return res.data;
};

export const getAcademyPerformance = async (params = {}) => {
  const res = await api.get("/performance/academy", { params });
  return res.data;
};

export const getBatchPerformance = async (batchId) => {
  const res = await api.get(`/performance/batch/${batchId}`);
  return res.data;
};