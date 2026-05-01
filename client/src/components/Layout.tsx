import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { useTheme } from "../context/ThemeContext.ts";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Zap } from "lucide-react";
import SidebarNav from "./layout/SidebarNav.tsx";
import TopBar from "./layout/TopBar.tsx";

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const { pathname } = useLocation();

  const noPaddingRoutes = ["/admin/chat"];
  const hasGlobalPadding = !noPaddingRoutes.includes(pathname);

  if (!user) return <Outlet />;

  return (
    <Flex minH="100vh" bg={mode === "light" ? "gray.50" : "gray.900"}>
      {/* Sidebar — desktop only */}
      <Box
        as="aside"
        w="64"
        bg={mode === "light" ? "white" : "gray.800"}
        borderRightWidth="1px"
        borderColor={mode === "light" ? "gray.200" : "gray.700"}
        display={{ base: "none", md: "block" }}
        position="sticky"
        top="0"
        h="100vh"
        overflowY="auto"
      >
        <Box
          px="5"
          h="14"
          display="flex" alignItems="center"
          borderBottomWidth="1px"
          borderColor={mode === "light" ? "gray.200" : "gray.700"}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            <HStack gap="2">
              <Box
                w="7" h="7" rounded="md"
                bgGradient="to-br"
                gradientFrom="purple.500"
                gradientTo="blue.500"
                display="flex" alignItems="center" justifyContent="center"
                flexShrink={0}
              >
                <Zap size={14} color="white" />
              </Box>
              <Text fontWeight="semibold" fontSize="sm" letterSpacing="tight" color={mode === "light" ? "gray.800" : "white"}>
                RBAC Platform
              </Text>
            </HStack>
          </Link>
        </Box>
        <SidebarNav />
      </Box>

      {/* Main content */}
      <Flex flex="1" direction="column" minW="0">
        <TopBar />
        <Box p={hasGlobalPadding ? { base: "4", md: "8" } : "0"} flex="1" overflow="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;
