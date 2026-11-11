import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { NavConfigProvider } from "./context/NavConfigContext.tsx";
import { Toaster } from "./components/ui/toaster";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import SettingsStyles from "./pages/SettingsStyles";
import SettingsDeploy from "./pages/SettingsDeploy";
import SettingsSidebar from "./pages/SettingsSidebar";
import Tenants from "./pages/Tenants";
import AuthCallback from "./pages/AuthCallback";
import PublicAlbums from "./pages/PublicAlbums";
import GlobalChat from "./pages/GlobalChat";
import SystemLogs from "./pages/SystemLogs";
import DeviceManager from "./pages/DeviceManager";
import ServerStats from "./pages/ServerStats";
import OdooManager from "./pages/OdooManager";
import { BASE_PATH } from "./config";

function App() {
  return (
    <ThemeProvider>
      <NavConfigProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter basename={BASE_PATH || undefined}>
          <Routes>
            <Route path="/" element={<PublicAlbums />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
                path="photos"
                element={
                  <ProtectedRoute permission="read:photos">
                    <Albums />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings/styles"
                element={
                  <ProtectedRoute>
                    <SettingsStyles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings/deploy"
                element={
                  <ProtectedRoute>
                    <SettingsDeploy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings/sidebar"
                element={
                  <ProtectedRoute>
                    <SettingsSidebar />
                  </ProtectedRoute>
                }
              />
              {/* Legacy redirect */}
              <Route
                path="settings"
                element={<Navigate to="/admin/settings/styles" replace />}
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
              <Route
                path="chat"
                element={
                  <ProtectedRoute permission="use:chat">
                    <GlobalChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="logs"
                element={
                  <ProtectedRoute permission="read:logsystem">
                    <SystemLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings/devices"
                element={
                  <ProtectedRoute>
                    <DeviceManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tenants"
                element={
                  <ProtectedRoute permission="read:tenants">
                    <Tenants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="system/stats"
                element={
                  <ProtectedRoute permission="read:logsystem">
                    <ServerStats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="odoo"
                element={
                  <ProtectedRoute permission="use:ai">
                    <OdooManager />
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
      </NavConfigProvider>
    </ThemeProvider>
  );
}

export default App;
