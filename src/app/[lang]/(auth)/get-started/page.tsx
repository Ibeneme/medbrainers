import GetStartedPage from "@/components/auth/get-started";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(params, "/get-started", "Get started");
}

export default function Page() {
  return (
    <div>
      <GetStartedPage />
    </div>
  );
}
