import MedBrainersMosaic from "@/components/landing-page/home/Medbrainersmosaic";
import SolutionsPage from "@/components/landing-page/solutions/solutions";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/solutions",
    "EMR, Hospital & Clinic Management Solutions",
    "Explore MedBrainers solutions: hospital management, clinic information system, EMR, dental clinic, pharmacy, hospital records, and operating theatre management."
  );
}

export default function Page() {
  return (
    <div>
      <SolutionsPage />
      <MedBrainersMosaic />
    </div>
  );
}
