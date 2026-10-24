import FacilitySizePage from "@/components/landing-page/why-choose-us/facility-size";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/facility-size",
    "Facility Size Solutions",
    "Scalable EMR software and hospital management systems designed to fit healthcare facilities of any size, from single-doctor clinics to large hospital networks."
  );
}

export default function Page() {
  return (
    <div>
      <FacilitySizePage />
    </div>
  );
}