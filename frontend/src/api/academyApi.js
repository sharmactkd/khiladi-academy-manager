import api from "./api.js";

export const academyApi = {
  createAcademy: (payload) => api.post("/academies", payload),
  getMyAcademy: () => api.get("/academies/my"),
  updateMyAcademy: (payload) => api.patch("/academies/my", payload),
};