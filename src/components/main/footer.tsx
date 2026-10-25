"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import CurrentYear from "@/components/main/CurrentYear";
import React, { useState } from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import LanguageSwitcher from "@/i18n/language-switcher";
import { SITE, productName } from "@/constants/site";
import { T } from "@/i18n/provider";
import MedbrainersLoader from "../atoms/loaders/Medbrainersloader";

interface FooterLink {
  label: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Solutions",
    links: [
      {
        label: "Hospital Management System",
        href: "/solutions#hospital-management",
      },
      {
        label: "Clinic Information System",
        href: "/solutions#clinic-information",
      },
      { label: "Electronic Medical Record (EMR)", href: "/solutions#emr" },
      { label: "Industry Clinic System", href: "/solutions#industry-clinic" },
      { label: "Dental Clinic Management", href: "/solutions#dental-clinic" },
      {
        label: "Pharmacy Management System",
        href: "/solutions#pharmacy-management",
      },
      {
        label: "Operating Theatre Management",
        href: "/solutions#operating-theatre",
      },
      { label: "Maternity Management", href: "/solutions#maternity" },
      { label: "Radiology", href: "/solutions#radiology", badge: "Beta" },
      { label: "Blood Bank", href: "/solutions#blood-bank", badge: "Beta" },
      { label: "AI Analysis", href: "/solutions#ai-analysis", badge: "Beta" },
    ],
  },
  {
    title: "Why Choose Us",
    links: [
      { label: "Why Choose Us", href: "/why-choose-us" },
      {
        label: "Security & Compliance",
        href: "/why-choose-us#security",
      },
      {
        label: "Implementation & Training",
        href: "/why-choose-us#implementation",
      },
      {
        label: "Support You Can Reach",
        href: "/why-choose-us#support",
      },
      {
        label: "Data Migration",
        href: "/why-choose-us#data-migration",
      },

    ],
  },
  {
    title: "Your Facility",
    links: [
      {
        label: "For Solo Practitioners",
        href: "/facility-size#solo-practitioners",
      },
      { label: "For Clinics", href: "/facility-size#clinics" },
      { label: "For Hospitals", href: "/facility-size#hospitals" },
      {
        label: "For Hospital Groups",
        href: "/facility-size#hospital-groups",
      },
      

    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Get Started", href: "/get-started" },
      { label: "Book a Demo", href: "/demo" },
    ],
  },
];

export default function LandingPageFooter() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <footer className="relative w-full overflow-hidden bg-black text-white">
      <div className="relative w-full overflow-hidden">
        {/* Subtle ambient noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 md:px-12 md:py-16 lg:py-20">
          <div className="mb-12 flex flex-col justify-between gap-12 lg:mb-16 lg:flex-row lg:gap-16">
            {/* Brand */}
            <div className="flex w-full flex-col items-start lg:w-1/4">
              <Link
                href="/"
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                className="group mb-4 inline-flex items-center gap-4.5 text-xl font-bold tracking-tight text-white"
              >
                {isLogoHovered ? (
                  <div className="flex h-16 w-16 items-center justify-center">
                    <MedbrainersLoader
                      showText={false}
                      size={64}
                      fontUrl=""
                      className=""
                      tileColor={PRIMARY_COLOR}
                    />
                  </div>
                ) : (
                  <Image
                    src="/medbrainers-logo.svg"
                    alt={productName}
                    width={28}
                    height={28}
                    className="h-16 w-16 object-contain"
                  />
                )}
              </Link>

              <p className="max-w-[280px] text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
                <T>
                  Connected electronic medical records that make hospital
                  workflows, billing, HMOs, and care management effortless.
                </T>
              </p>
            </div>

            {/* Link columns */}
            <div className="grid w-full grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:w-3/4 lg:gap-x-8">
              {footerColumns.map((col) => (
                <div key={col.title} className="flex flex-col">
                  <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-white/90 sm:mb-5 sm:text-[13px]">
                    <T>{col.title}</T>
                  </h4>
                  <ul className="space-y-3 sm:space-y-3.5">
                    {col.links.map((link) => (
                      <li key={`${col.title}-${link.label}`}>
                        {link.isExternal ? (
                          <a
                            href={link.href}
                            className="inline-flex items-center gap-2 text-[13px] text-white/50 transition-colors duration-200 hover:text-white sm:text-[14px]"
                          >
                            <T>{link.label}</T>
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="flex flex-wrap items-center gap-2 text-[13px] text-white/50 transition-colors duration-200 hover:text-white sm:text-[14px]"
                          >
                            <span>
                              <T>{link.label}</T>
                            </span>
                            {link.badge && (
                              <span
                                className="whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-medium text-white sm:text-[10px]"
                                style={{ backgroundColor: PRIMARY_COLOR }}
                              >
                                <T>{link.badge}</T>
                              </span>
                            )}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Massive brand title */}
          <div className="mt-16 w-full select-none overflow-hidden">
            <p
              aria-hidden="true"
              className="w-full text-center text-[clamp(4.2rem,18vw,14rem)] font-black leading-[0.8] tracking-tighter text-white sm:text-left md:text-[clamp(12rem,19vw,12rem)]"
            >
              <T>{productName}</T>
              <span style={{ color: PRIMARY_COLOR }}>.</span>
            </p>
          </div>

          <div className="my-8 h-px w-full bg-white/10 sm:my-10" />

          {/* Bottom bar */}
          <div className="flex flex-col-reverse items-center justify-between gap-6 md:flex-row md:items-start">
            <p className="text-center text-[12px] text-white/40 sm:text-[13px] md:text-left">
              © <CurrentYear /> {SITE.legalName.replace(/\.$/, "")}.{" "}
              <T>All rights reserved.</T>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/40 sm:text-[13px] md:justify-end">
              {/* <LanguageSwitcher variant="inline" /> */}
              <Link
                href="/legal/privacy"
                className="transition-colors duration-200 hover:text-white"
              >
                <T>Privacy</T>
              </Link>
              <Link
                href="/legal/terms"
                className="transition-colors duration-200 hover:text-white"
              >
                <T>Terms</T>
              </Link>
              <Link
                href="/legal/cookies"
                className="transition-colors duration-200 hover:text-white"
              >
                <T>Cookies</T>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
