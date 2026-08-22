import api from "./api.js";
import { rememberDefaultCurrency } from "../utils/currency.js";

const rememberFromResponse = (response) => {
  const candidates = [response?.data?.data, response?.data, response];
  const payload = candidates.find((item) => Array.isArray(item) || item?.currencyCode);
  const branches = Array.isArray(payload) ? payload : [payload];
  const branch = branches.find((item) => item?.isMainBranch) || branches[0];
  if (branch) rememberDefaultCurrency(branch);
};

export const getBranches = async (params = {}) => {
  const res = await api.get("/branches", { params });
  rememberFromResponse(res.data);
  return res.data;
};

export const getBranchById = async (id) => {
  const res = await api.get(`/branches/${id}`);
  rememberFromResponse(res.data);
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
