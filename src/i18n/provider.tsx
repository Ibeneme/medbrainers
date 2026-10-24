"use client";

import React, { createContext, useContext, useMemo } from "react";
import { defaultLocale, type Locale } from "./config";
import { translate, type Dictionary } from "./translate";

type Ctx = { locale: Locale; dict?: Dictionary };
const I18nContext = createContext<Ctx>({ locale: defaultLocale });

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict?: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useLocale = () => useContext(I18nContext).locale;

/** For attributes and strings: const t = useT(); <input placeholder={t("Search")} /> */
export function useT() {
  const { dict } = useContext(I18nContext);
  return useMemo(() => (text: string) => translate(dict, text), [dict]);
}

/** For text: <T>Hello</T> or <T>{item.title}</T>. Non-string children pass through. */
export function T({ children }: { children?: React.ReactNode }) {
  const { dict } = useContext(I18nContext);
  if (typeof children === "string") return <>{translate(dict, children)}</>;
  return <>{children}</>;
}
