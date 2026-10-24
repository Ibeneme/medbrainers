import ForgotPasswordPage from "@/components/auth/forgot-password";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(params, "/forgot-password", "Reset your password");
}

export default function Page() {
  return (
    <div>
      <ForgotPasswordPage />
    </div>
  );
}
