import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi.js";
import { clearAccessToken, setAccessToken } from "../api/api.js";
import { ACCESS_TOKEN_KEY, USER_KEY } from "../utils/constants.js";
import { getStoredJson, removeStoredItem, setStoredJson } from "../utils/storage.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredJson(USER_KEY));
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((userData, token) => {
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
    } catch {
      persistAuth(null, null);
      return null;
    }
  }, [persistAuth]);

useEffect(() => {
  const boot = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedUser = getStoredJson(USER_KEY);

    if (token && storedUser) {
      setAccessToken(token);
      setLoading(false);
      return;
    }

    if (!token && !storedUser) {
      persistAuth(null, null);
      setLoading(false);
      return;
    }

    await refreshAuth();
    setLoading(false);
  };

  boot();
}, [refreshAuth, persistAuth]);

  const register = async (payload) => {
    const response = await authApi.register(payload);
    const data = response.data?.data;
    persistAuth(data.user, data.accessToken);
    return data;
  };

  const login = async (payload) => {
    const response = await authApi.login(payload);
    const data = response.data?.data;
    persistAuth(data.user, data.accessToken);
    return data;
  };

  const googleLogin = async (googleToken, role = "academy_owner") => {
    const response = await authApi.googleLogin({ googleToken, role });
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
    setUser(null);
    removeStoredItem(USER_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
      loading,
      isAuthenticated: Boolean(user),
      register,
      login,
      googleLogin,
      logout,
      refreshAuth,
    }),
    [user, loading, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};