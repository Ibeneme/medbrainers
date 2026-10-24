"use client";

import React from "react";
import Link from "@/i18n/link";
import { mailto } from "@/constants/site";
import { T } from "@/i18n/provider";
import { PRIMARY_COLOR } from "@/constants/colors";

interface LandingPageGetStartedButtonProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
  showOnlyOne?: boolean;
  primaryButton?: "get-started" | "contact-sales";
  align?: "left" | "right" | "center";
}

export default function LandingPageGetStartedButton({
  href = "/get-started",
  className = "",
  children = "Get Started",
  showOnlyOne = false,
  primaryButton = "get-started",
  align = "center",
}: LandingPageGetStartedButtonProps) {
  // Fallback to '#830CFA' if PRIMARY_COLOR isn't exporting properly
  const activeColor = PRIMARY_COLOR || "#830CFA";

  const sharedButtonClasses = `px-4 sm:px-6 py-3.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg text-white`;

  const alignmentClass =
    align === "left"
      ? "justify-start"
      : align === "right"
      ? "justify-end"
      : "justify-center";

  if (showOnlyOne && primaryButton === "contact-sales") {
    return (
      <div className={`flex w-full ${alignmentClass}`}>
        <a
          href={mailto("sales")}
          className={`bg-neutral-900 text-white border border-white/15 hover:border-white/40 hover:bg-neutral-800 transition-all duration-200 ${sharedButtonClasses} ${className}`}
        >
          <span>
            <T>Contact sales</T>
          </span>
        </a>
      </div>
    );
  }

  if (showOnlyOne && primaryButton === "get-started") {
    return (
      <div className={`flex w-full ${alignmentClass}`}>
        <Link
          href={href}
          style={{ backgroundColor: activeColor }}
          className={`hover:opacity-90 ${sharedButtonClasses} ${className}`}
        >
          <span>
            <T>{children}</T>
          </span>
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-row items-center gap-3 w-full ${alignmentClass}`}
    >
      {/* Get Started Button */}
      <Link
        href={href}
        style={{ backgroundColor: activeColor }}
        className={`hover:opacity-90 ${sharedButtonClasses} ${className}`}
      >
        <span className="truncate">
          <T>{children}</T>
        </span>
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Contact Sales Button */}
      <a
        href={mailto("sales")}
        className={`bg-neutral-900 text-white border border-white/15 hover:border-white/40 hover:bg-neutral-800 transition-all duration-200 ${sharedButtonClasses} ${className}`}
      >
        <span className="truncate">
          <T>Contact sales</T>
        </span>
      </a>
    </div>
  );
}
