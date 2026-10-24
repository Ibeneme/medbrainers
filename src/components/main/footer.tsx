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
      {
        label: "Maternity Management",
        href: "/solutions#maternity",
      },
      {
        label: "Radiology",
        href: "/solutions#radiology",
        badge: "Beta",
      },
      {
        label: "Blood Bank",
        href: "/solutions#blood-bank",
        badge: "Beta",
      },
      {
        label: "AI Analysis",
        href: "/solutions#ai-analysis",
        badge: "Beta",
      },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Clinical Notes & SOAP", href: "#clinical-notes" },
      { label: "Billing & HMO", href: "#billing-hmo" },
      { label: "Lab & Pharmacy", href: "#lab-pharmacy" },
      { label: "Wards & Vitals", href: "#wards-vitals" },
      { label: "Dynamic Price Catalog", href: "#pricing-catalog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Get Started", href: "/get-started" },
    ],
  },
];

export default function LandingPageFooter() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <footer className="w-full bg-black text-white relative overflow-hidden">
      {/* Main Footer Wrapper containing the ambient noise and content */}
      <div className="relative w-full overflow-hidden">
        {/* Subtle ambient noise overlay */}
        <div
          className="absolute inset-0 z-1 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-12 md:py-16 lg:py-20 relative z-10">
          {/* Main Flex Container */}
          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-16 mb-12 md:mb-16">
            {/* Brand Section */}
            <div className="w-full lg:w-1/4 flex flex-col items-start">
              <Link
                href="/"
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                className="items-center gap-4.5 text-xl font-bold tracking-tight text-white mb-4 group inline-flex"
              >
                {isLogoHovered ? (
                  <div className="w-16 h-16 flex items-center justify-center">
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
                    className="w-16 h-16 object-contain"
                  />
                )}
              </Link>

              <p className="text-white/55 text-[14px] sm:text-[15px] leading-relaxed max-w-[280px]">
                <T>
                  Connected electronic medical records that make hospital
                  workflows, billing, HMOs, and care management effortless.
                </T>
              </p>
            </div>

            {/* Link Columns Grid */}
            <div className="w-full lg:w-3/4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 lg:gap-x-8">
              {footerColumns.map((col) => (
                <div key={col.title} className="flex flex-col">
                  <h4 className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase text-white/90 mb-4 sm:mb-5">
                    <T>{col.title}</T>
                  </h4>
                  <ul className="space-y-3 sm:space-y-3.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        {link.isExternal ? (
                          <a
                            href={link.href}
                            className="text-[13px] sm:text-[14px] text-white/50 hover:text-white transition-colors duration-200 inline-flex items-center gap-2"
                          >
                            <T>{link.label}</T>
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-[13px] sm:text-[14px] text-white/50 hover:text-white transition-colors duration-200 flex flex-wrap items-center gap-2"
                          >
                            <span>
                              <T>{link.label}</T>
                            </span>
                            {link.badge && (
                              <span
                                className="text-[9px] sm:text-[10px] text-white px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
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

          {/* Massive Typographic Brand Title */}
          <div className="mt-16 w-full select-none overflow-hidden">
            <p
              aria-hidden="true"
              className="w-full text-center text-[clamp(4.2rem,18vw,14rem)] md:text-[clamp(12rem,19vw,12rem)] font-black leading-[0.8] tracking-tighter text-[#ffffff] sm:text-left"
            >
              <T>{productName}</T>
              <span style={{ color: PRIMARY_COLOR }}>.</span>
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 my-8 sm:my-10" />

          {/* Bottom Bar */}
          <div className="flex flex-col-reverse md:flex-row items-center md:items-start justify-between gap-6">
            <p className="text-[12px] sm:text-[13px] text-white/40 text-center md:text-left">
              © <CurrentYear /> {SITE.legalName.replace(/\.$/, "")}.{" "}
              <T>All rights reserved.</T>
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-[12px] sm:text-[13px] text-white/40">
              <LanguageSwitcher variant="inline" />
              <Link
                href="/legal/privacy"
                className="hover:text-white transition-colors duration-200"
              >
                <T>Privacy</T>
              </Link>
              <Link
                href="/legal/terms"
                className="hover:text-white transition-colors duration-200"
              >
                <T>Terms</T>
              </Link>
              <Link
                href="/legal/cookies"
                className="hover:text-white transition-colors duration-200"
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
