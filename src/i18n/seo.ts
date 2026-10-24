import type { Metadata } from "next";
import { SITE, productName, ogImages, absoluteUrl } from "@/constants/site";
import { isLocale } from "./config";
import { getT } from "./server";
import { locales, localeMeta, localizePath, defaultLocale, type Locale } from "./config";

/** canonical + hreflang links for a page, e.g. buildAlternates("fr", "/pricing") */
export function buildAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizePath(path, l);
  languages["x-default"] = localizePath(path, defaultLocale);
  return { canonical: localizePath(path, locale), languages };
}

export function ogLocales(locale: Locale) {
  return {
    locale: localeMeta[locale].ogLocale,
    alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
  };
}

export type LangParams = { params: Promise<{ lang: string }> };

/**
 * One-liner metadata for a page.
 * Always brands with productName and includes Open Graph + Twitter images (logo).
 */
export async function pageMetadata(
  params: LangParams["params"],
  path: string,
  title: string,
  description?: string,
  opts: { absoluteTitle?: boolean } = {},
): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getT(lang);
  const tt = t(title);
  const fullTitle = opts.absoluteTitle ? tt : `${tt} | ${productName}`;
  const desc = description ? t(description) : t(SITE.description);
  const images = ogImages(fullTitle);

  return {
    title: opts.absoluteTitle ? { absolute: tt } : tt,
    description: desc,
    applicationName: productName,
    alternates: buildAlternates(lang, path),
    openGraph: {
      type: "website",
      siteName: productName,
      url: localizePath(path, lang),
      title: fullTitle,
      description: desc,
      images,
      ...ogLocales(lang),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: images.map((i) => i.url),
      ...(SITE.twitterHandle ? { site: SITE.twitterHandle } : {}),
    },
  };
}

/** Default root-level metadata helpers (no lang) */
export function defaultSiteMetadata(): Metadata {
  const title = `${productName} | ${SITE.tagline}`;
  const description = SITE.description;
  const images = ogImages(title);
  return {
    metadataBase: new URL(SITE.url),
    title: { default: title, template: `%s | ${productName}` },
    description,
    applicationName: productName,
    icons: {
      icon: [{ url: SITE.logo, type: "image/svg+xml" }],
      shortcut: SITE.logo,
      apple: [{ url: SITE.logo }],
    },
    openGraph: {
      type: "website",
      siteName: productName,
      url: SITE.url,
      title,
      description,
      images,
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}
