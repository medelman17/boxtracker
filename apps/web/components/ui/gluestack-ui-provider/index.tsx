"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ColorMode = "light" | "dark" | "system";

type GluestackUIContextType = {
  colorMode: "light" | "dark";
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
};

const GluestackUIContext = createContext<GluestackUIContextType>({
  colorMode: "light",
  setColorMode: () => {},
  toggleColorMode: () => {},
});

export const useGluestackUI = () => useContext(GluestackUIContext);

type GluestackUIProviderProps = {
  mode?: ColorMode;
  children: React.ReactNode;
};

/**
 * GluestackUIProvider for Next.js web app
 *
 * Provides color mode context and wraps children with OverlayProvider for modals/toasts.
 * Uses CSS custom properties for theming (defined in globals.css).
 */
export function GluestackUIProvider({
  mode: initialMode = "system",
  children,
}: GluestackUIProviderProps) {
  const [mode, setMode] = useState<ColorMode>(initialMode);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Get system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedMode = () => {
      if (mode === "system") {
        setResolvedMode(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedMode(mode);
      }
    };

    updateResolvedMode();

    // Listen for system theme changes
    const handler = () => {
      if (mode === "system") {
        setResolvedMode(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  // Update document class for Tailwind dark mode
  useEffect(() => {
    if (resolvedMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedMode]);

  const toggleColorMode = () => {
    setMode((current) => {
      if (current === "light") return "dark";
      if (current === "dark") return "light";
      // If system, toggle to opposite of current resolved
      return resolvedMode === "light" ? "dark" : "light";
    });
  };

  return (
    <GluestackUIContext.Provider
      value={{ colorMode: resolvedMode, setColorMode: setMode, toggleColorMode }}
    >
      {children}
    </GluestackUIContext.Provider>
  );
}
