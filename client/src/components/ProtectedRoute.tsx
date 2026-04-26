import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
}) => {
  const { user, hasPermission } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/admin" />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
