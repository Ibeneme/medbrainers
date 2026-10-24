import FAQsClientPage from "@/components/landing-page/pricing/FAQsClientPage";
import MedBrainersPricingPage from "@/components/landing-page/pricing/pricing";
import { faqData } from "@/components/landing-page/pricing/faq-data";
import { isLocale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { pageMetadata, type LangParams } from "@/i18n/seo";
import DnaSection from "@/components/landing-page/home/animated-dna";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/pricing",
    "Pricing & FAQs",
    "Simple, transparent MedBrainers EMR pricing for clinics, hospitals, and multi-branch groups. Compare plans and read answers to common questions."
  );
}

export default async function Page({ params }: LangParams) {
  const { lang } = await params;
  const t = getT(isLocale(lang) ? lang : "en");
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: faqData.map((f) => ({
      "@type": "Question",
      name: t(f.question),
      acceptedAnswer: { "@type": "Answer", text: t(f.answer) },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <MedBrainersPricingPage />
      <DnaSection />
      <FAQsClientPage />
    </div>
  );
}
