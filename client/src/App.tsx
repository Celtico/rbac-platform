import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Settings from "./pages/Settings";
import PublicAlbums from "./pages/PublicAlbums";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  permission?: string;
}> = ({ children, permission }) => {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (permission && !hasPermission(permission)) return <Navigate to="/admin" />;
  return <>{children}</>;
};

function App() {
  console.log("App Rendering");
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicAlbums />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Layout />}>
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="albums"
                element={
                  <ProtectedRoute permission="read:albums">
                    <Albums />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute permission="read:users">
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <ProtectedRoute permission="read:roles">
                    <Roles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="permissions"
                element={
                  <ProtectedRoute permission="read:roles">
                    <Permissions />
                  </ProtectedRoute>
                }
              />
              {/* Fallback for unknown routes inside /admin */}
              <Route path="*" element={<Navigate to="/admin" />} />
            </Route>
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
