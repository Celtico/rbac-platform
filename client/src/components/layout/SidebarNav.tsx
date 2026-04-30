import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.ts";
import { useNavConfig } from "../../context/NavConfigContext.ts";
import {
  LayoutDashboard, Users, ImageIcon, ShieldCheck, Lock, Settings,
  Braces, SquareLibrary, ChevronDown, ChevronUp, Bot, Palette,
  Rocket, SlidersHorizontal, Building2, Boxes,
} from "lucide-react";
import {
  Box, Button, Collapsible, HStack, VStack,
} from "@chakra-ui/react";

const SidebarNav: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const { hasPermission } = useAuth();
  const { isEnabled } = useNavConfig();
  const location = useLocation();

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

  const size = isMobile ? "sm" : "md";

  return (
    <VStack p={isMobile ? "0" : "4"} align="stretch" spaceY="2">
      <Link to="/admin" style={{ textDecoration: "none" }}>
        <Button
          variant={isActive("/admin") ? "subtle" : "ghost"}
          colorPalette={isActive("/admin") ? "purple" : undefined}
          justifyContent="flex-start"
          width="full"
          size={size}
        >
          <LayoutDashboard size={20} style={{ marginRight: "8px" }} />
          Dashboard
        </Button>
      </Link>

      <Collapsible.Root open={isPublicOpen} onOpenChange={(e) => setIsPublicOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button variant="ghost" justifyContent="space-between" width="full" size={size}>
            <HStack gap="2">
              <SquareLibrary size={20} />
              <span>Public</span>
            </HStack>
            {isPublicOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <VStack align="stretch" spaceY="1" pl="4" mt="1">
            <Link to="/" style={{ textDecoration: "none" }}>
              <Button variant="ghost" justifyContent="flex-start" width="full" size="sm">
                <ImageIcon size={20} style={{ marginRight: "8px" }} />
                Photos
              </Button>
            </Link>
            <a href="/api/docs" style={{ textDecoration: "none" }}>
              <Button variant="ghost" justifyContent="flex-start" width="full" size="sm">
                <Braces size={18} style={{ marginRight: "8px" }} />
                Swagger
              </Button>
            </a>
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>

      {((isEnabled("sidebar", "photos") && hasPermission("read:photos")) ||
        (isEnabled("sidebar", "odoo") && hasPermission("use:ai"))) && (
        <Collapsible.Root open={isModuleOpen} onOpenChange={(e) => setIsModuleOpen(e.open)}>
          <Collapsible.Trigger asChild>
            {(() => {
              const moduleActive = isActive("/admin/photos") || isActive("/admin/odoo");
              return (
                <Button
                  variant={moduleActive ? "subtle" : "ghost"}
                  colorPalette={moduleActive ? "purple" : undefined}
                  justifyContent="space-between"
                  width="full"
                  size={size}
                >
                  <HStack gap="2">
                    <Boxes size={20} />
                    <span>Mòduls</span>
                  </HStack>
                  {isModuleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                    colorPalette={isActive("/admin/photos") ? "purple" : undefined}
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
                    colorPalette={isActive("/admin/odoo") ? "purple" : undefined}
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
          (hasPermission("read:tenants") || hasPermission("manage:tenants")))) && (
        <Collapsible.Root open={isAdminOpen} onOpenChange={(e) => setIsAdminOpen(e.open)}>
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
                  size={size}
                >
                  <HStack gap="2">
                    <ShieldCheck size={20} />
                    <span>Administration</span>
                  </HStack>
                  {isAdminOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                    colorPalette={isActive("/admin/users") ? "purple" : undefined}
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
                    colorPalette={isActive("/admin/roles") ? "purple" : undefined}
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
                <Link to="/admin/permissions" style={{ textDecoration: "none" }}>
                  <Button
                    variant={isActive("/admin/permissions") ? "subtle" : "ghost"}
                    colorPalette={isActive("/admin/permissions") ? "purple" : undefined}
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
                (hasPermission("read:tenants") || hasPermission("manage:tenants")) && (
                  <Link to="/admin/tenants" style={{ textDecoration: "none" }}>
                    <Button
                      variant={isActive("/admin/tenants") ? "subtle" : "ghost"}
                      colorPalette={isActive("/admin/tenants") ? "purple" : undefined}
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

      <Collapsible.Root open={isSettingsOpen} onOpenChange={(e) => setIsSettingsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          {(() => {
            const settingsActive = isActive("/admin/settings");
            return (
              <Button
                variant={settingsActive ? "subtle" : "ghost"}
                colorPalette={settingsActive ? "purple" : undefined}
                justifyContent="space-between"
                width="full"
                size={size}
              >
                <HStack gap="2">
                  <Settings size={20} />
                  <span>Settings</span>
                </HStack>
                {isSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            );
          })()}
        </Collapsible.Trigger>
        <Collapsible.Content>
          <VStack align="stretch" spaceY="1" pl="4" mt="1">
            {isEnabled("sidebar", "settings-styles") && (
              <Link to="/admin/settings/styles" style={{ textDecoration: "none" }}>
                <Button
                  variant={isActive("/admin/settings/styles") ? "subtle" : "ghost"}
                  colorPalette={isActive("/admin/settings/styles") ? "purple" : undefined}
                  justifyContent="flex-start"
                  width="full"
                  size="sm"
                >
                  <Palette size={18} style={{ marginRight: "8px" }} />
                  Estils i Temes
                </Button>
              </Link>
            )}
            {isEnabled("sidebar", "settings-deploy") && hasPermission("manage:deploy") && (
              <Link to="/admin/settings/deploy" style={{ textDecoration: "none" }}>
                <Button
                  variant={isActive("/admin/settings/deploy") ? "subtle" : "ghost"}
                  colorPalette={isActive("/admin/settings/deploy") ? "purple" : undefined}
                  justifyContent="flex-start"
                  width="full"
                  size="sm"
                >
                  <Rocket size={18} style={{ marginRight: "8px" }} />
                  Desplegament
                </Button>
              </Link>
            )}
            <Link to="/admin/settings/sidebar" style={{ textDecoration: "none" }}>
              <Button
                variant={isActive("/admin/settings/sidebar") ? "subtle" : "ghost"}
                colorPalette={isActive("/admin/settings/sidebar") ? "purple" : undefined}
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
  );
};

export default SidebarNav;
