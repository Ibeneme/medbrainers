import FacilityTypePage from "@/components/landing-page/why-choose-us/facility-type";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/facility-type",
    "Facility Types",
    "Tailored electronic medical records and management solutions designed for hospitals, clinics, dental practices, and pharmacies."
  );
}

export default function Page() {
  return (
    <div>
      <FacilityTypePage />
    </div>
  );
}
