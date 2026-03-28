import React, { createContext, useContext, useState, useEffect } from "react";

export type ColorTheme = "default" | "ocean" | "forest" | "sunset";
export type RadiusSize = "none" | "sm" | "md" | "lg" | "xl" | "full";
type Mode = "light" | "dark";

interface ThemeContextType {
  mode: Mode;
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
  const [mode, setMode] = useState<Mode>(() => {
    const savedMode = localStorage.getItem("theme-mode");
    if (savedMode === "dark" || savedMode === "light") return savedMode;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [theme, setThemeState] = useState<ColorTheme>(() => {
    return (localStorage.getItem("theme-color") as ColorTheme) || "default";
  });

  const [radius, setRadiusState] = useState<RadiusSize>(() => {
    return (localStorage.getItem("theme-radius") as RadiusSize) || "md";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Manage Dark Mode
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme-mode", mode);

    // Manage Color Theme
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme-color", theme);

    // Manage Radius
    root.setAttribute("data-radius", radius);
    localStorage.setItem("theme-radius", radius);
  }, [mode, theme, radius]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: ColorTheme) => setThemeState(newTheme);
  const setRadius = (newRadius: RadiusSize) => setRadiusState(newRadius);

  return (
    <ThemeContext.Provider
      value={{ mode, theme, radius, toggleMode, setTheme, setRadius }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
