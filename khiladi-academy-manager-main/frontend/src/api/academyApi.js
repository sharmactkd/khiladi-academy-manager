import api from "./api.js";
import { cachedRequest, invalidateRequestCache } from "./requestCache.js";

const multipartConfig = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

export const academyApi = {
  createAcademy: async (payload) => {
    const response = payload instanceof FormData
      ? await api.post("/academy", payload, multipartConfig)
      : await api.post("/academy", payload);
    invalidateRequestCache("workspace:");
    return response;
  },

  getMyAcademy: () => cachedRequest("workspace:academy", () => api.get("/academy/my")),

  updateMyAcademy: async (payload) => {
    const response = payload instanceof FormData
      ? await api.patch("/academy/my", payload, multipartConfig)
      : await api.patch("/academy/my", payload);
    invalidateRequestCache("workspace:");
    return response;
  },
};

export default academyApi;
