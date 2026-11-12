"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  actualTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  actualTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "sarkari_saathi_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        // Default to light as requested
        setThemeState("light");
        applyTheme("light");
      }
    } catch {
      applyTheme("light");
    }
  }, []);

  // Listen for system theme changes if theme is "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setActualTheme(resolved);
      updateDom(resolved);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const updateDom = (resolved: "light" | "dark") => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const applyTheme = (newTheme: Theme) => {
    let resolved: "light" | "dark" = "light";
    if (newTheme === "system") {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        resolved = "dark";
      } else {
        resolved = "light";
      }
    } else {
      resolved = newTheme;
    }
    setActualTheme(resolved);
    updateDom(resolved);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Could not save theme preference to localStorage:", e);
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = actualTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({
  className = "",
  showLabel = false,
  language = "hi",
}: {
  className?: string;
  showLabel?: boolean;
  language?: "hi" | "en";
}) {
  const { actualTheme, toggleTheme } = useTheme();
  const isDark = actualTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={
        isDark
          ? language === "en"
            ? "Switch to Light Mode"
            : "लाइट मोड में बदलें"
          : language === "en"
          ? "Switch to Dark Mode"
          : "डार्क मोड में बदलें"
      }
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 active:scale-95 shadow-sm border ${
        isDark
          ? "bg-[#172438] hover:bg-[#1D2D43] text-[#F59E0B] border-[#2B3A50]"
          : "bg-blue-50 hover:bg-blue-100 text-[#0645A8] border-blue-200"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-[#F59E0B]" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-[#0645A8]" />
        )}
      </div>
      {showLabel && (
        <span className="ml-1.5 text-xs font-bold">
          {isDark
            ? language === "en"
              ? "Light Mode"
              : "लाइट मोड"
            : language === "en"
            ? "Dark Mode"
            : "डार्क मोड"}
        </span>
      )}
    </button>
  );
}

export function ThemeSelectorPill({
  language = "hi",
}: {
  language?: "hi" | "en";
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111C2E] rounded-2xl border border-slate-200 dark:border-[#2B3A50] text-xs font-bold">
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
          theme === "light"
            ? "bg-white dark:bg-[#172438] text-[#0645A8] dark:text-[#60A5FA] shadow-xs"
            : "text-slate-500 dark:text-[#AAB8CC] hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span>{language === "en" ? "Light" : "लाइट"}</span>
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
          theme === "dark"
            ? "bg-white dark:bg-[#172438] text-[#0645A8] dark:text-[#60A5FA] shadow-xs"
            : "text-slate-500 dark:text-[#AAB8CC] hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-[#60A5FA]" />
        <span>{language === "en" ? "Dark" : "डार्क"}</span>
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
          theme === "system"
            ? "bg-white dark:bg-[#172438] text-[#0645A8] dark:text-[#60A5FA] shadow-xs"
            : "text-slate-500 dark:text-[#AAB8CC] hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
        <span>{language === "en" ? "System" : "सिस्टम"}</span>
      </button>
    </div>
  );
}

