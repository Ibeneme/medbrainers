/**
 * SINGLE SOURCE OF TRUTH for site-wide details.
 * Change a value here and it updates everywhere (footer, buttons, FAQ,
 * contact page, metadata, sitemap, structured data).
 */

export const productName = "Medicules";

const domainName = productName.toLowerCase();

export const SITE = {
  name: productName,
  legalName: `${productName} Technologies, Limited.`,
  // Your live domain, no trailing slash. Can be overridden with NEXT_PUBLIC_SITE_URL.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${domainName}.com`).replace(/\/$/, ""),
  tagline: "Connected Electronic Medical Records (EMR)",
  description: `${productName} is a next-generation EMR and hospital management platform for clinical notes, billing, HMO claims, lab, pharmacy, and ward workflows.`,
  locale: "en_NG",
  /** Browser tab + schema logo (SVG ok) */
  logo: "/medbrainers-logo.svg",
  /**
   * Open Graph / Twitter share image.
   * Prefer a 1200×630 PNG at public/og-image.png; falls back to logo.
   */
  ogImage: "/og-image.png",
  /** Same asset as logo when a dedicated OG image is missing */
  logoOgFallback: "/medbrainers-logo.svg",
  twitterHandle: "", // leave empty to skip
} as const;

/** Change email addresses here only. */
export const EMAILS = {
  admin: `admin@${domainName}.com`,
  sales: `sales@${domainName}.com`,
  support: `support@${domainName}.com`,
} as const;

export type EmailKey = keyof typeof EMAILS;

/** Build a mailto: link, e.g. mailto("support", "Software Inquiry") */
export function mailto(key: EmailKey, subject?: string): string {
  const base = `mailto:${EMAILS[key]}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

/** Absolute URL helper, e.g. absoluteUrl("/pricing") */
export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute Open Graph image URL (logo / product image). */
export function ogImageUrl(path?: string): string {
  return absoluteUrl(path || SITE.ogImage || SITE.logoOgFallback || SITE.logo);
}

/** Shared Open Graph image object for Metadata */
export function ogImages(alt?: string) {
  const url = ogImageUrl();
  return [
    {
      url,
      width: 1200,
      height: 630,
      alt: alt || `${productName} — ${SITE.tagline}`,
    },
    // Also expose logo for platforms that prefer square icons
    {
      url: absoluteUrl(SITE.logo),
      width: 512,
      height: 512,
      alt: `${productName} logo`,
    },
  ];
}

/** Public routes used by the sitemap. Add new pages here. */
export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/solutions", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/get-started", priority: 0.8, changeFrequency: "monthly" },
  { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/cookies", priority: 0.3, changeFrequency: "yearly" },
] as const;
