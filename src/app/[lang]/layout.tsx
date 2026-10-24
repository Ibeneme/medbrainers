import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/contexts/theme-context";
import ReduxProvider from "@/components/providers/redux-provider";
import ConditionalLayout from "@/components/main/ConditionalLayout";
import { SITE, EMAILS, absoluteUrl, productName, ogImages } from "@/constants/site";
import { locales, isLocale, localizePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getT } from "@/i18n/server";
import { I18nProvider } from "@/i18n/provider";
import { buildAlternates, ogLocales } from "@/i18n/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getT(lang);
  const title = `${productName} | ${t(SITE.tagline)}`;
  const description = t(SITE.description);

  return {
    metadataBase: new URL(SITE.url),
    title: { default: title, template: `%s | ${productName}` },
    description,
    applicationName: productName,
    keywords: [
      t("EMR software Nigeria"),
      t("electronic medical records"),
      t("hospital management system"),
      t("clinic management software"),
      t("HMO billing software"),
      t("pharmacy management system"),
      t("lab management system"),
      SITE.name,
    ],
    icons: {
      icon: [{ url: SITE.logo, type: "image/svg+xml" }], // browser tab
      shortcut: SITE.logo,
      apple: [{ url: SITE.logo }], // iOS "Add to Home Screen"
    },
    appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
    authors: [{ name: SITE.name, url: SITE.url }],
    creator: SITE.legalName,
    publisher: SITE.legalName,
    alternates: buildAlternates(lang, "/"),
    openGraph: {
      type: "website",
      siteName: productName,
      url: localizePath("/", lang),
      title,
      description,
      images: ogImages(title),
      ...ogLocales(lang),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages(title).map((i) => i.url),
      ...(SITE.twitterHandle ? { site: SITE.twitterHandle } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    formatDetection: { email: false, address: false, telephone: false },
  };
}

function buildJsonLd(lang: Locale) {
  const t = getT(lang);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        logo: absoluteUrl(SITE.logo),
        email: EMAILS.support,
        contactPoint: [
          { "@type": "ContactPoint", contactType: "sales", email: EMAILS.sales },
          { "@type": "ContactPoint", contactType: "customer support", email: EMAILS.support },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: absoluteUrl(localizePath("/", lang)),
        name: SITE.name,
        description: t(SITE.description),
        inLanguage: lang,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE.name,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        description: t(SITE.description),
        url: absoluteUrl(localizePath("/", lang)),
        inLanguage: lang,
      },
    ],
  };
}

export default async function LangLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(lang)).replace(/</g, "\u003c"),
        }}
      />
      <ReduxProvider>
        <I18nProvider locale={lang} dict={getDictionary(lang)}>
          <ThemeProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ThemeProvider>
        </I18nProvider>
      </ReduxProvider>
    </>
  );
}
