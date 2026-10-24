"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/config";
import { T } from "@/i18n/provider";
import { productName } from "@/constants/site";

/* ---------- Left-panel copy, per auth route (all strings are translated via <T>) ---------- */
export type AuthPanelContent = {
  eyebrow: string;
  title: string;
  points: string[];
};

export const AUTH_PANEL_CONTENT: Record<string, AuthPanelContent> = {
  "/login": {
    eyebrow: "Welcome Back",
    title: `Log in to ${productName}`,
    points: [
      "Access your hospital, clinic, and pharmacy records",
      "Encrypted session management & data protection",
      "24/7 dedicated support concierge assistance",
    ],
  },
  "/get-started": {
    eyebrow: "Get started",
    title: `Create your ${productName} account`,
    points: [
      "Verify your email so your account and records stay secure",
      "One login across hospital, clinic and pharmacy tools",
      "Our team helps you set up and go live",
    ],
  },
  "/forgot-password": {
    eyebrow: "Account Recovery",
    title: "Reset your account password",
    points: [
      "Secure verification sent directly to your inbox",
      "Encrypted session and password update process",
      "Restores full system access instantly",
    ],
  },
};

const DEFAULT_ROUTE = "/login";

const CheckIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * The reusable left side. Pass `content` to use it with custom copy on a new page,
 * or add a route to AUTH_PANEL_CONTENT and the shell picks it up automatically.
 */
export function AuthSidePanel({ eyebrow, title, points }: AuthPanelContent) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="p-3 lg:sticky lg:top-0 lg:h-screen">
      <div
        style={{ backgroundColor: "#0b1936" }} // Replaced purple/primary-deep with deep navy
        className="relative h-64 overflow-hidden sm:h-80 lg:h-full"
      >
        {!imgFailed && (
          <Image
            src="/mosaic/03.svg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            onError={() => setImgFailed(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <span className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80">
            <span
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="h-1.5 w-1.5 rounded-full"
            />
            <T>{eyebrow}</T>
          </span>
          <h1 className="max-w-md text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
            <T>{title}</T>
            <span style={{ color: PRIMARY_COLOR }}>.</span>
          </h1>

          <ul className="mt-8 hidden max-w-md flex-col gap-3 lg:flex">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-white/85">
                <span
                  style={{ backgroundColor: PRIMARY_COLOR }}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                >
                  <CheckIcon />
                </span>
                <T>{point}</T>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Two-column auth page: shared left panel + the page's form on the right. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { path } = stripLocale(usePathname() ?? "/");
  const content = AUTH_PANEL_CONTENT[path] ?? AUTH_PANEL_CONTENT[DEFAULT_ROUTE];

  return (
    <main className="min-h-screen bg-black font-lufga text-white">
      <style>{`
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active,
      input:-webkit-autofill:disabled {
        -webkit-box-shadow: 0 0 0 1000px #0a0a0a inset !important;
        box-shadow: 0 0 0 1000px #0a0a0a inset !important;
        -webkit-text-fill-color: #ffffff !important;
        caret-color: #ffffff !important;
        transition: background-color 9999s ease-in-out 0s !important;
      }
      /* standard selector: must be its own rule, or old browsers drop the whole block */
      input:autofill {
        box-shadow: 0 0 0 1000px #0a0a0a inset !important;
        -webkit-text-fill-color: #ffffff !important;
      }
    `}</style>

      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthSidePanel {...content} />

        <div className="mx-auto w-full max-w-md self-center px-6 pb-16 pt-8 lg:py-28">
          {children}
        </div>
      </div>
    </main>
  );
}