"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { locales, localeMeta, localizePath, stripLocale } from "./config";
import { useLocale, useT } from "./provider";
import { Flag } from "./flags";

const Check = () => (
  <svg
    className="ml-auto h-4 w-4 shrink-0 text-primary"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * NOTE: these are plain <a> tags on purpose. The language lives in the root layout
 * ([lang]/layout.tsx renders <html lang>), so changing it needs a full page load.
 * A client-side <Link> transition cannot swap <html> and causes a hydration error.
 *
 * Lists every language as a real link. The language you are currently viewing
 * (taken from the URL via the i18n provider) is highlighted and marked with a tick.
 *
 * variant="list"   → vertical rows (navbar dropdown / mobile menu)
 * variant="inline" → compact row (footer)
 */
export default function LanguageSwitcher({
  className = "",
  variant = "list",
  onSelect,
}: {
  className?: string;
  variant?: "list" | "inline";
  onSelect?: () => void;
}) {
  const current = useLocale();
  const t = useT();
  const { path } = stripLocale(usePathname() || "/");
  const inline = variant === "inline";

  return (
    <nav
      aria-label={t("Language")}
      className={`flex ${inline ? "flex-row flex-wrap items-center gap-2" : "w-full flex-col gap-1"} ${className}`}
    >
      {locales.map((l) => {
        const active = l === current;
        const fullName = localeMeta[l].name;

        return (
          <a
            key={l}
            href={localizePath(path, l)}
            hrefLang={l}
            lang={l}
            title={fullName}
            aria-label={fullName}
            aria-current={active ? "true" : undefined}
            onClick={onSelect}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
              inline ? "px-3 py-1.5" : "w-full px-3.5 py-2.5"
            } ${
              active
                ? "bg-white/10 text-white ring-1 ring-white/20"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Flag locale={l} />
            <span>{fullName}</span>
            {active && !inline && <Check />}
          </a>
        );
      })}
    </nav>
  );
}
