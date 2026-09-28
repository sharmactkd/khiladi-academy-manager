import api from "./api.js";
import { cachedRequest, invalidateRequestCache } from "./requestCache.js";

const stableParams = (params = {}) => Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));

export const batchApi = {
  create: async (payload) => { const response = await api.post("/batches", payload); invalidateRequestCache("workspace:batches:"); return response; },
  getAll: (params = {}) => {
    const normalized = stableParams(params);
    return cachedRequest(`workspace:batches:${JSON.stringify(normalized)}`, () => api.get("/batches", { params: normalized }), 60_000);
  },
  getById: (id) => api.get(`/batches/${id}`),
  update: async (id, payload) => { const response = await api.patch(`/batches/${id}`, payload); invalidateRequestCache("workspace:batches:"); return response; },

  // soft inactive
  remove: async (id) => { const response = await api.delete(`/batches/${id}`); invalidateRequestCache("workspace:batches:"); return response; },

  // hard delete
  hardDelete: async (id) => { const response = await api.delete(`/batches/${id}/hard-delete`); invalidateRequestCache("workspace:batches:"); return response; },
};
