import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/constants/site";
import { isLocale } from "@/i18n/config";
import { buildAlternates, ogLocales } from "@/i18n/seo";
import { localizePath } from "@/i18n/config";
import { legalDocs, type LegalSlug } from "@/content/legal";
import LegalDocument from "./legal-document";

type Params = { params: Promise<{ lang: string }> };

/** Metadata for /legal/<slug> in the visitor's language. */
export async function legalMetadata({ params }: Params, slug: LegalSlug): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const doc = legalDocs(slug, lang);
  const path = `/legal/${slug}`;
  return {
    title: doc.metaTitle,
    description: doc.metaDescription,
    alternates: buildAlternates(lang, path),
    openGraph: {
      url: localizePath(path, lang),
      title: `${doc.metaTitle} | ${SITE.name}`,
      description: doc.metaDescription,
      ...ogLocales(lang),
    },
  };
}

export default async function LegalPage({ params, slug }: Params & { slug: LegalSlug }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <LegalDocument doc={legalDocs(slug, lang)} />;
}
