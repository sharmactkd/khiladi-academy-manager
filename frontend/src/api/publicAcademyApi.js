import api from "./api.js";
export const publicAcademyApi = {
  list: (params) => api.get("/public/academies", { params }),
  get: (slug) => api.get(`/public/academies/${encodeURIComponent(slug)}`),
  enquire: (slug, payload) => api.post(`/public/academies/${encodeURIComponent(slug)}/enquiries`, payload),
  mine: () => api.get("/academy/public-profile"),
  save: (payload) => api.patch("/academy/public-profile", payload),
  publish: () => api.post("/academy/public-profile/publish"),
  unpublish: () => api.post("/academy/public-profile/unpublish"),
};
export default publicAcademyApi;
