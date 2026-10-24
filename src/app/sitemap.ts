import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, absoluteUrl } from "@/constants/site";
import { locales, localizePath } from "@/i18n/config";
import { posts } from "@/components/landing-page/blog/data";

const ROUTES = [
  ...PUBLIC_ROUTES,
  ...posts.map((p) => ({
    path: `/blog/${p.slug}`,
    priority: 0.6,
    changeFrequency: "yearly" as const,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((r) =>
    locales.map((locale) => ({
      url: absoluteUrl(localizePath(r.path, locale)),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, absoluteUrl(localizePath(r.path, l))])
        ),
      },
    }))
  );
}
