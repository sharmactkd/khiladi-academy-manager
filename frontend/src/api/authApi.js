import api from "./api.js";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  googleLogin: (payload) => api.post("/auth/google", payload),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
  verifyEmail: (payload) => api.post("/auth/verify-email", payload),
  resendVerification: (payload) => api.post("/auth/resend-verification", payload),
  sessions: () => api.get("/auth/sessions"),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  revokeAllSessions: () => api.delete("/auth/sessions"),
  beginMfaSetup: () => api.post("/auth/mfa/setup"),
  enableMfa: (payload) => api.post("/auth/mfa/enable", payload),
  disableMfa: (payload) => api.post("/auth/mfa/disable", payload),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};
