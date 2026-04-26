import React, { useState, useEffect } from "react";
import { useColorMode } from "../components/ui/color-mode";
import { ThemeContext } from "./ThemeContext";
import type { ColorTheme, RadiusSize } from "./ThemeContext";

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
