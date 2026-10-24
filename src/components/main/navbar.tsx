"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useState, useEffect, useRef } from "react";
import Link from "@/i18n/link";
import LanguageSwitcher from "@/i18n/language-switcher";
import { Flag } from "@/i18n/flags";
import { localeMeta } from "@/i18n/config";
import Image from "next/image";
import { T, useT, useLocale } from "@/i18n/provider";
import MedbrainersLoader from "../atoms/loaders/Medbrainersloader";
import { productName } from "@/constants/site";
import Cells from "../landing-page/home/dna/cells";

const solutionsItems: {
  title: string;
  description: string;
  href: string;
  beta?: boolean;
}[] = [
  {
    title: "Hospital Management System",
    description: "Comprehensive administration & coordination",
    href: "/solutions#hospital-management",
  },
  {
    title: "Clinic Information System",
    description: "Scheduling, queue & practitioner tools",
    href: "/solutions#clinic-information",
  },
  {
    title: "Electronic Medical Record (EMR)",
    description: "Clinical notes, vitals & patient history",
    href: "/solutions#emr",
  },
  {
    title: "Industry Clinic System",
    description: "Workplace health & occupational services",
    href: "/solutions#industry-clinic",
  },
  {
    title: "Dental Clinic Management",
    description: "Specialized charts & graphical odontograms",
    href: "/solutions#dental-clinic",
  },
  {
    title: "Pharmacy Management System",
    description: "Dispensing, stock alerts & prescriptions",
    href: "/solutions#pharmacy-management",
  },
  {
    title: "Operating Theatre Management",
    description: "Surgical checklists & real-time tracking",
    href: "/solutions#operating-theatre",
  },
  {
    title: "Maternity Management",
    description: "Antenatal care, delivery & postnatal follow-up",
    href: "/solutions#maternity",
  },
  {
    title: "Radiology",
    description: "Imaging orders, reporting & results workflow",
    href: "/solutions#radiology",
    beta: true,
  },
  {
    title: "Blood Bank",
    description: "Donor records, inventory & transfusion tracking",
    href: "/solutions#blood-bank",
    beta: true,
  },
  {
    title: "AI Analysis",
    description: "Intelligent insights & clinical decision support",
    href: "/solutions#ai-analysis",
    beta: true,
  },
];

// ---------------------------------------------------------------------------
// "Why Choose Us" menu content
// NOTE: the hrefs below are placeholders. Point them at your real pages.
// ---------------------------------------------------------------------------

type WhyLinkItem = { title: string; description: string; href: string };

const whyUs: WhyLinkItem[] = [
  {
    title: "Security & Compliance",
    description: "Encrypted records, role-based access & audit trails",
    href: "/why-choose-us#security",
  },
  {
    title: "Implementation & Training",
    description: "Guided setup so your staff are productive fast",
    href: "/why-choose-us#implementation",
  },
  {
    title: "Support You Can Reach",
    description: "Responsive help for your clinical and admin teams",
    href: "/why-choose-us#support",
  },
  {
    title: "Data Migration",
    description: "Move paper and legacy records over safely",
    href: "/why-choose-us#data-migration",
  },
];

const whyBySize: WhyLinkItem[] = [
  {
    title: "For Solo Practitioners",
    description: "Simple charting without the overhead",
    href: "/facility-size#solo-practitioners",
  },
  {
    title: "For Clinics",
    description: "Queues, scheduling & billing in one place",
    href: "/facility-size#clinics",
  },
  {
    title: "For Hospitals",
    description: "Wards, departments & staff, fully connected",
    href: "/facility-size#hospitals",
  },
  {
    title: "For Hospital Groups",
    description: "One patient record across every branch",
    href: "/facility-size#hospital-groups",
  },
];

