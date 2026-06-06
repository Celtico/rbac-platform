import React, { useState, useEffect, useCallback } from "react";
import { AuthContext, isTokenExpired } from "./AuthContext";
import type { User } from "./AuthContext";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token && !isTokenExpired(token)) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    } else {
      // Limpiar datos inválidos o expirados
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Verificar expiración periódicamente o al montar
  useEffect(() => {
    const handleAuthError = () => {
      setTimeout(() => logout(), 0);
    };

    window.addEventListener("auth-error", handleAuthError);

    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token)) {
      setTimeout(() => logout(), 0);
    }
  }, [logout]);

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
