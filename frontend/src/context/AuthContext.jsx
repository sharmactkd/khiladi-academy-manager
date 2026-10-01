import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/api.js";
import { USER_KEY } from "../utils/constants.js";
import { getStoredJson, removeStoredItem, setStoredJson } from "../utils/storage.js";
import { clearRequestCache } from "../api/requestCache.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [cachedUser] = useState(() => getStoredJson(USER_KEY));
  const publicBootPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/academies", "/verify/"];
  const isPublicBoot = typeof window !== "undefined" && publicBootPaths.some((path) => window.location.pathname === path || window.location.pathname.startsWith(`${path}/`) || (path.endsWith("/") && window.location.pathname.startsWith(path)));
  const [user, setUser] = useState(() => cachedUser);
  const [loading, setLoading] = useState(() => !isPublicBoot);

  const persistAuth = useCallback((userData, token) => {
    clearRequestCache();
    setUser(userData || null);

    if (userData) {
      setStoredJson(USER_KEY, userData);
    } else {
      removeStoredItem(USER_KEY);
    }

    setAccessToken(token || null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      const data = response.data?.data;

      if (data?.accessToken && data?.user) {
        persistAuth(data.user, data.accessToken);
        return data.user;
      }

      persistAuth(null, null);
      return null;
    } catch (error) {
      if ([401, 403].includes(error?.response?.status)) {
        persistAuth(null, null);
        return null;
      }
      // Keep the display session during offline periods and free-host cold
      // starts. Protected API calls will retry refresh when connectivity is
      // available again.
      return cachedUser || null;
    }
  }, [cachedUser, persistAuth]);

  useEffect(() => {
    const boot = async () => {
      // Always validate/restore through the HttpOnly refresh cookie. Cached
      // user data is display-only and never treated as proof of authentication.
      // Public/auth pages must render immediately. Only attempt a background
      // restore there when this browser already knows about a prior session.
      if (isPublicBoot) {
        setLoading(false);
        if (cachedUser) await refreshAuth();
        return;
      }
      await refreshAuth();
      setLoading(false);
    };

    boot();
  }, [refreshAuth, isPublicBoot, cachedUser]);

  useEffect(() => {
    if (!user) return undefined;
    const refreshWhenActive = () => {
      if (navigator.onLine && document.visibilityState === "visible") {
        refreshAuth();
      }
    };
    const interval = window.setInterval(refreshWhenActive, 10 * 60 * 1000);
    window.addEventListener("online", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [refreshAuth, user]);

  useEffect(() => {
    const handleAuthenticationExpired = () => {
      clearAccessToken();
      clearRequestCache();
      setUser(null);
      removeStoredItem(USER_KEY);
      sessionStorage.removeItem("khiladi:last-report");
    };

    window.addEventListener("khiladi:auth-expired", handleAuthenticationExpired);
    return () => window.removeEventListener("khiladi:auth-expired", handleAuthenticationExpired);
  }, []);

  const register = async (payload) => {
    const response = await authApi.register(payload);
    const data = response.data?.data;
    if (data?.accessToken) persistAuth(data.user, data.accessToken);
    else persistAuth(null, null);
    return data;
  };

  const verifyEmail = useCallback(async (token) => {
    const response = await authApi.verifyEmail({ token });
    const data = response.data?.data;
    persistAuth(data?.user, data?.accessToken);
    return data;
  }, [persistAuth]);

  const login = async (payload) => {
    const response = await authApi.login(payload);
    const data = response.data?.data;
    persistAuth(data.user, data.accessToken);
    const warmCommonRoutes = () => {
      import("../pages/dashboard/OwnerDashboard.jsx");
      import("../pages/attendance/Attendance.jsx");
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(warmCommonRoutes, { timeout: 2_000 });
    } else {
      window.setTimeout(warmCommonRoutes, 1_500);
    }
    return data;
  };

  const googleLogin = async (googleToken, role = "academy_owner") => {
    const response = await authApi.googleLogin({ googleToken, role });
    const data = response.data?.data;
    if (data?.requiresMfa) return data;
    persistAuth(data.user, data.accessToken);
    return data;
  };
  const ssoExchange = async (payload) => {
    const response = await authApi.ssoExchange(payload);
    const data = response.data?.data;
    if (!data?.requiresMfa) persistAuth(data.user, data.accessToken);
    return data;
  };

  const completeGoogleMfa = async (challengeToken, mfaCode) => {
    const response = await authApi.completeGoogleMfa({ challengeToken, mfaCode });
    const data = response.data?.data;
    persistAuth(data.user, data.accessToken);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout should clear local auth even if server call fails.
    }

    clearAccessToken();
    clearRequestCache();
    setUser(null);
    removeStoredItem(USER_KEY);
    sessionStorage.removeItem("khiladi:last-report");
  };

  const value = useMemo(
    () => ({
      user,
      accessToken: getAccessToken(),
      loading,
      isAuthenticated: Boolean(user),
      register,
      login,
      googleLogin,
      ssoExchange,
      completeGoogleMfa,
      verifyEmail,
      logout,
      refreshAuth,
    }),
    [user, loading, refreshAuth, verifyEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
