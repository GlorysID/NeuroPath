"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light"
});

export function ThemeProvider({ children, attribute = "data-theme", defaultTheme = "system" }) {
  const [theme, setThemeState] = useState(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") || defaultTheme;
    setThemeState(storedTheme);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const applyTheme = (currentTheme) => {
      let activeTheme = currentTheme;
      if (currentTheme === "system") {
        activeTheme = mediaQuery.matches ? "dark" : "light";
      }
      setResolvedTheme(activeTheme);
      document.documentElement.setAttribute(attribute, activeTheme);
    };

    applyTheme(theme);
    if (theme !== "system" || localStorage.getItem("theme")) {
      localStorage.setItem("theme", theme);
    }

    const listener = () => applyTheme(theme);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme, mounted, attribute]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
