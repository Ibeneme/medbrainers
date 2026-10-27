"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultLocale, locales, localeMeta, type Locale } from "./config";
import { getDictionary } from "./dictionaries";
import { I18nProvider } from "./provider";
import { readLocaleCookie, writeLocaleCookie } from "./locale-preference";

/**
 * The dashboard lives at /dashboard (outside /[lang]), so its language is not in the URL.
 * It is read from the `mb_lang` cookie, which the marketing/auth pages set whenever
 * a visitor browses in a language, and can be changed with <DashboardLanguageToggle />.
 * First render is always the default language so server and client HTML match.
 */
type Ctx = { locale: Locale; setLocale: (l: Locale) => void };
const DashboardLocaleContext = createContext<Ctx>({ locale: defaultLocale, setLocale: () => {} });

export const useDashboardLocale = () => useContext(DashboardLocaleContext);

export function DashboardI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = readLocaleCookie();
    if (saved) setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeLocaleCookie(l);
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <DashboardLocaleContext.Provider value={value}>
      <I18nProvider locale={locale} dict={getDictionary(locale)}>
        {children}
      </I18nProvider>
    </DashboardLocaleContext.Provider>
  );
}

/** Compact EN | FR switch for the dashboard header. */
export function DashboardLanguageToggle({
  borderColor,
  backgroundColor,
  color,
}: {
  borderColor: string;
  backgroundColor: string;
  color: string;
}) {
  const { locale, setLocale } = useDashboardLocale();
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex h-9 items-center rounded-lg border p-0.5"
      style={{ borderColor, backgroundColor, color }}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            lang={l}
            title={localeMeta[l].name}
            aria-label={localeMeta[l].name}
            aria-pressed={active}
            className="h-full rounded-md px-2 text-[11px] font-semibold tracking-wide transition-colors"
            style={{
              backgroundColor: active ? "rgba(128,128,128,0.22)" : "transparent",
              opacity: active ? 1 : 0.6,
            }}
          >
            {localeMeta[l].label}
          </button>
        );
      })}
    </div>
  );
}
