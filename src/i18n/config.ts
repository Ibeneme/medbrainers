/**
 * LANGUAGE SETTINGS
 * To add a language (e.g. Spanish):
 *   1. add "es" to `locales` and `localeMeta` below
 *   2. create src/i18n/dictionaries/es.ts (copy fr.ts and translate the values)
 *   3. register it in src/i18n/dictionaries/index.ts
 * The default language (English) has no URL prefix: /pricing. Others do: /fr/pricing.
 */
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; name: string; ogLocale: string }> = {
  en: { label: "EN", name: "English", ogLocale: "en_NG" },
  fr: { label: "FR", name: "Français", ogLocale: "fr_FR" },
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** "/pricing" -> "/fr/pricing" (default language stays unprefixed). Leaves anchors, mailto:, http(s) alone. */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const { path: bare } = stripLocale(path);
  if (locale === defaultLocale) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

/** "/fr/pricing" -> { locale: "fr", path: "/pricing" } */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first, ...rest] = pathname.split("/");
  const firstClean = first?.split(/[?#]/)[0];
  if (isLocale(firstClean)) {
    const tail = pathname.slice(firstClean.length + 1);
    return { locale: firstClean, path: tail.startsWith("/") ? tail : tail ? `/${tail}` : "/" };
  }
  void rest;
  return { locale: null, path: pathname || "/" };
}
