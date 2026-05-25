import api from "./api.js";

export const academyApi = {
  createAcademy: (payload) => api.post("/academy", payload),
  getMyAcademy: () => api.get("/academy/my"),
  updateMyAcademy: (payload) => api.patch("/academy/my", payload),
};