import React from "react";
import { useAuth } from "../context/AuthContext.ts";
import { useTheme } from "../context/ThemeContext.ts";
import {
  LogOut,
  LayoutDashboard,
  Users,
  ImageIcon,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
  Settings,
  Braces,
  SquareLibrary,
  ChevronDown,
  ChevronUp,
  Menu as IconMenu,
  MoreHorizontal,
} from "lucide-react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  IconButton,
  Heading,
  Separator,
  Collapsible,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  const [isAdminOpen, setIsAdminOpen] = React.useState(
    location.pathname.startsWith("/admin/users") ||
      location.pathname.startsWith("/admin/roles") ||
      location.pathname.startsWith("/admin/permissions")
  );

  const [isPublicOpen, setIsPublicOpen] = React.useState(false);

  const activeColor = "#863bff";

  const NavContent = React.useCallback(
    ({ isMobile = false }: { isMobile?: boolean }) => (
      <VStack p={isMobile ? "0" : "4"} align="stretch" spaceY="2">
        <Link to="/admin" style={{ textDecoration: "none" }}>
          <Button
            variant={isActive("/admin") ? "subtle" : "ghost"}
            colorPalette={isActive("/admin") ? "purple" : undefined}
            justifyContent="flex-start"
            width="full"
            size={isMobile ? "sm" : "md"}
          >
            <LayoutDashboard size={20} style={{ marginRight: "8px" }} />
            Dashboard
          </Button>
        </Link>

        {hasPermission("read:photos") && (
          <Link to="/admin/photos" style={{ textDecoration: "none" }}>
            <Button
              variant={isActive("/admin/photos") ? "subtle" : "ghost"}
              colorPalette={isActive("/admin/photos") ? "purple" : undefined}
              justifyContent="flex-start"
              width="full"
              size={isMobile ? "sm" : "md"}
            >
              <ImageIcon size={20} style={{ marginRight: "8px" }} />
              Photos
            </Button>
          </Link>
        )}

        {(hasPermission("read:users") || hasPermission("read:roles")) && (
          <Collapsible.Root
            open={isAdminOpen}
            onOpenChange={(e) => setIsAdminOpen(e.open)}
          >
            <Collapsible.Trigger asChild>
              <Button
                variant="ghost"
                justifyContent="space-between"
                width="full"
                size={isMobile ? "sm" : "md"}
              >
                <HStack gap="2">
                  <ShieldCheck size={20} />
                  <span>Administration</span>
                </HStack>
                {isAdminOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <VStack align="stretch" spaceY="1" pl="4" mt="1">
                {hasPermission("read:users") && (
                  <Link to="/admin/users" style={{ textDecoration: "none" }}>
                    <Button
                      variant={isActive("/admin/users") ? "subtle" : "ghost"}
                      colorPalette={
                        isActive("/admin/users") ? "purple" : undefined
                      }
                      justifyContent="flex-start"
                      width="full"
                      size="sm"
                    >
                      <Users size={18} style={{ marginRight: "8px" }} />
                      Users
                    </Button>
                  </Link>
                )}

                {hasPermission("read:roles") && (
                  <>
                    <Link to="/admin/roles" style={{ textDecoration: "none" }}>
                      <Button
                        variant={isActive("/admin/roles") ? "subtle" : "ghost"}
                        colorPalette={
                          isActive("/admin/roles") ? "purple" : undefined
                        }
                        justifyContent="flex-start"
                        width="full"
                        size="sm"
                      >
                        <ShieldCheck size={18} style={{ marginRight: "8px" }} />
                        Roles
                      </Button>
                    </Link>
                    <Link
                      to="/admin/permissions"
                      style={{ textDecoration: "none" }}
                    >
                      <Button
                        variant={
                          isActive("/admin/permissions") ? "subtle" : "ghost"
                        }
                        colorPalette={
                          isActive("/admin/permissions") ? "purple" : undefined
                        }
                        justifyContent="flex-start"
                        width="full"
                        size="sm"
                      >
                        <Lock size={18} style={{ marginRight: "8px" }} />
                        Permissions
                      </Button>
                    </Link>
                  </>
                )}
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        )}

        <Collapsible.Root
          open={isPublicOpen}
          onOpenChange={(e) => setIsPublicOpen(e.open)}
        >
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              justifyContent="space-between"
              width="full"
              size={isMobile ? "sm" : "md"}
            >
              <HStack gap="2">
                <SquareLibrary size={20} />
                <span>Publico</span>
              </HStack>
              {isPublicOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <VStack align="stretch" spaceY="1" pl="4" mt="1">
              <Link to="/" style={{ textDecoration: "none" }}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  width="full"
                  size="sm"
                >
                  <ImageIcon size={20} style={{ marginRight: "8px" }} />
                  Photos
                </Button>
              </Link>
              <a href="/api/docs" style={{ textDecoration: "none" }}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  width="full"
                  size="sm"
                >
                  <Braces size={18} style={{ marginRight: "8px" }} />
                  Swagger
                </Button>
              </a>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
        <Link to="/admin/settings" style={{ textDecoration: "none" }}>
          <Button
            variant={isActive("/admin/settings") ? "subtle" : "ghost"}
            colorPalette={isActive("/admin/settings") ? "purple" : undefined}
            justifyContent="flex-start"
            width="full"
            size={isMobile ? "sm" : "md"}
          >
            <Settings size={20} style={{ marginRight: "8px" }} />
            Settings
          </Button>
        </Link>
      </VStack>
    ),
    [
      isActive,
      hasPermission,
      isAdminOpen,
      setIsAdminOpen,
      isPublicOpen,
      setIsPublicOpen,
    ]
  );

  // Bottom nav item for mobile
  const BottomNavItem = ({
    to,
    icon,
    label,
    active,
  }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
  }) => (
    <Link to={to} style={{ textDecoration: "none", flex: 1 }}>
      <Flex
        direction="column"
        align="center"
        justify="center"
        py="2"
        gap="0.5"
        color={active ? activeColor : undefined}
        transition="color 0.15s"
        _hover={{ color: activeColor }}
        opacity={active ? 1 : 0.6}
      >
        {icon}
        <Text
          fontSize="2xs"
          fontWeight={active ? "semibold" : "normal"}
          letterSpacing="tight"
        >
          {label}
        </Text>
      </Flex>
    </Link>
  );

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
            <Link to="/" style={{ textDecoration: "none" }}>
              RBAC App
            </Link>
          </Heading>
        </Box>
        <Separator />
        {NavContent({})}
      </Box>

      {/* Main Content */}
      <Flex flex="1" direction="column" minW="0">
        {/* Header */}
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
            {/* Hamburger — mobile only, for overflow nav items */}
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
                        <Heading size="xs" mb="2" color="fg.muted">
                          Navigation
                        </Heading>
                        {NavContent({ isMobile: true })}
                      </Box>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Box>
            <Heading
              size="sm"
              color={mode === "light" ? "gray.700" : "gray.200"}
            >
              <Box display={{ base: "none", md: "block" }}>
                Welcome, {user.username}
              </Box>
              <Box display={{ base: "block", md: "none" }}>{user.username}</Box>
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

        {/* Page content */}
        <Box
          p={{ base: "4", md: "8" }}
          flex="1"
          overflow="auto"
          pb={{ base: "calc(72px + env(safe-area-inset-bottom))", md: "8" }}
        >
          <Outlet />
        </Box>
      </Flex>

      {/* Bottom navigation bar — mobile only */}
      <Box
        as="nav"
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg={mode === "light" ? "white" : "gray.800"}
        borderTopWidth="1px"
        borderTopColor={mode === "light" ? "gray.200" : "gray.700"}
        display={{ base: "flex", md: "none" }}
        zIndex="sticky"
        px="2"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <BottomNavItem
          to="/admin"
          icon={<LayoutDashboard size={22} />}
          label="Dashboard"
          active={isActive("/admin")}
        />

        {hasPermission("read:photos") && (
          <BottomNavItem
            to="/admin/photos"
            icon={<ImageIcon size={22} />}
            label="Photos"
            active={isActive("/admin/photos")}
          />
        )}

        <BottomNavItem
          to="/admin/settings"
          icon={<Settings size={22} />}
          label="Settings"
          active={isActive("/admin/settings")}
        />

        {(hasPermission("read:users") || hasPermission("read:roles")) && (
          <BottomNavItem
            to="/admin/users"
            icon={<Users size={22} />}
            label="Users"
            active={
              isActive("/admin/users") ||
              isActive("/admin/roles") ||
              isActive("/admin/permissions")
            }
          />
        )}

        {/* More — opens the full menu */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="2"
              flex="1"
              opacity={0.6}
              _hover={{ opacity: 1 }}
              cursor="pointer"
              transition="opacity 0.15s"
            >
              <MoreHorizontal size={22} />
              <Text fontSize="2xs" letterSpacing="tight">
                More
              </Text>
            </Flex>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="220px" mb="2">
                <Box p="4">
                  <Heading size="xs" mb="2" color="fg.muted">
                    More options
                  </Heading>
                  <VStack align="stretch" spaceY="1">
                    <Link to="/" style={{ textDecoration: "none" }}>
                      <Button
                        variant="ghost"
                        justifyContent="flex-start"
                        width="full"
                        size="sm"
                      >
                        <ImageIcon size={18} style={{ marginRight: "8px" }} />
                        Public Photos
                      </Button>
                    </Link>
                    <a href="/api/docs" style={{ textDecoration: "none" }}>
                      <Button
                        variant="ghost"
                        justifyContent="flex-start"
                        width="full"
                        size="sm"
                      >
                        <Braces size={18} style={{ marginRight: "8px" }} />
                        Swagger Docs
                      </Button>
                    </a>
                  </VStack>
                </Box>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Box>
    </Flex>
  );
};

export default Layout;
