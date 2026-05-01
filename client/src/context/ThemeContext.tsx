import React, { useState, useEffect } from "react";
import { useColorMode } from "../components/ui/color-mode";
import { ThemeContext } from "./ThemeContext";
import type { ColorTheme, RadiusSize, FontFamily } from "./ThemeContext";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const [theme, setThemeState] = useState<ColorTheme>(
    (localStorage.getItem("app-theme") as ColorTheme) || "default"
  );
  const [radius, setRadiusState] = useState<RadiusSize>(
    (localStorage.getItem("app-radius") as RadiusSize) || "full"
  );
  const [font, setFontState] = useState<FontFamily>(
    (localStorage.getItem("app-font") as FontFamily) || "system"
  );

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app-radius", radius);
    document.documentElement.setAttribute("data-radius", radius);
  }, [radius]);

  useEffect(() => {
    localStorage.setItem("app-font", font);
    document.documentElement.setAttribute("data-font", font);
  }, [font]);

  const setTheme = (newTheme: ColorTheme) => setThemeState(newTheme);
  const setRadius = (newRadius: RadiusSize) => setRadiusState(newRadius);
  const setFont = (newFont: FontFamily) => setFontState(newFont);

  return (
    <ThemeContext.Provider
      value={{
        mode: colorMode as "light" | "dark",
        theme,
        radius,
        font,
        toggleMode: toggleColorMode,
        setTheme,
        setRadius,
        setFont,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
