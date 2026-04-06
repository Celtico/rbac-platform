import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LogOut,
  LayoutDashboard,
  Disc,
  Users,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
  Settings,
  Braces,
  SquareLibrary,
} from "lucide-react";
import { Link, useNavigate, Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors duration-200">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md">
        <div className="p-6 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            RBAC Album App
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            to="/admin"
            className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </Link>

          {hasPermission("read:albums") && (
            <Link
              to="/admin/albums"
              className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Disc className="w-5 h-5 mr-3" /> Albums
            </Link>
          )}

          <Link
            to="/admin/settings"
            className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" /> Settings
          </Link>

          {hasPermission("read:users") && (
            <Link
              to="/admin/users"
              className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Users className="w-5 h-5 mr-3" /> Users
            </Link>
          )}

          {hasPermission("read:roles") && (
            <>
              <Link
                to="/admin/roles"
                className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ShieldCheck className="w-5 h-5 mr-3" /> Roles
              </Link>
              <Link
                to="/admin/permissions"
                className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <Lock className="w-5 h-5 mr-3" /> Permissions
              </Link>
            </>
          )}
          <Link
            to="/"
            className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <SquareLibrary className="w-5 h-5 mr-3" /> Public View
          </Link>
          <a
            href="/api/docs"
            className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Braces className="w-5 h-5 mr-3" /> Swagger
          </a>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center transition-colors">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Welcome, {user.username}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle Theme"
            >
              {mode === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
