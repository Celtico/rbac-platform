import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.ts";
import { useNavConfig } from "../../context/NavConfigContext.ts";
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  ShieldCheck,
  Lock,
  Settings,
  Braces,
  SquareLibrary,
  ChevronDown,
  ChevronUp,
  Palette,
  Rocket,
  SlidersHorizontal,
  Building2,
  Boxes,
  MessageSquare,
  ScrollText,
  Monitor,
  Server,
  BarChart2,
  Database,
} from "lucide-react";
import { Box, Button, Collapsible, HStack, Text, VStack } from "@chakra-ui/react";
import { useTheme } from "../../context/ThemeContext";

const SidebarNav: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
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

  const [isToolsOpen, setIsToolsOpen] = React.useState(
    location.pathname.startsWith("/admin/photos") ||
      location.pathname.startsWith("/admin/chat")
  );
  const [isAdminOpen, setIsAdminOpen] = React.useState(
    location.pathname.startsWith("/admin/users") ||
      location.pathname.startsWith("/admin/roles") ||
      location.pathname.startsWith("/admin/permissions") ||
      location.pathname.startsWith("/admin/tenants")
  );
  const [isSystemOpen, setIsSystemOpen] = React.useState(
    location.pathname.startsWith("/admin/logs") ||
      location.pathname.startsWith("/admin/settings/deploy")
  );
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(
    location.pathname.startsWith("/admin/settings/styles") ||
      location.pathname.startsWith("/admin/settings/sidebar") ||
      location.pathname.startsWith("/admin/settings/devices")
  );
  const [isPublicOpen, setIsPublicOpen] = React.useState(false);

  const size = isMobile ? "sm" : "md";

  const sectionLabelColor = mode === "light" ? "gray.400" : "gray.500";

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <Text
        fontSize="10px"
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="wider"
        color={sectionLabelColor}
        px="3"
        pt="3"
        pb="1"
      >
        {children}
      </Text>
    );
  }

  function NavLink({
    to,
    icon,
    label,
    active,
  }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
  }) {
    return (
      <Link to={to} style={{ textDecoration: "none" }}>
        <Button
          variant={active ? "subtle" : "ghost"}
          colorPalette={active ? "purple" : undefined}
          justifyContent="flex-start"
          width="full"
          size="sm"
        >
          <Box mr="2" display="flex" alignItems="center">{icon}</Box>
          {label}
        </Button>
      </Link>
    );
  }

  function CollapsibleSection({
    label,
    icon,
    open,
    onToggle,
    active,
    children,
  }: {
    label: string;
    icon: React.ReactNode;
    open: boolean;
    onToggle: (v: boolean) => void;
    active: boolean;
    children: React.ReactNode;
  }) {
    return (
      <Collapsible.Root open={open} onOpenChange={(e) => onToggle(e.open)}>
        <Collapsible.Trigger asChild>
          <Button
            variant={active ? "subtle" : "ghost"}
            colorPalette={active ? "purple" : undefined}
            justifyContent="space-between"
            width="full"
            size={size}
          >
            <HStack gap="2">
              {icon}
              <span>{label}</span>
            </HStack>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <VStack align="stretch" spaceY="0.5" pl="4" mt="1">
            {children}
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  // Visibility checks
  const hasTools =
    (isEnabled("sidebar", "chat") && hasPermission("use:chat")) ||
    (isEnabled("sidebar", "photos") && hasPermission("read:photos")) ||
    (isEnabled("sidebar", "odoo") && hasPermission("use:ai"));

  const hasAdmin =
    (isEnabled("sidebar", "users") && hasPermission("read:users")) ||
    (isEnabled("sidebar", "roles") && hasPermission("read:roles")) ||
    (isEnabled("sidebar", "permissions") && hasPermission("read:roles")) ||
    (isEnabled("sidebar", "tenants") &&
      (hasPermission("read:tenants") || hasPermission("manage:tenants")));

  const hasSystem =
    (isEnabled("sidebar", "logs") && hasPermission("read:logsystem")) ||
    (isEnabled("sidebar", "server-stats") && hasPermission("read:logsystem")) ||
    (isEnabled("sidebar", "settings-deploy") && hasPermission("manage:deploy"));

  return (
    <VStack p={isMobile ? "0" : "3"} align="stretch" gap="0.5">
      {/* Dashboard */}
      <Link to="/admin" style={{ textDecoration: "none" }}>
        <Button
          variant={isActive("/admin") ? "subtle" : "ghost"}
          colorPalette={isActive("/admin") ? "purple" : undefined}
          justifyContent="flex-start"
          width="full"
          size={size}
        >
          <LayoutDashboard size={18} style={{ marginRight: "8px" }} />
          Dashboard
        </Button>
      </Link>

      {/* Eines */}
      {hasTools && (
        <>
          <SectionLabel>Eines</SectionLabel>
          <CollapsibleSection
            label="Mòduls"
            icon={<Boxes size={18} />}
            open={isToolsOpen}
            onToggle={setIsToolsOpen}
            active={
              isActive("/admin/photos") ||
              isActive("/admin/chat") ||
              isActive("/admin/odoo")
            }
          >
            {isEnabled("sidebar", "chat") && hasPermission("use:chat") && (
              <NavLink to="/admin/chat" icon={<MessageSquare size={16} />} label="Chat Global" active={isActive("/admin/chat")} />
            )}
            {isEnabled("sidebar", "photos") && hasPermission("read:photos") && (
              <NavLink to="/admin/photos" icon={<ImageIcon size={16} />} label="Fotos" active={isActive("/admin/photos")} />
            )}
            {isEnabled("sidebar", "odoo") && hasPermission("use:ai") && (
              <NavLink to="/admin/odoo" icon={<Database size={16} />} label="Gestor Odoo" active={isActive("/admin/odoo")} />
            )}
          </CollapsibleSection>
        </>
      )}

      {/* Administració */}
      {hasAdmin && (
        <>
          <SectionLabel>Administració</SectionLabel>
          <CollapsibleSection
            label="Gestió d'Accés"
            icon={<ShieldCheck size={18} />}
            open={isAdminOpen}
            onToggle={setIsAdminOpen}
            active={
              isActive("/admin/users") ||
              isActive("/admin/roles") ||
              isActive("/admin/permissions") ||
              isActive("/admin/tenants")
            }
          >
            {isEnabled("sidebar", "users") && hasPermission("read:users") && (
              <NavLink to="/admin/users" icon={<Users size={16} />} label="Usuaris" active={isActive("/admin/users")} />
            )}
            {isEnabled("sidebar", "roles") && hasPermission("read:roles") && (
              <NavLink to="/admin/roles" icon={<ShieldCheck size={16} />} label="Rols" active={isActive("/admin/roles")} />
            )}
            {isEnabled("sidebar", "permissions") && hasPermission("read:roles") && (
              <NavLink to="/admin/permissions" icon={<Lock size={16} />} label="Permisos" active={isActive("/admin/permissions")} />
            )}
            {isEnabled("sidebar", "tenants") &&
              (hasPermission("read:tenants") || hasPermission("manage:tenants")) && (
                <NavLink to="/admin/tenants" icon={<Building2 size={16} />} label="Tenants" active={isActive("/admin/tenants")} />
              )}
          </CollapsibleSection>
        </>
      )}

      {/* Sistema */}
      {hasSystem && (
        <>
          <SectionLabel>Sistema</SectionLabel>
          <CollapsibleSection
            label="Operacions"
            icon={<Server size={18} />}
            open={isSystemOpen}
            onToggle={setIsSystemOpen}
            active={
              isActive("/admin/logs") ||
              isActive("/admin/system/stats") ||
              isActive("/admin/settings/deploy")
            }
          >
            {isEnabled("sidebar", "logs") && hasPermission("read:logsystem") && (
              <NavLink to="/admin/logs" icon={<ScrollText size={16} />} label="Registre del Sistema" active={isActive("/admin/logs")} />
            )}
            {isEnabled("sidebar", "server-stats") && hasPermission("read:logsystem") && (
              <NavLink to="/admin/system/stats" icon={<BarChart2 size={16} />} label="Consum del Servidor" active={isActive("/admin/system/stats")} />
            )}
            {isEnabled("sidebar", "settings-deploy") && hasPermission("manage:deploy") && (
              <NavLink to="/admin/settings/deploy" icon={<Rocket size={16} />} label="Desplegament" active={isActive("/admin/settings/deploy")} />
            )}
          </CollapsibleSection>
        </>
      )}

      {/* Configuració */}
      <>
        <SectionLabel>Configuració</SectionLabel>
        <CollapsibleSection
          label="Preferències"
          icon={<Settings size={18} />}
          open={isSettingsOpen}
          onToggle={setIsSettingsOpen}
          active={
            isActive("/admin/settings/styles") ||
            isActive("/admin/settings/sidebar") ||
            isActive("/admin/settings/devices")
          }
        >
          {isEnabled("sidebar", "settings-styles") && (
            <NavLink to="/admin/settings/styles" icon={<Palette size={16} />} label="Estils i Temes" active={isActive("/admin/settings/styles")} />
          )}
          <NavLink to="/admin/settings/devices" icon={<Monitor size={16} />} label="Dispositius" active={isActive("/admin/settings/devices")} />
          <NavLink to="/admin/settings/sidebar" icon={<SlidersHorizontal size={16} />} label="Personalitzar Sidebar" active={isActive("/admin/settings/sidebar")} />
        </CollapsibleSection>
      </>

      {/* Accés Públic */}
      <>
        <SectionLabel>Accés Públic</SectionLabel>
        <CollapsibleSection
          label="Recursos externs"
          icon={<SquareLibrary size={18} />}
          open={isPublicOpen}
          onToggle={setIsPublicOpen}
          active={false}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            <Button variant="ghost" justifyContent="flex-start" width="full" size="sm">
              <ImageIcon size={16} style={{ marginRight: "8px" }} />
              Web Pública
            </Button>
          </Link>
          <a href="/api/docs" style={{ textDecoration: "none" }}>
            <Button variant="ghost" justifyContent="flex-start" width="full" size="sm">
              <Braces size={16} style={{ marginRight: "8px" }} />
              Swagger API
            </Button>
          </a>
        </CollapsibleSection>
      </>
    </VStack>
  );
};

export default SidebarNav;
