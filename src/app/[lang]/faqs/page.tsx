import FAQsClientPage from "@/components/landing-page/pricing/FAQsClientPage";
import { faqData } from "@/components/landing-page/pricing/faq-data";
import { isLocale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { pageMetadata, type LangParams } from "@/i18n/seo";
import Cells from "@/components/landing-page/home/dna/cells";
import { T } from "@/i18n/provider";
import { productName } from "@/constants/site";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/faqs",
    "Frequently Asked Questions | Medicules",
    "Find answers to common questions about Medicules EMR, clinical modules, telemedicine, pharmacy inventory, and hospital workflows."
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero Section with Cells Background */}
      <div
        className="relative w-full overflow-hidden bg-black flex items-center justify-center"
        style={{ height: 250 }}
      >
        <div className="absolute inset-0 opacity-40">
          <Cells />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-16">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white/65 mb-4">
            {productName} FAQ's
            <span style={{ color: "var(--primary-color)" }}>.</span>
          </h1>
        </div>
      </div>

      <FAQsClientPage />
    </div>
  );
}
