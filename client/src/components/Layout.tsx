import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { useTheme } from "../context/ThemeContext.ts";
import { Box, Flex, Heading, Separator } from "@chakra-ui/react";
import SidebarNav from "./layout/SidebarNav.tsx";
import TopBar from "./layout/TopBar.tsx";
import BottomNav from "./layout/BottomNav.tsx";

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useTheme();

  if (!user) return <Outlet />;

  return (
    <Flex minH="100vh" bg={mode === "light" ? "gray.50" : "gray.900"}>
      {/* Sidebar — desktop only */}
      <Box
        as="aside"
        w="64"
        bg={mode === "light" ? "white" : "gray.800"}
        boxShadow="md"
        display={{ base: "none", md: "block" }}
        position="sticky"
        top="0"
        h="100vh"
        overflowY="auto"
      >
        <Box p="6">
          <Heading size="md">
            <Link to="/" style={{ textDecoration: "none" }}>RBAC App</Link>
          </Heading>
        </Box>
        <Separator />
        <SidebarNav />
      </Box>

      {/* Main content */}
      <Flex flex="1" direction="column" minW="0">
        <TopBar />
        <Box
          p={{ base: "4", md: "8" }}
          flex="1"
          overflow="auto"
          pb={{ base: "calc(72px + env(safe-area-inset-bottom))", md: "8" }}
        >
          <Outlet />
        </Box>
      </Flex>

      <BottomNav />
    </Flex>
  );
};

export default Layout;
