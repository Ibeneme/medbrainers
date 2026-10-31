import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // With this on, Next.js refuses to let generateMetadata() read `params`
  // (your [lang] layout and every page's pageMetadata() do). Turning it
  // off removes the "Blocking Route" error. Everything else is unchanged.
  partialPrefetching: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;