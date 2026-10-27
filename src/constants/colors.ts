import type { CSSProperties } from "react";

/**
 * SINGLE SOURCE OF TRUTH for the brand's primary color.
 * Change the hex below and the whole site updates.
 *
 * - In TS/TSX: import { PRIMARY_COLOR } from "@/constants/colors".
 * - In Tailwind classes: use bg-primary, text-primary, border-primary,
 *   hover:bg-primary-hover, bg-primary/20 ... (they read the CSS variable
 *   below, which is set from this constant in the root layout).
 */
export const PRIMARY_COLOR = "#29AB29";
export const SECONDARY_COLOR = "#a3e635";
export const OTHER_COLOR = "#F4F4F4";

/**
 * Feeds this constant into CSS (`--brand-primary`, used by app/theme.css to
 * build the Tailwind `primary` tokens and their hover / light / deep shades).
 * Applied once on <html> in app/[lang]/layout.tsx.
 */
export const PRIMARY_CSS_VARS = {
  "--brand-primary": PRIMARY_COLOR,
} as CSSProperties;

export type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

/**
 * Helper function to generate UI color tokens dynamically based on the current theme.
 * Call this inside components using `const ui = getUI(isDark, colors, border);`
 */
export const getUI = (isDark: boolean, colors: any, border?: string): UI => ({
  isDark,
  page: colors.bg,
  card: colors.shadeBg,
  inner: colors.shadeBgSecond,
  text: colors.text,
  border: border ?? colors?.border ?? (isDark ? colors?.text + 12 : colors?.text + 45),
});

/**
 * Shades of PRIMARY_COLOR for TS/TSX (SVG fills, inline styles, data objects).
 * They resolve through the CSS variables in app/theme.css, which are all
 * derived from PRIMARY_COLOR above — so there is nothing else to edit.
 */
export const PRIMARY_HOVER = "var(--color-primary-hover)"; // slightly darker
export const PRIMARY_LIGHT = "var(--color-primary-light)"; // lighter
export const PRIMARY_TINT = "var(--color-primary-tint)"; // pale tint
export const PRIMARY_DEEP = "var(--color-primary-deep)"; // very dark tint
export const PRIMARY_DEEP_HOVER = "var(--color-primary-deep-hover)";