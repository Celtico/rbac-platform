import { createContext, useContext } from "react";

export interface User {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  user: User | null;
  // The JWT now lives ONLY in the HttpOnly cookie (never in JS/localStorage),
  // so login just records the non-secret user profile for UI gating.
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
