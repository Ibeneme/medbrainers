import MedBrainersMosaic from "@/components/landing-page/home/Medbrainersmosaic";
import IntegrationsShowcase, {
  features,
} from "@/components/landing-page/home/after-hero";
import EnterpriseSupportSection from "@/components/landing-page/home/features-section";
import Hero from "@/components/landing-page/home/hero";
import MedBrainersIntro from "@/components/landing-page/home/intro";
import Testimonials from "@/components/landing-page/home/testimonials";
import { pageMetadata, type LangParams } from "@/i18n/seo";
import { SITE } from "@/constants/site";
import DataSecurity from "@/components/landing-page/home/ai-health";
import Countdown from "@/components/atoms/timers/countdown";
import DnaSection from "@/components/landing-page/home/animated-dna";
import FeatureSlider from "@/components/atoms/timers/featuresslider";
import MedAnimations from "@/components/landing-page/home/animations";
import EmrImportSection from "@/components/landing-page/home/emr";
import MacShowcase from "@/components/landing-page/home/mac-showcase";
import HealthMeetsAI from "@/components/landing-page/home/ai-health";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/",
    `${SITE.name} | EMR & Hospital Management Software`,
    SITE.description,
    {
      absoluteTitle: true,
    }
  );
}

export default function Home() {
  return (
    <div>
      <Hero />
      <FeatureSlider />
      <EmrImportSection />
      <DnaSection />

      <MedBrainersIntro />
      <EnterpriseSupportSection />
      <HealthMeetsAI />
      <Testimonials />
      <MedBrainersMosaic /> 
      {/* <Countdown /> */}
    </div>
  );
}
