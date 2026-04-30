import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.ts";
import { useTheme } from "../../context/ThemeContext.ts";
import { LogOut, Sun, Moon, Menu as IconMenu } from "lucide-react";
import {
  Box, Heading, HStack, IconButton, Menu, Portal,
} from "@chakra-ui/react";
import SidebarNav from "./SidebarNav.tsx";

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      as="header"
      bg={mode === "light" ? "white" : "gray.800"}
      boxShadow="sm"
      px={{ base: "3", md: "6" }}
      py="3"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top="0"
      zIndex="banner"
    >
      <HStack gap="3">
        {/* Hamburger — mobile only */}
        <Box display={{ base: "block", md: "none" }}>
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton aria-label="Menu" variant="ghost" size="sm">
                <IconMenu size={22} />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="240px">
                  <Box p="4">
                    <Heading size="xs" mb="2" color="fg.muted">Navigation</Heading>
                    <SidebarNav isMobile />
                  </Box>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
        <Heading size="sm" color={mode === "light" ? "gray.700" : "gray.200"}>
          <Box display={{ base: "none", md: "block" }}>Welcome, {user?.username}</Box>
          <Box display={{ base: "block", md: "none" }}>{user?.username}</Box>
        </Heading>
      </HStack>
      <HStack gap="2">
        <IconButton
          aria-label="Toggle Theme"
          variant="ghost"
          onClick={toggleMode}
          rounded="full"
          size="sm"
        >
          {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </IconButton>
        <IconButton
          aria-label="Logout"
          colorPalette="red"
          variant="ghost"
          onClick={handleLogout}
          rounded="full"
          size="sm"
        >
          <LogOut size={18} />
        </IconButton>
      </HStack>
    </Box>
  );
};

export default TopBar;
