import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.ts";
import { useNavConfig } from "../../context/NavConfigContext.ts";
import { useTheme } from "../../context/ThemeContext.ts";
import {
  LayoutDashboard, ImageIcon, Bot, Settings, Users,
  MoreHorizontal, Braces,
} from "lucide-react";
import {
  Box, Button, Flex, Heading, Menu, Portal, Text, VStack,
} from "@chakra-ui/react";

const BottomNavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}> = ({ to, icon, label, active }) => {
  const activeColor = "var(--theme-active, #863bff)";
  return (
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
        <Text fontSize="2xs" fontWeight={active ? "semibold" : "normal"} letterSpacing="tight">
          {label}
        </Text>
      </Flex>
    </Link>
  );
};

const BottomNav: React.FC = () => {
  const { hasPermission } = useAuth();
  const { isEnabled } = useNavConfig();
  const { mode } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  return (
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
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <BottomNavItem
        to="/admin"
        icon={<LayoutDashboard size={22} />}
        label="Dashboard"
        active={isActive("/admin")}
      />

      {isEnabled("mobile", "photos") && hasPermission("read:photos") && (
        <BottomNavItem
          to="/admin/photos"
          icon={<ImageIcon size={22} />}
          label="Photos"
          active={isActive("/admin/photos")}
        />
      )}

      {isEnabled("mobile", "odoo") && hasPermission("use:ai") && (
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

      {((isEnabled("mobile", "users") && hasPermission("read:users")) ||
        (isEnabled("mobile", "roles") && hasPermission("read:roles")) ||
        (isEnabled("mobile", "permissions") && hasPermission("read:roles")) ||
        (isEnabled("mobile", "tenants") &&
          (hasPermission("read:tenants") || hasPermission("manage:tenants")))) && (
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
            <Text fontSize="2xs" letterSpacing="tight">More</Text>
          </Flex>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="220px" mb="2">
              <Box p="4">
                <Heading size="xs" mb="2" color="fg.muted">More options</Heading>
                <VStack align="stretch" spaceY="1">
                  <Link to="/" style={{ textDecoration: "none" }}>
                    <Button variant="ghost" justifyContent="flex-start" width="full" size="sm">
                      <ImageIcon size={18} style={{ marginRight: "8px" }} />
                      Public Photos
                    </Button>
                  </Link>
                  <a href="/api/docs" style={{ textDecoration: "none" }}>
                    <Button variant="ghost" justifyContent="flex-start" width="full" size="sm">
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
  );
};

export default BottomNav;
