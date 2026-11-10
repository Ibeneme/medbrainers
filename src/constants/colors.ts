import type { CSSProperties } from "react";

/**
 * FACTORY DEFAULT brand primary color.
 * Never changes. Used as the fallback / reset value, and as the ONLY primary
 * color shown on landing pages and authentication pages.
 */
export const DEFAULT_PRIMARY_COLOR = "#29AB29";

/**
 * The colour the user picked (sidebar picker, settings, etc).
 * It is remembered here, but only ever *displayed* inside /dashboard.
 */
let userPrimaryColor: string = DEFAULT_PRIMARY_COLOR;

/**
 * LIVE brand primary color (ES module live binding).
 *
 *  - /dashboard/**           -> the user's custom colour (or the default)
 *  - everything else         -> ALWAYS DEFAULT_PRIMARY_COLOR
 *    (landing pages, navbar pages, login / register / forgot-password, ...)
 */
export let PRIMARY_COLOR: string = DEFAULT_PRIMARY_COLOR;

// ─── Route rules ─────────────────────────────────────────────
// Optional 2-letter locale prefix (/en, /fr) then "dashboard".
const DASHBOARD_RE = /^\/(?:[a-z]{2}\/)?dashboard(?:\/|$)/i;

export const isDashboardRoute = (pathname?: string | null): boolean =>
  DASHBOARD_RE.test(pathname || "");

/** Landing + auth pages = every route that is not under /dashboard. */
export const isStaticBrandRoute = (pathname?: string | null): boolean =>
  !isDashboardRoute(pathname);

const applyPrimary = (color: string) => {
  PRIMARY_COLOR = color;
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--brand-primary", color);
  }
};

/**
 * Called by ThemeContext whenever the user changes the primary / active color
 * (and when it hydrates the saved cookie). The choice is always remembered,
 * but it is only displayed on dashboard routes.
 */
export const setLivePrimaryColor = (color: string) => {
  userPrimaryColor = color;
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  applyPrimary(isDashboardRoute(pathname) ? color : DEFAULT_PRIMARY_COLOR);
};

/**
 * Re-applies the right colour for a route. Called by <BrandColorRouteSync />
 * on every navigation, so moving between landing/auth pages and the dashboard
 * swaps the colour without a reload.
 */
export const syncPrimaryForRoute = (pathname?: string | null) => {
  applyPrimary(
    isDashboardRoute(pathname) ? userPrimaryColor : DEFAULT_PRIMARY_COLOR
  );
};

export const SECONDARY_COLOR = "#a3e635";
export const OTHER_COLOR = "#F4F4F4";

/**
 * Initial CSS vars (used on first paint before ThemeContext hydrates).
 * ThemeContext will override --brand-primary at runtime.
 */
export const PRIMARY_CSS_VARS = {
  "--brand-primary": DEFAULT_PRIMARY_COLOR,
} as CSSProperties;

export type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

export const getUI = (isDark: boolean, colors: any, border?: string): UI => ({
  isDark,
  page: colors.bg,
  card: colors.shadeBg,
  inner: colors.shadeBgSecond,
  text: colors.text,
  border:
   (isDark ? colors?.text + 23 : colors?.text + 23),
});

/**
 * These still resolve through CSS variables (theme.css).
 * They will automatically follow the live --brand-primary.
 */
export const PRIMARY_HOVER = "var(--color-primary-hover)";
export const PRIMARY_LIGHT = "var(--color-primary-light)";
export const PRIMARY_TINT = "var(--color-primary-tint)";
export const PRIMARY_DEEP = "var(--color-primary-deep)";
export const PRIMARY_DEEP_HOVER = "var(--color-primary-deep-hover)";