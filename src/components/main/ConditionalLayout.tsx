"use client";

import React, { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import LandingPageNavbar from "@/components/main/navbar";
import LandingPageFooter from "@/components/main/footer";

/**
 * Set to true once a ConditionalLayout is mounted. If another one is nested
 * inside it, the inner one renders only its children (no double navbar/footer).
 */
const LayoutMountedContext = createContext(false);

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const alreadyMounted = useContext(LayoutMountedContext);
  const pathname = usePathname() || "";

  if (alreadyMounted) return <>{children}</>;

  // Auth / entry flows — no marketing chrome
  const isAuthRoute =
    pathname.includes("/auth") ||
    pathname.includes("/get-started") ||
    pathname.includes("/telehealth") ||
    pathname.includes("/login") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  // App shell — no marketing navbar/footer (uses dashboard sidebar instead)
  const isDashboardRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.includes("/dashboard/");

  const hideMarketingChrome = isAuthRoute || isDashboardRoute;

  return (
    <LayoutMountedContext.Provider value={true}>
      {!hideMarketingChrome && <LandingPageNavbar />}
      {children}
      {!hideMarketingChrome && <LandingPageFooter />}
    </LayoutMountedContext.Provider>
  );
}
