import api from "./api.js";

export const adminApi = {
  getUsers: (params = {}) => api.get("/admin/users", { params }),
};