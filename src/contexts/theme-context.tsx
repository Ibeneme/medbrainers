"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  DEFAULT_PRIMARY_COLOR,
  setLivePrimaryColor,
  PRIMARY_DEEP,
  PRIMARY_HOVER,
  PRIMARY_LIGHT,
  PRIMARY_TINT,
} from "@/constants/colors";

type Theme = "dark" | "light";

export interface ThemeColors {
  bg: string;
  shadeBg: string;
  text: string;
  invertedText?: string;
  primary: string;
  primaryShade: string;
  navy: string;
  shadeBgSecond: string;
  darkBlue?: string;
  border: string;
}

// Pass the click event (or any {clientX, clientY}) so the reveal starts at the button
type ToggleOrigin = { clientX: number; clientY: number };

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (origin?: ToggleOrigin) => void;
  colors: ThemeColors;
  /** Current primary / active accent color (single source of truth) */
  primaryColor: string;
  /**
   * Update the global primary color.
   * This also updates: the PRIMARY_COLOR constant, the --brand-primary CSS var,
   * the cookie, and the sidebar active color. Pass null to reset to default.
   */
  setPrimaryColor: (color: string | null) => void;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const THEME_COOKIE = "medbrainers-theme";
const PRIMARY_COOKIE = "medbrainers-primary-color";

// ─── Cookie helpers ───────────────────────────────────────────
const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax${secure}`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};
// ─────────────────────────────────────────────────────────────

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  const saved = getCookie(THEME_COOKIE);
  if (saved === "dark" || saved === "light") return saved;
  return null;
}

function getStoredPrimary(): string | null {
  const saved = getCookie(PRIMARY_COOKIE);
  if (saved && HEX_RE.test(saved)) return saved;
  return null;
}

function applyTheme(newTheme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(newTheme);
  root.setAttribute("data-theme", newTheme);
}

function buildColors(theme: Theme, primary: string): ThemeColors {
  const isDefault =
    primary.toLowerCase() === DEFAULT_PRIMARY_COLOR.toLowerCase();

  if (theme === "dark") {
    return {
      bg: "#000000",
      shadeBg: "#121212",
      shadeBgSecond: "#000000",
      text: "#ffffff",
      invertedText: "#000000",
      primary,
      primaryShade: isDefault ? PRIMARY_LIGHT : primary,
      navy: isDefault ? PRIMARY_DEEP : primary,
      darkBlue: isDefault ? PRIMARY_DEEP : primary,
      border: "#ffffff12",
    };
  }

  return {
    bg: "#ffffff",
    shadeBg: "#ffffff",
    shadeBgSecond: "#f4f4f4",
    text: "#111111",
    invertedText: "#ffffff",
    primary,
    primaryShade: isDefault ? DEFAULT_PRIMARY_COLOR : primary,
    navy: isDefault ? PRIMARY_HOVER : primary,
    darkBlue: isDefault ? PRIMARY_TINT : primary,
    border: "#66666635",
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [primaryColor, setPrimaryColorState] = useState<string>(
    DEFAULT_PRIMARY_COLOR
  );

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? getSystemTheme();
    const initialPrimary = getStoredPrimary() ?? DEFAULT_PRIMARY_COLOR;

    setTheme(initialTheme);

    // Sync the live PRIMARY_COLOR constant + --brand-primary CSS var
    setLivePrimaryColor(initialPrimary);
    setPrimaryColorState(initialPrimary);

    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setPrimaryColor = (color: string | null) => {
    const next = color && HEX_RE.test(color) ? color : DEFAULT_PRIMARY_COLOR;

    // Update the constant + CSS var BEFORE the re-render so every
    // consumer of PRIMARY_COLOR reads the new value.
    setLivePrimaryColor(next);
    setPrimaryColorState(next);

    try {
      if (next.toLowerCase() === DEFAULT_PRIMARY_COLOR.toLowerCase()) {
        deleteCookie(PRIMARY_COOKIE);
      } else {
        setCookie(PRIMARY_COOKIE, next);
      }
    } catch {}
  };

  const toggleTheme = (origin?: ToggleOrigin) => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    const commit = () => {
      setTheme(nextTheme);
      setCookie(THEME_COOKIE, nextTheme);
      applyTheme(nextTheme);
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!("startViewTransition" in document) || reduceMotion) {
      commit();
      return;
    }

    const x = origin?.clientX ?? window.innerWidth / 2;
    const y = origin?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(commit);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const colors = buildColors(theme, primaryColor);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colors,
        primaryColor,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
