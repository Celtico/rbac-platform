import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";
import api from "../api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // The JWT is no longer stored in JS (it lives in the HttpOnly cookie). We keep
  // only the non-secret `user` profile in localStorage for instant UI gating;
  // its liveness is confirmed against the cookie on mount (see below).
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // A 401 from any API call (interceptor in api/index.ts) means the cookie is
  // gone/expired/revoked — clear the local profile.
  useEffect(() => {
    const handleAuthError = () => {
      setTimeout(() => logout(), 0);
    };

    window.addEventListener("auth-error", handleAuthError);

    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [logout]);

  // On mount, if we have an optimistic local profile, confirm the HttpOnly
  // cookie is still valid (we can't read the cookie from JS). This also refreshes
  // roles/permissions. A failure triggers the 401 interceptor → logout.
  useEffect(() => {
    if (!localStorage.getItem("user")) return;
    api
      .get("/auth/profile")
      .then(({ data }) => {
        const fresh: User = {
          id: data.userId ?? data.id,
          username: data.username,
          roles: data.roles ?? [],
          permissions: data.permissions ?? [],
        };
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => {
        // 401 is handled by the interceptor; other errors leave the optimistic
        // profile in place.
      });
  }, []);

  const hasPermission = (permission: string) =>
    user?.permissions.includes(permission) || false;
  const hasRole = (role: string) => user?.roles.includes(role) || false;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, hasPermission, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
