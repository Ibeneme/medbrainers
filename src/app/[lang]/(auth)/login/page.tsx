import LoginPage from "@/components/auth/login";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(params, "/login", "Log in");
}

export default function Page() {
  return (
    <div>
      <LoginPage />
    </div>
  );
}
