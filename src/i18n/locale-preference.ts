import { isLocale, type Locale } from "./config";

/** Cookie that remembers the visitor's language across the marketing site, auth pages and dashboard. */
export const LOCALE_COOKIE = "mb_lang";

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.slice(LOCALE_COOKIE.length + 1);
  return isLocale(value) ? value : null;
}

export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
