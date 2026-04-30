import { createContext, useContext } from "react";

export type ColorTheme =
  | "default"
  | "sky"
  | "ocean"
  | "forest"
  | "sunset"
  | "violet"
  | "amber"
  | "coral"
  | "crimson"
  | "midnight";
export type RadiusSize = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type FontFamily = "system" | "inter" | "nunito" | "poppins" | "lato" | "playfair" | "mono";

export interface ThemeContextType {
  mode: "light" | "dark";
  theme: ColorTheme;
  radius: RadiusSize;
  font: FontFamily;
  toggleMode: () => void;
  setTheme: (theme: ColorTheme) => void;
  setRadius: (radius: RadiusSize) => void;
  setFont: (font: FontFamily) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
