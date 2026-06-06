import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.ts";
import { useTheme } from "../../context/ThemeContext.ts";
import { LogOut, Sun, Moon, Menu as IconMenu, Zap } from "lucide-react";
import {
  Box, HStack, IconButton, Menu, Portal, Text,
} from "@chakra-ui/react";
import SidebarNav from "./SidebarNav.tsx";

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      as="header"
      bg={mode === "light" ? "white" : "gray.800"}
      borderBottomWidth="1px"
      borderColor={mode === "light" ? "gray.200" : "gray.700"}
      px={{ base: "4", md: "6" }}
      h="14"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top="0"
      zIndex="banner"
    >
      {/* Left: logo (mobile only, desktop has sidebar) */}
      <HStack gap="2" display={{ base: "flex", md: "none" }}>
        <Box
          w="7" h="7" rounded="md"
          bgGradient="to-br" gradientFrom="purple.500" gradientTo="blue.500"
          display="flex" alignItems="center" justifyContent="center"
        >
          <Zap size={14} color="white" />
        </Box>
        <Text fontWeight="semibold" fontSize="sm" letterSpacing="tight">
          RBAC Platform
        </Text>
      </HStack>

      {/* Desktop left: empty spacer */}
      <Box display={{ base: "none", md: "block" }} />

      {/* Right: theme + user menu */}
      <HStack gap="1">
        {/* Theme toggle */}
        <IconButton
          aria-label="Canviar tema"
          variant="ghost"
          size="sm"
          rounded="full"
          onClick={toggleMode}
        >
          {mode === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </IconButton>

        {/* User menu */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <HStack
              gap="2"
              px="2"
              py="1"
              rounded="full"
              cursor="pointer"
              _hover={{ bg: mode === "light" ? "gray.100" : "gray.700" }}
              transition="background 0.15s"
            >
              <Box
                w="7" h="7" rounded="full"
                bgGradient="to-br" gradientFrom="purple.400" gradientTo="blue.400"
                display="flex" alignItems="center" justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize="2xs" fontWeight="bold" color="white">{initials}</Text>
              </Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                display={{ base: "none", sm: "block" }}
                maxW="28"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
              >
                {user?.username}
              </Text>
            </HStack>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="160px">
                <Menu.Item
                  value="logout"
                  color="fg.error"
                  _hover={{ bg: "bg.error", color: "fg.error" }}
                  onClick={handleLogout}
                >
                  <HStack gap="2">
                    <LogOut size={15} />
                    <span>Tancar sessió</span>
                  </HStack>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        {/* Hamburger — mobile nav */}
        <Box display={{ base: "block", md: "none" }}>
          <Menu.Root open={mobileMenuOpen} onOpenChange={({ open }) => setMobileMenuOpen(open)}>
            <Menu.Trigger asChild>
              <IconButton aria-label="Navegació" variant="ghost" size="sm">
                <IconMenu size={20} />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="260px">
                  <Box p="3">
                    <SidebarNav isMobile />
                  </Box>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
      </HStack>
    </Box>
  );
};

export default TopBar;