const whyByType: WhyLinkItem[] = [
  {
    title: "For Dental Practices",
    description: "Odontograms & treatment plans",
    href: "/facility-type#dental-practices",
  },
  {
    title: "For Pharmacies",
    description: "Dispensing & stock control",
    href: "/facility-type#pharmacies",
  },
  {
    title: "For Maternity Centres",
    description: "Antenatal to postnatal care",
    href: "/facility-type#maternity-centres",
  },
  {
    title: "For Occupational Health",
    description: "Workplace screening & reporting",
    href: "/facility-type#occupational-health",
  },
];

const whyColumns: { label: string; items: WhyLinkItem[] }[] = [
  { label: "Why Us", items: whyUs },
  { label: "Your Facility Size", items: whyBySize },
  { label: "Your Facility Type", items: whyByType },
];

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h14M12 5l7 7-7 7"
    />
  </svg>
);

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const BetaBadge = () => (
  <span
    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
    style={{ backgroundColor: PRIMARY_COLOR }}
  >
    <T>Beta</T>
  </span>
);

// One row inside the "Why Choose Us" lists
const WhyRow = ({
  item,
  onClick,
}: {
  item: WhyLinkItem;
  onClick: () => void;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className="group relative flex items-start justify-between gap-2 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.06]"
  >
    <span
      aria-hidden="true"
      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      style={{ backgroundColor: PRIMARY_COLOR }}
    />
    <div className="min-w-0 flex-1">
      <span className="block text-[15px] font-semibold leading-snug text-white">
        <T>{item.title}</T>
      </span>
      <span className="mt-0.5 block text-[13px] leading-snug text-white/55">
        <T>{item.description}</T>
      </span>
    </div>
    <Arrow className="mt-1 h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-1" />
  </Link>
);

interface LandingPageNavbarProps {
  showOnlyOneButton?: boolean;
  primaryButton?: "get-started";
  mobileShowOnlyOneButton?: boolean;
  mobilePrimaryButton?: "get-started";
}

export default function LandingPageNavbar({
  showOnlyOneButton = true,
  primaryButton = "get-started",
  mobileShowOnlyOneButton = true,
  mobilePrimaryButton = "get-started",
}: LandingPageNavbarProps) {
  const t = useT();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false);
  const [isMobileWhyOpen, setIsMobileWhyOpen] = useState(false);

  // Hover tracking: -1 = featured "View All" card, 0..n = list items
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isWhyFeaturedHovered, setIsWhyFeaturedHovered] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whyCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLocale = useLocale();

  useEffect(() => {
    setIsLangOpen(false);
    setIsMobileMenuOpen(false);
  }, [currentLocale]);

  const openSolutions = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (whyCloseTimer.current) clearTimeout(whyCloseTimer.current);
    setIsWhyOpen(false);
    setIsSolutionsOpen(true);
  };
  const closeSolutionsSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setIsSolutionsOpen(false);
      setHoveredIndex(null);
    }, 120);
  };

  const openWhy = () => {
    if (whyCloseTimer.current) clearTimeout(whyCloseTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsSolutionsOpen(false);
    setHoveredIndex(null);
    setIsWhyOpen(true);
  };
  const closeWhySoon = () => {
    if (whyCloseTimer.current) clearTimeout(whyCloseTimer.current);
    whyCloseTimer.current = setTimeout(() => {
      setIsWhyOpen(false);
    }, 120);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsSolutionsOpen(false);
        setHoveredIndex(null);
      }

      if (whyRef.current && !whyRef.current.contains(target)) {
        setIsWhyOpen(false);
      }

      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(target)
      ) {
        setIsLangOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !(target as HTMLElement).closest("[data-mobile-toggle]")
      ) {
        setIsMobileMenuOpen(false);
        setIsMobileSolutionsOpen(false);
        setIsMobileWhyOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSolutionsOpen(false);
        setIsWhyOpen(false);
        setHoveredIndex(null);
        setIsLangOpen(false);
        setIsMobileMenuOpen(false);
        setIsMobileSolutionsOpen(false);
        setIsMobileWhyOpen(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (whyCloseTimer.current) clearTimeout(whyCloseTimer.current);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!isWhyOpen) setIsWhyFeaturedHovered(false);
  }, [isWhyOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const closeWhyNow = () => setIsWhyOpen(false);
  const closeMobileAll = () => {
    setIsMobileWhyOpen(false);
    setIsMobileSolutionsOpen(false);
    setIsMobileMenuOpen(false);
  };

  const renderActionButtons = () => {
    return (
      <Link
        href="/get-started"
        style={{ backgroundColor: PRIMARY_COLOR }}
        className="group inline-flex items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        <T>Get Started</T>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-black transition-transform duration-200 group-hover:rotate-45"
        >
          →
        </span>
      </Link>
    );
  };

  return (
    <header
      className={`fixed left-0 right-0 z-50 mx-auto font-lufga transition-all duration-300 ease-in-out ${
        isScrolled
          ? "top-4 w-[calc(100%-2rem)] max-w-5xl rounded-full border border-white/10 bg-[#0a0a0a] px-6 py-3 sm:top-6"
          : "top-0 w-full max-w-7xl border border-transparent bg-transparent px-5 py-4 sm:px-8 md:py-5"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white"
          >
            {isScrolled ? (
              <div className="relative h-7 w-7 overflow-hidden">
                <Image
                  src="/medbrainers-logo.svg"
                  alt={productName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <MedbrainersLoader
                showText={false}
                size={32}
                fontUrl=""
                className=""
                tileColor={PRIMARY_COLOR}
              />
            )}

            <span>
              <T>{productName}</T>
              <span style={{ color: PRIMARY_COLOR }}>.</span>
            </span>
          </Link>

          <nav
            aria-label={t("Main")}
            className="hidden items-center gap-6 text-sm font-medium text-white md:flex"
          >
            <div
              ref={dropdownRef}
              onMouseEnter={openSolutions}
              onMouseLeave={closeSolutionsSoon}
            >
              <button
                type="button"
                onClick={() => {
                  setIsWhyOpen(false);
                  setIsSolutionsOpen(!isSolutionsOpen);
                }}
                aria-expanded={isSolutionsOpen}
                aria-haspopup="true"
                className="flex cursor-pointer items-center gap-1.5 py-1 text-white/85 transition-colors hover:text-white"
              >
                <span>
                  <T>Solutions</T>
                </span>
                <Chevron
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isSolutionsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSolutionsOpen && (
                <div className="absolute left-1/2 top-full z-50 w-[min(1040px,calc(100vw-2rem))] -translate-x-1/2 pt-3">
                  <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0d0d0f] p-3">
                    {/* Cells Section (110px height) */}
                    <div className="relative h-[110px] w-full overflow-hidden rounded-2xl bg-black/60 border border-white/10">
                      <Cells />
                    </div>

                    {/* Featured "All Solutions" (left) + solutions in 3 columns (right) */}
                    <div className="grid grid-cols-12 items-stretch gap-3">
                      {/* Featured card: View All Solutions (dark gradient) */}
                      <Link
                        href="/solutions"
                        onMouseEnter={() => setHoveredIndex(-1)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => {
                          setIsSolutionsOpen(false);
                          setHoveredIndex(null);
                        }}
                        style={{
                          background:
                            "linear-gradient(145deg, #1f1f24 0%, #151518 45%, #0d0d0f 100%)",
                        }}
                        className="group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] p-6 transition-colors hover:border-white/15"
                      >
                        {/* soft primary glow (top right) */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-45"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />
                        {/* subtle primary glow (bottom left) */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full opacity-10 blur-3xl transition-opacity duration-300 group-hover:opacity-25"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />

                        <div className="relative">
                          <span
                            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                          >
                            <T>Flagship</T>
                          </span>
                          <span className="mt-5 block text-2xl font-semibold leading-snug text-white">
                            <T>View All Solutions</T>
                          </span>
                          <span className="mt-2 block text-sm leading-snug text-white/65">
                            <T>
                              Explore our complete suite of healthcare software
                            </T>
                          </span>
                        </div>

                        <div className="relative mt-8 flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                            <T>Browse all</T>
                            <Arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </span>
                          {hoveredIndex === -1 && (
                            <div className="shrink-0">
                              <MedbrainersLoader
                                showText={false}
                                size={22}
                                fontUrl=""
                                className=""
                                tileColor={PRIMARY_COLOR}
                              />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* List: all solutions, 3 per row */}
                      <div className="col-span-9 grid auto-rows-fr grid-cols-3 gap-1 rounded-2xl border border-white/[0.07] bg-[#111113] p-2">
                        {solutionsItems.map((item, i) => {
                          const isHovered = hoveredIndex === i;
                          const isLast = i === solutionsItems.length - 1;
                          const remainder = solutionsItems.length % 3;
                          // Fill the final row so the grid ends evenly
                          const spanClass =
                            isLast && remainder === 1
                              ? "col-span-3"
                              : isLast && remainder === 2
                              ? "col-span-2"
                              : "";

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onMouseEnter={() => setHoveredIndex(i)}
                              onMouseLeave={() => setHoveredIndex(null)}
                              onClick={() => {
                                setIsSolutionsOpen(false);
                                setHoveredIndex(null);
                              }}
                              className={`group relative flex items-start justify-between gap-2 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.06] ${spanClass}`}
                            >
                              {/* left accent bar */}
                              <span
                                aria-hidden="true"
                                className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full transition-opacity duration-200 ${
                                  isHovered ? "opacity-100" : "opacity-0"
                                }`}
                                style={{ backgroundColor: PRIMARY_COLOR }}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="block text-[15px] font-semibold leading-snug text-white">
                                    <T>{item.title}</T>
                                  </span>
                                  {item.beta && <BetaBadge />}
                                </div>
                                <span className="mt-0.5 block text-[13px] leading-snug text-white/55">
                                  <T>{item.description}</T>
                                </span>
                              </div>

                              <Arrow className="mt-1 h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full-width View Pricing button */}
                    <Link
                      href="/pricing"
                      onClick={() => {
                        setIsSolutionsOpen(false);
                        setHoveredIndex(null);
                      }}
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      className="group flex w-full items-center justify-between rounded-2xl border border-transparent px-5 py-4 transition-opacity hover:opacity-90"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">
                          <T>View Pricing</T>
                        </span>
                        <span className="text-xs text-white/80">
                          <T>Find the right plan for your facility</T>
                        </span>
                      </div>
                      <Arrow className="h-4 w-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ---------------- Why Choose Us ---------------- */}
            <div
              ref={whyRef}
              onMouseEnter={openWhy}
              onMouseLeave={closeWhySoon}
            >
              <button
                type="button"
                onClick={() => {
                  setIsSolutionsOpen(false);
                  setIsWhyOpen(!isWhyOpen);
                }}
                aria-expanded={isWhyOpen}
                aria-haspopup="true"
                className="flex cursor-pointer items-center gap-1.5 py-1 text-white/85 transition-colors hover:text-white"
              >
                <span>
                  <T>Why Choose Us</T>
                </span>
                <Chevron
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isWhyOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isWhyOpen && (
                <div className="absolute left-1/2 top-full z-50 w-[min(1040px,calc(100vw-2rem))] -translate-x-1/2 pt-3">
                  <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0d0d0f] p-3">
                    {/* Cells Section (110px height) */}
                    <div className="relative h-[110px] w-full overflow-hidden rounded-2xl bg-black/60 border border-white/10">
                      <Cells />
                    </div>

                    {/* Featured card (left) + three link columns (right) */}
                    <div className="grid grid-cols-12 items-stretch gap-3">
                      <Link
                        href="/why-choose-us"
                        onMouseEnter={() => setIsWhyFeaturedHovered(true)}
                        onMouseLeave={() => setIsWhyFeaturedHovered(false)}
                        onClick={closeWhyNow}
                        style={{
                          background:
                            "linear-gradient(145deg, #1f1f24 0%, #151518 45%, #0d0d0f 100%)",
                        }}
                        className="group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] p-6 transition-colors hover:border-white/15"
                      >
                        {/* soft primary glow (top right) */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-45"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />
                        {/* subtle primary glow (bottom left) */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full opacity-10 blur-3xl transition-opacity duration-300 group-hover:opacity-25"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />

                        <div className="relative">
                          <span
                            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                          >
                            <T>Why Us</T>
                          </span>
                          <span className="mt-5 block text-2xl font-semibold leading-snug text-white">
                            <T>Why Choose</T> {productName}
                          </span>
                          <span className="mt-2 block text-sm leading-snug text-white/65">
                            <T>
                              Built for the way healthcare teams actually work
                            </T>
                          </span>
                        </div>

                        <div className="relative mt-8 flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                            <T>Learn more</T>
                            <Arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </span>
                          {isWhyFeaturedHovered && (
                            <div className="shrink-0">
                              <MedbrainersLoader
                                showText={false}
                                size={22}
                                fontUrl=""
                                className=""
                                tileColor={PRIMARY_COLOR}
                              />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Three columns of links */}
                      <div className="col-span-9 grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.07] bg-[#111113] p-2">
                        {whyColumns.map((col) => (
                          <div key={col.label} className="flex flex-col gap-0.5">
                            <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                              <T>{col.label}</T>
                            </div>
                            {col.items.map((item) => (
                              <WhyRow
                                key={item.href}
                                item={item}
                                onClick={closeWhyNow}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full-width Book a Demo button */}
                    <Link
                      href="/demo"
                      onClick={closeWhyNow}
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      className="group flex w-full items-center justify-between rounded-2xl border border-transparent px-5 py-4 transition-opacity hover:opacity-90"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">
                          <T>Book a Demo</T>
                        </span>
                        <span className="text-xs text-white/80">
                          <T>See the dashboard and patient workflow in action</T>
                        </span>
                      </div>
                      <Arrow className="h-4 w-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className="text-white/80 transition-colors hover:text-white"
            >
              <T>Pricing</T>
            </Link>

            <Link
              href="/blog"
              className="text-white/80 transition-colors hover:text-white"
            >
              <T>Blog</T>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen((prev) => !prev)}
              aria-expanded={isLangOpen}
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/95 hover:bg-white/15 transition-colors cursor-pointer"
            >
              <Flag locale={currentLocale} />
              <span>{localeMeta[currentLocale].name}</span>
              <Chevron
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isLangOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-[#0d0d0f] p-2 z-50 flex flex-col gap-1">
                <div className="px-3.5 py-1 text-[11px] font-semibold text-white/45 uppercase tracking-wider">
                  {t("Select Language")}
                </div>
                <div className="flex flex-col gap-1">
                  <LanguageSwitcher
                    onSelect={() => {
                      setIsLangOpen(false);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:block">{renderActionButtons()}</div>

          <button
            type="button"
            data-mobile-toggle
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              setIsMobileSolutionsOpen(false);
              setIsMobileWhyOpen(false);
            }}
            className="relative z-[60] cursor-pointer rounded-lg p-2.5 text-white transition-colors hover:bg-white/10 md:hidden"
            aria-label={t("Toggle Menu")}
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  isMobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute left-0 right-0 top-full z-[55] mt-3 flex max-h-[80vh] flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 md:hidden"
        >
          <button
            type="button"
            onClick={() => setIsMobileSolutionsOpen(!isMobileSolutionsOpen)}
            aria-expanded={isMobileSolutionsOpen}
            className="flex w-full items-center justify-between py-3 text-left text-base font-medium text-white"
          >
            <span>
              <T>Solutions</T>
            </span>
            <Chevron
              className={`h-4 w-4 transition-transform duration-200 ${
                isMobileSolutionsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMobileSolutionsOpen && (
            <div className="mb-2 ml-1 flex flex-col gap-1 border-l border-white/10 pl-3">
              <Link
                href="/solutions"
                onClick={closeMobileAll}
                style={{ backgroundColor: PRIMARY_COLOR }}
                className="flex items-center justify-between gap-2 py-3 px-4 mb-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                <span>
                  <T>View All Solutions</T>
                </span>
                <Arrow className="h-4 w-4 shrink-0 text-white" />
              </Link>

              {/* Mobile Cells Section */}
              <div className="relative h-[110px] w-full overflow-hidden rounded-xl bg-black/60 border border-white/10 mb-2">
                <Cells />
              </div>

              {solutionsItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileAll}
                  className="flex items-center justify-between gap-2 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <T>{item.title}</T>
                    {item.beta && <BetaBadge />}
                  </span>
                  <Arrow className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                </Link>
              ))}
            </div>
          )}

          {/* Mobile: Why Choose Us */}
          <button
            type="button"
            onClick={() => setIsMobileWhyOpen(!isMobileWhyOpen)}
            aria-expanded={isMobileWhyOpen}
            className="flex w-full items-center justify-between border-t border-white/10 py-3 text-left text-base font-medium text-white"
          >
            <span>
              <T>Why Choose Us</T>
            </span>
            <Chevron
              className={`h-4 w-4 transition-transform duration-200 ${
                isMobileWhyOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMobileWhyOpen && (
            <div className="mb-2 ml-1 flex flex-col gap-1 border-l border-white/10 pl-3">
              <Link
                href="/why-choose-us"
                onClick={closeMobileAll}
                style={{ backgroundColor: PRIMARY_COLOR }}
                className="mb-2 flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                <span>
                  <T>Why Choose</T> {productName}
                </span>
                <Arrow className="h-4 w-4 shrink-0 text-white" />
              </Link>

              <Link
                href="/demo"
                onClick={closeMobileAll}
                className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                <span>
                  <T>Book a Demo</T>
                </span>
                <Arrow className="h-4 w-4 shrink-0 text-white" />
              </Link>

              {/* Mobile Cells Section */}
              <div className="relative mb-2 h-[110px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/60">
                <Cells />
              </div>

              <span className="mt-1 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                <T>Why Us</T>
              </span>
              {whyUs.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileAll}
                  className="flex items-center justify-between gap-2 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <T>{item.title}</T>
                  <Arrow className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                </Link>
              ))}

              <span className="mt-3 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                <T>Your Facility Size</T>
              </span>
              {whyBySize.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileAll}
                  className="flex items-center justify-between gap-2 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <T>{item.title}</T>
                  <Arrow className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                </Link>
              ))}

              <span className="mt-3 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                <T>Your Facility Type</T>
              </span>
              {whyByType.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileAll}
                  className="flex items-center justify-between gap-2 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <T>{item.title}</T>
                  <Arrow className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="border-t border-white/10 py-3 text-base font-medium text-white"
          >
            <T>Pricing</T>
          </Link>

          <Link
            href="/blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className="border-t border-white/10 py-3 text-base font-medium text-white"
          >
            <T>Blog</T>
          </Link>

          <div className="mt-1 flex flex-col gap-2 border-t border-white/10 pt-4">
            <span className="text-xs font-semibold text-white/45 uppercase tracking-wider px-1">
              {t("Language")}
            </span>
            <div className="flex flex-col gap-1">
              <LanguageSwitcher
                onSelect={() => {
                  setIsLangOpen(false);
                  setIsMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            {renderActionButtons()}
          </div>
        </div>
      )}
    </header>
  );
}