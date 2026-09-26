import axios from "axios";
import { cachedRequest } from "./requestCache.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Public catalogue reads must not carry session cookies. Credential-free GETs
// can be served from the CDN cache configured by the public controllers.
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

const stableParams = (params = {}) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

export const cachedPublicGet = (url, params = {}, ttlMs = 120_000) => {
  const query = stableParams(params);
  const cacheKey = `public:${url}${query ? `?${query}` : ""}`;
  return cachedRequest(cacheKey, () => publicApi.get(url, { params }), ttlMs);
};

export default publicApi;
