import api from "./api.js";

const multipartConfig = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

export const academyApi = {
  createAcademy: (payload) =>
    payload instanceof FormData
      ? api.post("/academy", payload, multipartConfig)
      : api.post("/academy", payload),

  getMyAcademy: () => api.get("/academy/my"),

  updateMyAcademy: (payload) =>
    payload instanceof FormData
      ? api.patch("/academy/my", payload, multipartConfig)
      : api.patch("/academy/my", payload),
};

export default academyApi;