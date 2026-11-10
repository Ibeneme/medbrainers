export const productName = "Medicules";

const domainName = productName.toLowerCase();

export const SITE = {
  name: productName,
  legalName: `${productName} Technologies, Limited.`,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${domainName}.com`).replace(/\/$/, ""),
  tagline: "Connected Electronic Medical Records (EMR)",
  description: `${productName} is a next-generation EMR and hospital management platform for clinical notes, billing, HMO claims, lab, pharmacy, and ward workflows.`,
  locale: "en_NG",
  logo: "/medbrainers-logo.svg",
  ogImage: "/medbrainers-logo.svg",
  logoOgFallback: "/medbrainers-logo.svg",
  twitterHandle: "",
} as const;

/** Change email addresses here only. */
export const EMAILS = {
  admin: `admin@${domainName}.com`,
  sales: `sales@${domainName}.com`,
  support: `support@${domainName}.com`,
} as const;

export type EmailKey = keyof typeof EMAILS;

export function mailto(key: EmailKey, subject?: string): string {
  const base = `mailto:${EMAILS[key]}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function ogImageUrl(path?: string): string {
  return absoluteUrl(path || SITE.ogImage || SITE.logoOgFallback || SITE.logo);
}

export function ogImages(alt?: string) {
  const url = ogImageUrl();
  return [
    {
      url,
      width: 1200,
      height: 630,
      alt: alt || `${productName} — ${SITE.tagline}`,
    },
    {
      url: absoluteUrl(SITE.logo),
      width: 512,
      height: 512,
      alt: `${productName} logo`,
    },
  ];
}


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
