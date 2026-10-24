import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PRIMARY_CSS_VARS } from "@/constants/colors";
import { defaultSiteMetadata } from "@/i18n/seo";
import { productName } from "@/constants/site";

const lufga = localFont({
  src: [
    { path: "../../public/fonts/LufgaLight.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/LufgaRegular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/LufgaMedium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/LufgaSemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/LufgaBold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/LufgaExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-lufga",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

/** Root metadata — branded with productName + Open Graph logo images */
export const metadata: Metadata = defaultSiteMetadata();

/**
 * ROOT layout — must include <html> and <body>.
 * Marketing pages use app/[lang]/layout.tsx for providers only.
 * Dashboard uses app/dashboard/layout.tsx for providers only.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={PRIMARY_CSS_VARS}
      className={`${lufga.variable} h-full antialiased font-lufga`}
    >
      <body className="min-h-full flex flex-col font-lufga">{children}</body>
    </html>
  );
}
