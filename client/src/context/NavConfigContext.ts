import { createContext, useContext } from "react";
import type { LucideIcon } from "lucide-react";

export interface NavItemDef {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  color: string;      // Chakra color token for dashboard card border
  permission?: string;
  role?: string;
}

export type NavSection = "sidebar" | "dashboard" | "mobile";

export interface NavConfigContextType {
  items: NavItemDef[];
  enabledSidebar: Record<string, boolean>;
  enabledDashboard: Record<string, boolean>;
  enabledMobile: Record<string, boolean>;
  isEnabled: (section: NavSection, id: string) => boolean;
  toggle: (section: NavSection, id: string) => void;
  reset: () => void;
}

export const NavConfigContext = createContext<NavConfigContextType | undefined>(
  undefined
);

export const useNavConfig = () => {
  const ctx = useContext(NavConfigContext);
  if (!ctx) throw new Error("useNavConfig must be used within NavConfigProvider");
  return ctx;
};
