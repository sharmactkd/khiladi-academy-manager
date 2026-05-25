import api from "./api.js";

export const getSkills = async (params = {}) => {
  const res = await api.get("/skills", { params });
  return res.data;
};

export const getSkillById = async (id) => {
  const res = await api.get(`/skills/${id}`);
  return res.data;
};

export const createSkill = async (payload) => {
  const res = await api.post("/skills", payload);
  return res.data;
};

export const updateSkill = async (id, payload) => {
  const res = await api.patch(`/skills/${id}`, payload);
  return res.data;
};

export const deleteSkill = async (id) => {
  const res = await api.delete(`/skills/${id}`);
  return res.data;
};

export const getSkillAssessments = async (params = {}) => {
  const res = await api.get("/skill-assessments", { params });
  return res.data;
};

export const getSkillAssessmentById = async (id) => {
  const res = await api.get(`/skill-assessments/${id}`);
  return res.data;
};

export const createSkillAssessment = async (payload) => {
  const res = await api.post("/skill-assessments", payload);
  return res.data;
};

export const updateSkillAssessment = async (id, payload) => {
  const res = await api.patch(`/skill-assessments/${id}`, payload);
  return res.data;
};

export const deleteSkillAssessment = async (id) => {
  const res = await api.delete(`/skill-assessments/${id}`);
  return res.data;
};

export const getStudentSkillProfile = async (studentId) => {
  const res = await api.get(`/skill-assessments/student/${studentId}`);
  return res.data;
};