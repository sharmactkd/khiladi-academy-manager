import api from "./api.js";

export const expenseApi = {
  list: (params = {}) => api.get("/expenses", { params }),
  create: (payload) => api.post("/expenses", payload),
  update: (id, payload) => api.patch(`/expenses/${id}`, payload),
  delete: (id, reason) => api.delete(`/expenses/${id}`, { data: { reason } }),
  reverse: (id, reason) => api.post(`/expenses/${id}/reverse`, { reason }),
  listCategories: (params = {}) => api.get("/expenses/categories", { params }),
  createCategory: (payload) => api.post("/expenses/categories", payload),
  deleteCategory: (id) => api.delete(`/expenses/categories/${id}`),
};
