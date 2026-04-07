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
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  IconButton,
  Heading,
  Separator,
} from "@chakra-ui/react";

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
    <Flex minH="100vh" bg={mode === "light" ? "gray.50" : "gray.900"}>
      {/* Sidebar */}
      <Box
        as="aside"
        w="64"
        bg={mode === "light" ? "white" : "gray.800"}
        boxShadow="md"
        display={{ base: "none", md: "block" }}
      >
        <Box p="6">
          <Heading size="md">RBAC Album App</Heading>
        </Box>
        <Separator />
        <VStack p="4" align="stretch" spaceY="2">
          <Link to="/admin" style={{ textDecoration: "none" }}>
            <Button variant="ghost" justifyContent="flex-start" width="full">
              <LayoutDashboard size={20} style={{ marginRight: "8px" }} />
              Dashboard
            </Button>
          </Link>

          {hasPermission("read:albums") && (
            <Link to="/admin/albums" style={{ textDecoration: "none" }}>
              <Button variant="ghost" justifyContent="flex-start" width="full">
                <Disc size={20} style={{ marginRight: "8px" }} />
                Albums
              </Button>
            </Link>
          )}

          <Link to="/admin/settings" style={{ textDecoration: "none" }}>
            <Button variant="ghost" justifyContent="flex-start" width="full">
              <Settings size={20} style={{ marginRight: "8px" }} />
              Settings
            </Button>
          </Link>

          {hasPermission("read:users") && (
            <Link to="/admin/users" style={{ textDecoration: "none" }}>
              <Button variant="ghost" justifyContent="flex-start" width="full">
                <Users size={20} style={{ marginRight: "8px" }} />
                Users
              </Button>
            </Link>
          )}

          {hasPermission("read:roles") && (
            <>
              <Link to="/admin/roles" style={{ textDecoration: "none" }}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  width="full"
                >
                  <ShieldCheck size={20} style={{ marginRight: "8px" }} />
                  Roles
                </Button>
              </Link>
              <Link to="/admin/permissions" style={{ textDecoration: "none" }}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  width="full"
                >
                  <Lock size={20} style={{ marginRight: "8px" }} />
                  Permissions
                </Button>
              </Link>
            </>
          )}

          <Link to="/" style={{ textDecoration: "none" }}>
            <Button variant="ghost" justifyContent="flex-start" width="full">
              <SquareLibrary size={20} style={{ marginRight: "8px" }} />
              Public View
            </Button>
          </Link>

          <a href="/api/docs" style={{ textDecoration: "none" }}>
            <Button variant="ghost" justifyContent="flex-start" width="full">
              <Braces size={20} style={{ marginRight: "8px" }} />
              Swagger
            </Button>
          </a>
        </VStack>
      </Box>

      {/* Main Content */}
      <Flex flex="1" direction="column">
        <Box
          as="header"
          bg={mode === "light" ? "white" : "gray.800"}
          boxShadow="sm"
          p="4"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Heading size="sm" color={mode === "light" ? "gray.700" : "gray.200"}>
            Welcome, {user.username}
          </Heading>
          <HStack gap="4">
            <IconButton
              aria-label="Toggle Theme"
              variant="ghost"
              onClick={toggleMode}
              rounded="full"
            >
              {mode === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </IconButton>
            <Button colorPalette="red" onClick={handleLogout} size="sm">
              <LogOut size={16} style={{ marginRight: "4px" }} />
              Logout
            </Button>
          </HStack>
        </Box>
        <Box p="8" flex="1" overflow="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;
