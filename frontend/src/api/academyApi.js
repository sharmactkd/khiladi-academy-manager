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
  getMyAcademies: () => api.get("/academy/mine"),

  selectAcademy: (academyId) => {
    if (academyId) localStorage.setItem("khiladi_active_academy_id", academyId);
    else localStorage.removeItem("khiladi_active_academy_id");
    invalidateRequestCache("workspace:");
    window.dispatchEvent(new CustomEvent("khiladi:academy-changed", { detail: { academyId } }));
  },

  updateMyAcademy: async (payload) => {
    const response = payload instanceof FormData
      ? await api.patch("/academy/my", payload, multipartConfig)
      : await api.patch("/academy/my", payload);
    invalidateRequestCache("workspace:");
    return response;
  },
};

export default academyApi;
