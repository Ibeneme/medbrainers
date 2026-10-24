import BlogPage from "@/components/landing-page/blog/blog-page";
import { pageMetadata, type LangParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams) {
  return pageMetadata(
    params,
    "/blog",
    "Blog",
    "Practical guides on electronic records, billing, pharmacy and running a modern hospital."
  );
}

export default function Page() {
  return <BlogPage />;
}
