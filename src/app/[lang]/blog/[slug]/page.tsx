import { notFound } from "next/navigation";
import BlogDetail from "@/components/landing-page/blog/blog-detail";
import { posts, getPost, pick } from "@/components/landing-page/blog/data";
import { SITE, absoluteUrl } from "@/constants/site";
import { isLocale, locales, localizePath } from "@/i18n/config";
import { pageMetadata } from "@/i18n/seo";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return locales.flatMap((lang) => posts.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: Props) {
  const { lang, slug } = await params;
  const post = getPost(slug);
  if (!isLocale(lang) || !post) return {};
  return pageMetadata(
    Promise.resolve({ lang }),
    `/blog/${slug}`,
    pick(post.title, lang),
    pick(post.excerpt, lang)
  );
}

export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  const post = getPost(slug);
  if (!isLocale(lang) || !post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    inLanguage: lang,
    headline: pick(post.title, lang),
    description: pick(post.excerpt, lang),
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: absoluteUrl(localizePath(`/blog/${slug}`, lang)),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <BlogDetail slug={slug} />
    </>
  );
}
