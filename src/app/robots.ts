import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Auth pages are kept out of search via noindex (see src/app/[lang]/(auth)/layout.tsx).
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}
