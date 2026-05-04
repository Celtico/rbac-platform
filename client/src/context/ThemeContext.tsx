import React, { useState, useEffect } from "react";
import { useColorMode } from "../components/ui/color-mode";
import { ThemeContext } from "./ThemeContext";
import type { ColorTheme, RadiusSize, FontFamily, FontSize } from "./ThemeContext";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const [theme, setThemeState] = useState<ColorTheme>(
    (localStorage.getItem("app-theme") as ColorTheme) || "sky"
  );
  const [radius, setRadiusState] = useState<RadiusSize>(
    (localStorage.getItem("app-radius") as RadiusSize) || "full"
  );
  const [font, setFontState] = useState<FontFamily>(
    (localStorage.getItem("app-font") as FontFamily) || "system"
  );
  const [fontSize, setFontSizeState] = useState<FontSize>(
    (localStorage.getItem("app-font-size") as FontSize) || "md"
  );

  const fontSizePxMap: Record<FontSize, string> = {
    xs: "13px", sm: "14px", md: "16px", lg: "18px", xl: "20px",
  };

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

  useEffect(() => {
    localStorage.setItem("app-font-size", fontSize);
    document.documentElement.style.fontSize = fontSizePxMap[fontSize];
  }, [fontSize]);

  const setTheme = (newTheme: ColorTheme) => setThemeState(newTheme);
  const setRadius = (newRadius: RadiusSize) => setRadiusState(newRadius);
  const setFont = (newFont: FontFamily) => setFontState(newFont);
  const setFontSize = (newSize: FontSize) => setFontSizeState(newSize);

  return (
    <ThemeContext.Provider
      value={{
        mode: colorMode as "light" | "dark",
        theme,
        radius,
        font,
        fontSize,
        toggleMode: toggleColorMode,
        setTheme,
        setRadius,
        setFont,
        setFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
