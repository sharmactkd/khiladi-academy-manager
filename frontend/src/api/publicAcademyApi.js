import api from "./api.js";
import { cachedPublicGet } from "./publicApi.js";
export const publicAcademyApi = {
  list: (params) => cachedPublicGet("/public/academies", params, 120_000),
  get: (slug) =>
    cachedPublicGet(`/public/academies/${encodeURIComponent(slug)}`, {}, 300_000),
  prefetch: (slug) =>
    cachedPublicGet(`/public/academies/${encodeURIComponent(slug)}`, {}, 300_000)
      .catch(() => null),
  enquire: (slug, payload) => api.post(`/public/academies/${encodeURIComponent(slug)}/enquiries`, payload),
  mine: () => api.get("/academy/public-profile"),
  save: (payload) => api.patch("/academy/public-profile", payload),
  publish: () => api.post("/academy/public-profile/publish"),
  unpublish: () => api.post("/academy/public-profile/unpublish"),
};
export default publicAcademyApi;
