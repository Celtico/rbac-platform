import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorMode } from "../components/ui/color-mode";

export type ColorTheme = "default" | "ocean" | "forest" | "sunset";
export type RadiusSize = "none" | "sm" | "md" | "lg" | "xl" | "full";

interface ThemeContextType {
  mode: "light" | "dark";
  theme: ColorTheme;
  radius: RadiusSize;
  toggleMode: () => void;
  setTheme: (theme: ColorTheme) => void;
  setRadius: (radius: RadiusSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const [theme, setThemeState] = useState<ColorTheme>(
    (localStorage.getItem("app-theme") as ColorTheme) || "default"
  );
  const [radius, setRadiusState] = useState<RadiusSize>(
    (localStorage.getItem("app-radius") as RadiusSize) || "md"
  );

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app-radius", radius);
    document.documentElement.setAttribute("data-radius", radius);
  }, [radius]);

  const setTheme = (newTheme: ColorTheme) => setThemeState(newTheme);
  const setRadius = (newRadius: RadiusSize) => setRadiusState(newRadius);

  return (
    <ThemeContext.Provider
      value={{
        mode: colorMode as "light" | "dark",
        theme,
        radius,
        toggleMode: toggleColorMode,
        setTheme,
        setRadius,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
