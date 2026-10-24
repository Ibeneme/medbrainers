import { redirect } from "next/navigation";
import { isLocale, localizePath } from "@/i18n/config";

/** /contact now goes straight to the Get Started page (keeps /fr/contact working too). */
export default async function ContactRedirect({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(localizePath("/get-started", isLocale(lang) ? lang : "en"));
}
