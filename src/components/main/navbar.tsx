"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useState, useEffect, useRef } from "react";
import Link from "@/i18n/link";
import LanguageSwitcher from "@/i18n/language-switcher";
import { Flag } from "@/i18n/flags";
import { localeMeta } from "@/i18n/config";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { T, useT, useLocale } from "@/i18n/provider";
import MedbrainersLoader from "../atoms/loaders/Medbrainersloader";
import { productName } from "@/constants/site";
import Cells from "../landing-page/home/dna/cells";

const solutionsItems: {
  title: string;
  description: string;
  href: string;
  beta?: boolean;
  purple?: boolean;
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
    purple: true,
  },
];

type WhyLinkItem = {
  title: string;
  description: string;
  href: string;
  purple?: boolean;
};

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
    purple: true,
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

const BetaBadge = ({ purple }: { purple?: boolean }) => (
  <span
    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
    style={{ backgroundColor: purple ? "#8B5CF6" : PRIMARY_COLOR }}
  >
    <T>{purple ? "New" : "Beta"}</T>
  </span>
);

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
    className="group relative flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06] sm:px-4 sm:py-3"
  >
    <span
      aria-hidden="true"
      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:h-6"
      style={{ backgroundColor: item.purple ? "#8B5CF6" : PRIMARY_COLOR }}
    />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="block text-sm font-semibold leading-snug text-white sm:text-[15px]">
          <T>{item.title}</T>
        </span>
        {item.purple && (
          <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-purple-500">
            <T>New</T>
          </span>
        )}
      </div>
      <span className="mt-0.5 block text-xs leading-snug text-white/55 sm:text-[13px]">
        <T>{item.description}</T>
      </span>
    </div>
    <Arrow className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-1 sm:mt-1 sm:h-4 sm:w-4" />
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
  const pathname = usePathname();
  const isHome =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/fr" ||
    pathname === "";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false);
  const [isMobileWhyOpen, setIsMobileWhyOpen] = useState(false);

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
    const handleScroll = () => setIsScrolled(window.scrollY > 40);

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

  const textColorClass = !isHome || isScrolled ? "text-white" : "text-black";
  const navItemColorClass =
    !isHome || isScrolled
      ? "text-white/85 hover:text-white"
      : "text-neutral-700 hover:text-black";

  const navbarContainerStyle = isScrolled
    ? "top-3 sm:top-4 max-w-6xl w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] rounded-full bg-black border border-white/15 text-white px-4 py-1 sm:px-5 sm:py-1 shadow-lg"
    : "top-3 max-w-7xl w-full bg-transparent border-b border-transparent shadow-none";

  const renderActionButtons = (compact = false) => (
    <Link
      href="/get-started"
      style={{ backgroundColor: PRIMARY_COLOR }}
      className={`group inline-flex items-center gap-2 rounded-full font-semibold text-white transition-transform hover:scale-105 ${
        compact
          ? "py-1.5 pl-4 pr-1.5 text-xs sm:gap-3 sm:py-1.5 sm:pl-5 sm:pr-1.5 sm:text-sm"
          : "py-1.5 pl-5 pr-1.5 text-sm"
      }`}
    >
      <T>Get Started</T>
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-full bg-white text-black transition-transform duration-200 group-hover:rotate-45 ${
          compact
            ? "h-7 w-7 text-xs sm:h-8 sm:w-8 sm:text-sm"
            : "h-8 w-8 text-sm"
        }`}
      >
        →
      </span>
    </Link>
  );

  return (
    <header
      className={`fixed left-0 right-0 z-50 mx-auto font-lufga transition-all duration-300 ease-in-out px-4 py-3 sm:px-6 sm:py-3 ${navbarContainerStyle}`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        {/* Logo + Desktop Nav */}
        <div className="flex min-w-0 items-center gap-4 lg:gap-7 xl:gap-8">
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight sm:gap-2.5 sm:text-xl transition-colors duration-300 ${textColorClass}`}
          >
            <div className="relative h-6 w-6 overflow-hidden sm:h-7 sm:w-7">
              <Image
                src="/medbrainers-logo.svg"
                alt={productName}
                fill
                className="object-cover"
              />
            </div>

            <span className="truncate">
              <T>{productName}</T>
              <span style={{ color: PRIMARY_COLOR }}>.</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label={t("Main")}
            className={`hidden items-center gap-4 text-sm font-medium lg:flex xl:gap-6 transition-colors duration-300 ${textColorClass}`}
          >
            {/* Solutions */}
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
                className={`flex cursor-pointer items-center gap-1.5 py-1 transition-colors ${navItemColorClass}`}
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
                <div className="absolute left-1/2 top-full z-50 w-[min(1040px,calc(100vw-1.5rem))] -translate-x-1/2 pt-3 sm:w-[min(1040px,calc(100vw-2rem))]">
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#0d0d0f] text-white p-2.5 sm:gap-3 sm:rounded-3xl sm:p-3 ">
                    <div className="relative h-[100px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 sm:h-[90px] sm:rounded-2xl">
                      <Cells />
                    </div>

                    <div className="grid grid-cols-1 items-stretch gap-2.5 sm:grid-cols-12 sm:gap-3">
                      {/* Featured card */}
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
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-colors hover:border-white/15 sm:col-span-3 sm:p-6"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-45"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />
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
                          <span className="mt-4 block text-xl font-semibold leading-snug text-white sm:mt-5 sm:text-2xl">
                            <T>Solutions</T>
                          </span>
                          <span className="mt-1.5 block text-sm leading-snug text-white/65">
                            <T>
                              Explore our complete suite of healthcare software
                            </T>
                          </span>
                        </div>

                        <div className="relative mt-6 flex items-center justify-between sm:mt-8">
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

                      {/* Solutions grid */}
                      <div className="grid auto-rows-fr grid-cols-1 gap-1 rounded-2xl border border-white/[0.07] bg-[#111113] p-1.5 sm:col-span-9 sm:grid-cols-2 sm:p-2 lg:grid-cols-3">
                        {solutionsItems.map((item, i) => {
                          const isHovered = hoveredIndex === i;
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
                              className="group relative flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06] sm:px-4 sm:py-3"
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-opacity duration-200 sm:h-6 ${
                                  isHovered ? "opacity-100" : "opacity-0"
                                }`}
                                style={{
                                  backgroundColor: item.purple
                                    ? "#8B5CF6"
                                    : PRIMARY_COLOR,
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="block text-sm font-semibold leading-snug text-white sm:text-[15px]">
                                    <T>{item.title}</T>
                                  </span>
                                  {item.beta && (
                                    <BetaBadge purple={item.purple} />
                                  )}
                                </div>
                                <span className="mt-0.5 block text-xs leading-snug text-white/55 sm:text-[13px]">
                                  <T>{item.description}</T>
                                </span>
                              </div>
                              <Arrow className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-1 sm:mt-1 sm:h-4 sm:w-4" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    <Link
                      href="/pricing"
                      onClick={() => {
                        setIsSolutionsOpen(false);
                        setHoveredIndex(null);
                      }}
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      className="group flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3.5 transition-opacity hover:opacity-90 sm:rounded-2xl sm:px-5 sm:py-4"
                    >
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-sm font-semibold text-white">
                          <T>View Pricing</T>
                        </span>
                        <span className="text-xs text-white/80">
                          <T>Find the right plan for your facility</T>
                        </span>
                      </div>
                      <Arrow className="h-4 w-4 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Why Choose Us */}
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
                className={`flex cursor-pointer items-center gap-1.5 py-1 transition-colors ${navItemColorClass}`}
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
                <div className="absolute left-1/2 top-full z-50 w-[min(1040px,calc(100vw-1.5rem))] -translate-x-1/2 pt-3 sm:w-[min(1040px,calc(100vw-2rem))]">
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#0d0d0f] text-white p-2.5 sm:gap-3 sm:rounded-3xl sm:p-3 ">
                    <div className="relative h-[100px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 sm:h-[90px] sm:rounded-2xl">
                      <Cells />
                    </div>

                    <div className="grid grid-cols-1 items-stretch gap-2.5 sm:grid-cols-12 sm:gap-3">
                      <Link
                        href="/why-choose-us"
                        onMouseEnter={() => setIsWhyFeaturedHovered(true)}
                        onMouseLeave={() => setIsWhyFeaturedHovered(false)}
                        onClick={closeWhyNow}
                        style={{
                          background:
                            "linear-gradient(145deg, #1f1f24 0%, #151518 45%, #0d0d0f 100%)",
                        }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-colors hover:border-white/15 sm:col-span-3 sm:p-6"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-45"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />
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
                          <span className="mt-4 block text-xl font-semibold leading-snug text-white sm:mt-5 sm:text-2xl">
                            <T>Why Choose</T> {productName}
                          </span>
                          <span className="mt-1.5 block text-sm leading-snug text-white/65">
                            <T>
                              Built for the way healthcare teams actually work
                            </T>
                          </span>
                        </div>

                        <div className="relative mt-6 flex items-center justify-between sm:mt-8">
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

                      <div className="grid grid-cols-1 gap-1 rounded-2xl border border-white/[0.07] bg-[#111113] p-1.5 sm:col-span-9 sm:grid-cols-2 sm:p-2 lg:grid-cols-3">
                        {whyColumns.map((col) => (
                          <div
                            key={col.label}
                            className="flex flex-col gap-0.5"
                          >
                            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-white/45 sm:px-4">
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

                    <Link
                      href="/demo"
                      onClick={closeWhyNow}
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      className="group flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3.5 transition-opacity hover:opacity-90 sm:rounded-2xl sm:px-5 sm:py-4"
                    >
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-sm font-semibold text-white">
                          <T>Book a Demo</T>
                        </span>
                        <span className="text-xs text-white/80">
                          <T>
                            See the dashboard and patient workflow in action
                          </T>
                        </span>
                      </div>
                      <Arrow className="h-4 w-4 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className={`transition-colors ${navItemColorClass}`}
            >
              <T>Pricing</T>
            </Link>

            <Link
              href="/blog"
              className={`transition-colors ${navItemColorClass}`}
            >
              <T>Blog</T>
            </Link>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          {/* Desktop Language Switcher Dropdown */}
          <div className="relative hidden lg:block" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen((prev) => !prev)}
              aria-expanded={isLangOpen}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                !isHome || isScrolled
                  ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  : "border-neutral-200 bg-neutral-100 text-black hover:bg-neutral-200"
              }`}
            >
              <Flag
                locale={currentLocale}
                className="h-4 w-5 rounded-sm object-cover shadow-sm"
              />
              <span>
                {localeMeta[currentLocale]?.nativeName ||
                  currentLocale.toUpperCase()}
              </span>
              <Chevron
                className={`h-3 w-3 transition-transform duration-200 ${
                  isLangOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-[#0d0d0f] p-2 shadow-xl">
                <LanguageSwitcher
                  onSelect={() => setIsLangOpen(false)}
                  className="flex flex-col gap-1"
                />
              </div>
            )}
          </div>

          <div className="hidden sm:block">{renderActionButtons(true)}</div>

          <button
            type="button"
            data-mobile-toggle
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              setIsMobileSolutionsOpen(false);
              setIsMobileWhyOpen(false);
            }}
            className={`relative z-[60] cursor-pointer rounded-lg p-2 transition-colors lg:hidden ${
              isScrolled
                ? "text-white hover:bg-white/10"
                : "text-black hover:bg-neutral-100"
            }`}
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

      {/* Mobile / Tablet menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute left-0 right-0 top-full z-[55] mt-2 flex max-h-[min(85vh,720px)] flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] text-white p-4 sm:mt-3 sm:p-5 lg:hidden"
        >
          {/* Solutions accordion */}
          <button
            type="button"
            onClick={() => setIsMobileSolutionsOpen(!isMobileSolutionsOpen)}
            aria-expanded={isMobileSolutionsOpen}
            className="flex w-full items-center justify-between py-3.5 text-left text-base font-medium text-white"
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
                className="mb-2 flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                <span>
                  <T>View All Solutions</T>
                </span>
                <Arrow className="h-4 w-4 shrink-0 text-white" />
              </Link>

              <div className="relative mb-2 h-[100px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 sm:h-[90px]">
                <Cells />
              </div>

              {solutionsItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileAll}
                  className="flex items-center justify-between gap-2 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <T>{item.title}</T>
                    {item.beta && <BetaBadge purple={item.purple} />}
                  </span>
                  <Arrow className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                </Link>
              ))}
            </div>
          )}

          {/* Why Choose Us accordion */}
          <button
            type="button"
            onClick={() => setIsMobileWhyOpen(!isMobileWhyOpen)}
            aria-expanded={isMobileWhyOpen}
            className="flex w-full items-center justify-between border-t border-white/10 py-3.5 text-left text-base font-medium text-white"
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

              <div className="relative mb-2 h-[100px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 sm:h-[90px]">
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
                  className="flex items-center justify-between gap-2 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <T>{item.title}</T>
                    {item.purple && (
                      <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-purple-500">
                        <T>New</T>
                      </span>
                    )}
                  </span>
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
                  className="flex items-center justify-between gap-2 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
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
                  className="flex items-center justify-between gap-2 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
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
            className="border-t border-white/10 py-3.5 text-base font-medium text-white"
          >
            <T>Pricing</T>
          </Link>

          <Link
            href="/blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className="border-t border-white/10 py-3.5 text-base font-medium text-white"
          >
            <T>Blog</T>
          </Link>

          {/* Mobile Language Switcher Section */}
          <div className="border-t border-white/15 pt-4 pb-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
              <T>Language</T>
            </span>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <LanguageSwitcher
                onSelect={() => setIsMobileMenuOpen(false)}
                className="flex flex-col gap-1"
              />
            </div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-4 sm:hidden">
            {renderActionButtons()}
          </div>
        </div>
      )}
    </header>
  );
}
