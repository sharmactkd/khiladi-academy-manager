import api from "../api";

export const getBranches = async (params = {}) => {
  const res = await api.get("/branches", { params });
  return res.data;
};

export const getBranchById = async (id) => {
  const res = await api.get(`/branches/${id}`);
  return res.data;
};

export const createBranch = async (payload) => {
  const res = await api.post("/branches", payload);
  return res.data;
};

export const updateBranch = async (id, payload) => {
  const res = await api.patch(`/branches/${id}`, payload);
  return res.data;
};

export const deleteBranch = async (id) => {
  const res = await api.delete(`/branches/${id}`);
  return res.data;
};