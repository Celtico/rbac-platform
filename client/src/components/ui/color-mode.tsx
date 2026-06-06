/* eslint-disable react-refresh/only-export-components */
"use client";
import { useTheme } from "next-themes";
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
  return {
    colorMode: resolvedTheme ?? "light",
    setColorMode: setTheme,
    toggleColorMode,
  };
}
