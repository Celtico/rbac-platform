import React from "react";
import { useAuth } from "../context/AuthContext.ts";
import { useTheme } from "../context/ThemeContext.ts";
import { useNavConfig } from "../context/NavConfigContext.ts";
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
  Bot,
  Palette,
  Rocket,
  SlidersHorizontal,
  Building2,
  Boxes,
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
  const { user, logout, hasPermission, hasRole } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { isEnabled } = useNavConfig();
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

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(
    location.pathname.startsWith("/admin/settings")
  );

  const [isPublicOpen, setIsPublicOpen] = React.useState(false);
  const [isModuleOpen, setIsModuleOpen] = React.useState(
    location.pathname.startsWith("/admin/photos") ||
      location.pathname.startsWith("/admin/odoo")
  );

  const activeColor = "var(--theme-active, #863bff)";

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
                <span>Public</span>
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
        {((isEnabled("sidebar", "photos") && hasPermission("read:photos")) ||
          (isEnabled("sidebar", "odoo") && hasPermission("use:ai"))) && (
          <Collapsible.Root
            open={isModuleOpen}
            onOpenChange={(e) => setIsModuleOpen(e.open)}
          >
            <Collapsible.Trigger asChild>
              {(() => {
                const moduleActive =
                  isActive("/admin/photos") || isActive("/admin/odoo");
                return (
                  <Button
                    variant={moduleActive ? "subtle" : "ghost"}
                    colorPalette={moduleActive ? "purple" : undefined}
                    justifyContent="space-between"
                    width="full"
                    size={isMobile ? "sm" : "md"}
                  >
                    <HStack gap="2">
                      <Boxes size={20} />
                      <span>Mòduls</span>
                    </HStack>
                    {isModuleOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </Button>
                );
              })()}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <VStack align="stretch" spaceY="1" pl="4" mt="1">
                {isEnabled("sidebar", "photos") && hasPermission("read:photos") && (
                  <Link to="/admin/photos" style={{ textDecoration: "none" }}>
                    <Button
                      variant={isActive("/admin/photos") ? "subtle" : "ghost"}
                      colorPalette={
                        isActive("/admin/photos") ? "purple" : undefined
                      }
                      justifyContent="flex-start"
                      width="full"
                      size="sm"
                    >
                      <ImageIcon size={18} style={{ marginRight: "8px" }} />
                      Photos
                    </Button>
                  </Link>
                )}
                {isEnabled("sidebar", "odoo") && hasPermission("use:ai") && (
                  <Link to="/admin/odoo" style={{ textDecoration: "none" }}>
                    <Button
                      variant={isActive("/admin/odoo") ? "subtle" : "ghost"}
                      colorPalette={
                        isActive("/admin/odoo") ? "purple" : undefined
                      }
                      justifyContent="flex-start"
                      width="full"
                      size="sm"
                    >
                      <Bot size={18} style={{ marginRight: "8px" }} />
                      Odoo AI
                    </Button>
                  </Link>
                )}
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        {((isEnabled("sidebar", "users") && hasPermission("read:users")) ||
          (isEnabled("sidebar", "roles") && hasPermission("read:roles")) ||
          (isEnabled("sidebar", "permissions") && hasPermission("read:roles")) ||
          (isEnabled("sidebar", "tenants") &&
            (hasPermission("read:tenants") ||
              hasPermission("manage:tenants")))) && (
          <Collapsible.Root
            open={isAdminOpen}
            onOpenChange={(e) => setIsAdminOpen(e.open)}
          >
            <Collapsible.Trigger asChild>
              {(() => {
                const adminActive =
                  isActive("/admin/users") ||
                  isActive("/admin/roles") ||
                  isActive("/admin/permissions") ||
                  isActive("/admin/tenants");
                return (
                  <Button
                    variant={adminActive ? "subtle" : "ghost"}
                    colorPalette={adminActive ? "purple" : undefined}
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
                );
              })()}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <VStack align="stretch" spaceY="1" pl="4" mt="1">
                {isEnabled("sidebar", "users") && hasPermission("read:users") && (
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

                {isEnabled("sidebar", "roles") && hasPermission("read:roles") && (
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
                )}
                {isEnabled("sidebar", "permissions") && hasPermission("read:roles") && (
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
                )}
                {isEnabled("sidebar", "tenants") &&
                  (hasPermission("read:tenants") ||
                    hasPermission("manage:tenants")) && (
                    <Link
                      to="/admin/tenants"
                      style={{ textDecoration: "none" }}
                    >
                      <Button
                        variant={
                          isActive("/admin/tenants") ? "subtle" : "ghost"
                        }
                        colorPalette={
                          isActive("/admin/tenants") ? "purple" : undefined
                        }
                        justifyContent="flex-start"
                        width="full"
                        size="sm"
                      >
                        <Building2 size={18} style={{ marginRight: "8px" }} />
                        Tenants
                      </Button>
                    </Link>
                  )}
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        <Collapsible.Root
          open={isSettingsOpen}
          onOpenChange={(e) => setIsSettingsOpen(e.open)}
        >
          <Collapsible.Trigger asChild>
            {(() => {
              const settingsActive = isActive("/admin/settings");
              return (
                <Button
                  variant={settingsActive ? "subtle" : "ghost"}
                  colorPalette={settingsActive ? "purple" : undefined}
                  justifyContent="space-between"
                  width="full"
                  size={isMobile ? "sm" : "md"}
                >
                  <HStack gap="2">
                    <Settings size={20} />
                    <span>Settings</span>
                  </HStack>
                  {isSettingsOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </Button>
              );
            })()}
          </Collapsible.Trigger>
          <Collapsible.Content>
            <VStack align="stretch" spaceY="1" pl="4" mt="1">
              {isEnabled("sidebar", "settings-styles") && (
                <Link
                  to="/admin/settings/styles"
                  style={{ textDecoration: "none" }}
                >
                  <Button
                    variant={
                      isActive("/admin/settings/styles") ? "subtle" : "ghost"
                    }
                    colorPalette={
                      isActive("/admin/settings/styles") ? "purple" : undefined
                    }
                    justifyContent="flex-start"
                    width="full"
                    size="sm"
                  >
                    <Palette size={18} style={{ marginRight: "8px" }} />
                    Estils i Temes
                  </Button>
                </Link>
              )}
              {isEnabled("sidebar", "settings-deploy") && hasRole("admin") && (
                <Link
                  to="/admin/settings/deploy"
                  style={{ textDecoration: "none" }}
                >
                  <Button
                    variant={
                      isActive("/admin/settings/deploy") ? "subtle" : "ghost"
                    }
                    colorPalette={
                      isActive("/admin/settings/deploy") ? "purple" : undefined
                    }
                    justifyContent="flex-start"
                    width="full"
                    size="sm"
                  >
                    <Rocket size={18} style={{ marginRight: "8px" }} />
                    Desplegament
                  </Button>
                </Link>
              )}
              <Link
                to="/admin/settings/sidebar"
                style={{ textDecoration: "none" }}
              >
                <Button
                  variant={
                    isActive("/admin/settings/sidebar") ? "subtle" : "ghost"
                  }
                  colorPalette={
                    isActive("/admin/settings/sidebar") ? "purple" : undefined
                  }
                  justifyContent="flex-start"
                  width="full"
                  size="sm"
                >
                  <SlidersHorizontal size={18} style={{ marginRight: "8px" }} />
                  Sidebar
                </Button>
              </Link>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </VStack>
    ),
    [
      isActive,
      hasPermission,
      hasRole,
      isEnabled,
      isModuleOpen,
      setIsModuleOpen,
      isAdminOpen,
      setIsAdminOpen,
      isSettingsOpen,
      setIsSettingsOpen,
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

        {isEnabled("sidebar", "photos") && hasPermission("read:photos") && (
          <BottomNavItem
            to="/admin/photos"
            icon={<ImageIcon size={22} />}
            label="Photos"
            active={isActive("/admin/photos")}
          />
        )}

        {isEnabled("sidebar", "odoo") && hasPermission("use:ai") && (
          <BottomNavItem
            to="/admin/odoo"
            icon={<Bot size={22} />}
            label="Odoo AI"
            active={isActive("/admin/odoo")}
          />
        )}

        <BottomNavItem
          to="/admin/settings/styles"
          icon={<Settings size={22} />}
          label="Settings"
          active={isActive("/admin/settings")}
        />

        {((isEnabled("sidebar", "users") && hasPermission("read:users")) ||
          (isEnabled("sidebar", "roles") && hasPermission("read:roles")) ||
          (isEnabled("sidebar", "permissions") && hasPermission("read:roles")) ||
          (isEnabled("sidebar", "tenants") &&
            (hasPermission("read:tenants") ||
              hasPermission("manage:tenants")))) && (
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
