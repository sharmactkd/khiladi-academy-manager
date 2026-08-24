// Compatibility entry point. Keep one hardened Axios instance and one
// memory-only access-token store across the entire frontend.
export { default } from "./api.js";
export {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./api.js";
