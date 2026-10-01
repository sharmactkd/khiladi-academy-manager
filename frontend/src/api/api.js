import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Deliberately memory-only. The HttpOnly refresh cookie restores the session
// after a reload without exposing a long-lived bearer token to JavaScript.
let accessToken = null;
let isRefreshing = false;
let failedQueue = [];
let directRefreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

const notifyAuthenticationExpired = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("khiladi:auth-expired"));
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// React StrictMode and simultaneous protected requests can ask for a refresh
// at the same time. Keep one browser-side refresh request in flight so a
// rotating HttpOnly token is never submitted twice by the same tab.
export const requestTokenRefresh = () => {
  if (!directRefreshPromise) {
    directRefreshPromise = api
      // A free Render service can need considerably longer than the normal API
      // timeout to wake up. A cold start is not an expired login session.
      .post("/auth/refresh", undefined, { timeout: 75000 })
      .finally(() => {
        directRefreshPromise = null;
      });
  }

  return directRefreshPromise;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const activeAcademyId = localStorage.getItem("khiladi_active_academy_id");
    if (activeAcademyId) config.headers["X-Academy-Id"] = activeAcademyId;
  } catch {
    // Requests remain usable when browser storage is unavailable.
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await requestTokenRefresh();
      const newAccessToken = response.data?.data?.accessToken;

      setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Only the server can definitively end a login. Network failures,
      // cold-start timeouts and rotation conflicts must retain the local user
      // so the next request can retry the HttpOnly refresh cookie.
      if ([401, 403].includes(refreshError?.response?.status)) {
        clearAccessToken();
        notifyAuthenticationExpired();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
