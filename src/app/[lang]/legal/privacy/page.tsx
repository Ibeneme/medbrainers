import LegalPage, { legalMetadata } from "@/components/landing-page/legal/legal-page";

type Props = { params: Promise<{ lang: string }> };

export const generateMetadata = (props: Props) => legalMetadata(props, "privacy");

export default function Page(props: Props) {
  return <LegalPage {...props} slug="privacy" />;
}
