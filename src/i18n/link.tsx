"use client";

import React, { useMemo } from "react";
import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { localizePath } from "./config";
import { useLocale } from "./provider";

/** Drop-in replacement for next/link that keeps the visitor in their language. */
export default function Link({
  href,
  ...props
}: React.ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const finalHref = typeof href === "string" ? localizePath(href, locale) : href;
  return <NextLink href={finalHref} {...props} />;
}

/** Drop-in replacement for useRouter from next/navigation (push/replace keep the language). */
export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, opts?: Parameters<typeof router.push>[1]) =>
        router.push(localizePath(href, locale), opts),
      replace: (href: string, opts?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizePath(href, locale), opts),
    }),
    [router, locale]
  );
}
