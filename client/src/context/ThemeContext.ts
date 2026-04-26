import { createContext, useContext } from "react";

export type ColorTheme = "default" | "ocean" | "forest" | "sunset";
export type RadiusSize = "none" | "sm" | "md" | "lg" | "xl" | "full";

export interface ThemeContextType {
  mode: "light" | "dark";
  theme: ColorTheme;
  radius: RadiusSize;
  toggleMode: () => void;
  setTheme: (theme: ColorTheme) => void;
  setRadius: (radius: RadiusSize) => void;
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
