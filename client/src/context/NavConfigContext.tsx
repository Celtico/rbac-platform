import React, { useState } from "react";
import {
  ImageIcon,
  Users,
  ShieldCheck,
  Lock,
  Palette,
  Rocket,
  Building2,
  MessageSquare,
  ScrollText,
  Monitor,
  BarChart2,
  Database,
} from "lucide-react";
import {
  NavConfigContext,
  type NavItemDef,
  type NavSection,
} from "./NavConfigContext";

const KEYS: Record<NavSection, string> = {
  sidebar: "app-nav-sidebar",
  dashboard: "app-nav-dashboard",
  mobile: "app-nav-mobile",
};

/** Master list — defines every configurable nav item once. */
export const NAV_ITEMS: NavItemDef[] = [
  {
    id: "chat",
    label: "Chat Global",
    path: "/admin/chat",
    icon: MessageSquare,
    color: "green.500",
    permission: "use:chat",
  },
  {
    id: "odoo",
    label: "Gestor Odoo",
    path: "/admin/odoo",
    icon: Database,
    color: "orange.500",
    permission: "use:ai",
  },
  {
    id: "photos",
    label: "Fotos",
    path: "/admin/photos",
    icon: ImageIcon,
    color: "blue.500",
    permission: "read:photos",
  },
  {
    id: "users",
    label: "Usuaris",
    path: "/admin/users",
    icon: Users,
    color: "teal.500",
    permission: "read:users",
  },
  {
    id: "roles",
    label: "Rols",
    path: "/admin/roles",
    icon: ShieldCheck,
    color: "orange.500",
    permission: "read:roles",
  },
  {
    id: "permissions",
    label: "Permisos",
    path: "/admin/permissions",
    icon: Lock,
    color: "yellow.500",
    permission: "read:roles",
  },
  {
    id: "tenants",
    label: "Tenants",
    path: "/admin/tenants",
    icon: Building2,
    color: "cyan.500",
    permission: "read:tenants",
  },
  {
    id: "settings-styles",
    label: "Estils i Temes",
    path: "/admin/settings/styles",
    icon: Palette,
    color: "pink.500",
  },
  {
    id: "settings-deploy",
    label: "Desplegament",
    path: "/admin/settings/deploy",
    icon: Rocket,
    color: "red.500",
    permission: "manage:deploy",
  },
  {
    id: "logs",
    label: "Registre del Sistema",
    path: "/admin/logs",
    icon: ScrollText,
    color: "orange.500",
    permission: "read:logsystem",
  },
  {
    id: "server-stats",
    label: "Consum del Servidor",
    path: "/admin/system/stats",
    icon: BarChart2,
    color: "purple.500",
    permission: "read:logsystem",
  },
  {
    id: "devices",
    label: "Dispositius",
    path: "/admin/settings/devices",
    icon: Monitor,
    color: "gray.500",
  },
];

const defaultEnabled = (): Record<string, boolean> =>
  Object.fromEntries(NAV_ITEMS.map((item) => [item.id, true]));

const load = (key: string): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultEnabled();
    const saved: Record<string, boolean> = JSON.parse(raw);
    return Object.fromEntries(
      NAV_ITEMS.map((item) => [
        item.id,
        saved[item.id] !== undefined ? saved[item.id] : true,
      ])
    );
  } catch {
    return defaultEnabled();
  }
};

export const NavConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [enabledSidebar, setEnabledSidebar] = useState<Record<string, boolean>>(
    () => load(KEYS.sidebar)
  );
  const [enabledDashboard, setEnabledDashboard] = useState<
    Record<string, boolean>
  >(() => load(KEYS.dashboard));
  const [enabledMobile, setEnabledMobile] = useState<Record<string, boolean>>(
    () => load(KEYS.mobile)
  );

  const setters: Record<
    NavSection,
    React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  > = {
    sidebar: setEnabledSidebar,
    dashboard: setEnabledDashboard,
    mobile: setEnabledMobile,
  };

  const maps: Record<NavSection, Record<string, boolean>> = {
    sidebar: enabledSidebar,
    dashboard: enabledDashboard,
    mobile: enabledMobile,
  };

  const toggle = (section: NavSection, id: string) => {
    setters[section]((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(KEYS[section], JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    const def = defaultEnabled();
    (Object.keys(KEYS) as NavSection[]).forEach((section) => {
      localStorage.setItem(KEYS[section], JSON.stringify(def));
      setters[section](def);
    });
  };

  return (
    <NavConfigContext.Provider
      value={{
        items: NAV_ITEMS,
        enabledSidebar,
        enabledDashboard,
        enabledMobile,
        isEnabled: (section, id) => maps[section][id] ?? true,
        toggle,
        reset,
      }}
    >
      {children}
    </NavConfigContext.Provider>
  );
};
