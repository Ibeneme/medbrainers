"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { PRIMARY_COLOR, PRIMARY_DEEP, PRIMARY_HOVER, PRIMARY_LIGHT, PRIMARY_TINT } from "@/constants/colors";

type Theme = "dark" | "light";

interface ThemeColors {
  bg: string;
  shadeBg: string;
  text: string;
  invertedText?: string;
  primary: string;
  primaryShade: string;
  navy: string;
  shadeBgSecond?: string;
  darkBlue?: string;
}

// Pass the click event (or any {clientX, clientY}) so the reveal starts at the button
type ToggleOrigin = { clientX: number; clientY: number };

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (origin?: ToggleOrigin) => void;
  colors: ThemeColors;
}

const darkColors: ThemeColors = {
  bg: "#000000",
  shadeBg: "#121212",
  shadeBgSecond: "#000000",
  text: "#ffffff",
  invertedText: "#000000",
  primary: PRIMARY_COLOR,
  primaryShade: PRIMARY_LIGHT,
  navy: PRIMARY_DEEP,
  darkBlue: PRIMARY_DEEP,
  border: '#ffffff12'
};


const lightColors: ThemeColors = {
  bg: "#ffffff",
  shadeBg: "#ffffff",
  shadeBgSecond: "#f4f4f4",
  text: "#111111",
  invertedText: "#ffffff",
  primary: PRIMARY_COLOR,
  primaryShade: PRIMARY_COLOR,
  navy: PRIMARY_HOVER,
  darkBlue: PRIMARY_TINT,
  border: '#66666635'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "medbrainers-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return null;
}

function applyTheme(newTheme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(newTheme);
  root.setAttribute("data-theme", newTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? getSystemTheme();
    setTheme(initialTheme);
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

  const toggleTheme = (origin?: ToggleOrigin) => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    const commit = () => {
      setTheme(nextTheme);
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {}
      applyTheme(nextTheme);
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // No support or reduced motion: switch instantly
    if (!("startViewTransition" in document) || reduceMotion) {
      commit();
      return;
    }

    // Start the circle at the click point (or screen centre as a fallback)
    const x = origin?.clientX ?? window.innerWidth / 2;
    const y = origin?.clientY ?? window.innerHeight / 2;
    // Radius to the farthest corner so the circle always covers the screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      // flushSync makes React update the DOM before the "after" snapshot is taken
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
          easing: "cubic-bezier(0.22, 1, 0.36, 1)", // fast start, soft landing
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
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
