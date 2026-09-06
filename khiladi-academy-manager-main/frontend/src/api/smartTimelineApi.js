import api from "./api.js";

export const getSmartTimeline = async (studentId) => {
  const res = await api.get(`/smart-timeline/student/${studentId}`);
  return res.data;
};

export const generateSmartTimeline = async (studentId) => {
  const res = await api.post(`/smart-timeline/generate/${studentId}`);
  return res.data;
};