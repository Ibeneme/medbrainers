"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T } from "@/i18n/provider";
import { productName } from "@/constants/site";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

interface EMRFeatureCard {
  number: string;
  title: string;
  description: string;
  actionText: string;
}

const emrFeatures: EMRFeatureCard[] = [
  {
    number: "01",
    title: "Hospital Management System",
    description:
      "Comprehensive administration & coordination. Unify cross-departmental operations, billing, and resource planning on a single reliable platform.",
    actionText: "Explore hospital suite",
  },
  {
    number: "02",
    title: "Clinic Information System",
    description:
      "Scheduling, queue & practitioner tools. Optimize outpatient flow, reduce patient wait times, and empower clinicians with rapid scheduling interfaces.",
    actionText: "View clinic workflows",
  },
  {
    number: "03",
    title: "Electronic Medical Record (EMR)",
    description:
      "Clinical notes, vitals & patient history. Maintain comprehensive SOAP notes, vital tracking, and instant secure access to full longitudinal patient records.",
    actionText: "Discover EMR modules",
  },
  {
    number: "04",
    title: "Industry Clinic System",
    description:
      "Workplace health & occupational services. Tailored enterprise health modules for managing employee physicals, periodic assessments, and workplace injury logs.",
    actionText: "Explore occupational tools",
  },
  {
    number: "05",
    title: "Dental Clinic Management",
    description:
      "Specialized charts & graphical odontograms. Complete visual dental charting, treatment planning, and procedure tracking built specifically for dental practices.",
    actionText: "Check dental features",
  },
  {
    number: "06",
    title: "Pharmacy Management System",
    description:
      "Dispensing, stock alerts & prescriptions. Track inventory in real-time, automate stock warnings, and seamlessly process electronic prescriptions from clinicians.",
    actionText: "View pharmacy tools",
  },
  {
    number: "07",
    title: "Hospital Records Management",
    description:
      "Secure digital archiving & fast retrieval. High-speed document indexing, encrypted archiving, and compliance-grade data protection for legacy and current files.",
    actionText: "Learn about records",
  },
  {
    number: "08",
    title: "Operating Theatre Management",
    description:
      "Surgical checklists & real-time tracking. Manage surgical schedules, track theatre utilization, and enforce safety checklists with live operational updates.",
    actionText: "Explore theatre suite",
  },
];

export default function EnterpriseSupportSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.85;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
          },
        }
      );

      gsap.fromTo(
        gridRef.current?.children || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden border-b border-white/5 bg-black pb-[6rem] pt-[1rem] text-white"
    >
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start px-6 md:px-12">
        {/* Header */}
        <div ref={headerRef} className="mb-[5rem] max-w-4xl text-left">
          <h2 className=" font-semibold leading-[1.1] tracking-tight text-[#f3f4f6] text-4xl  sm:text-6xl md:text-7xl">
            <T>
              Built for every niche for modern
              healthcare
            </T>
            <span style={{ color: PRIMARY_COLOR }}>.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-neutral-300 md:text-xl">
            <T>
              From patient admission and electronic clinical records to
              specialized dental charting, theatre scheduling, and pharmacy
              dispensing, {productName} connects your entire care ecosystem into
              a single unified platform.
            </T>
          </p>

          <Link
            href="/solutions"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80"
            style={{ color: PRIMARY_COLOR }}
          >
            <T>View all solutions</T>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Mobile: horizontal scroll + arrows */}
        <div className="w-full md:hidden">
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {emrFeatures.map((card, index) => (
              <div
                key={index}
                data-card
                className="flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-white/10 bg-neutral-950 p-[2rem] shadow-none transition-all duration-300"
              >
                <div>
                  <div
                    className="mb-[1.5rem] flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-sm"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    {card.number}
                  </div>
                  <h3 className="mb-[0.75rem] text-xl font-bold tracking-tight text-white">
                    <T>{card.title}</T>
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-neutral-400">
                    <T>{card.description}</T>
                  </p>
                </div>
                <div className="mt-[2rem] flex items-center justify-between border-t border-white/5 pt-[1rem] text-xs text-neutral-400">
                  <span>
                    <T>{card.actionText}</T>
                  </span>
                  <span className="font-mono" style={{ color: PRIMARY_COLOR }}>
                    &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* arrows */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollLeft}
              aria-label="Previous"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition enabled:hover:border-white/30 enabled:hover:bg-white/10 disabled:opacity-30"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={!canScrollRight}
              aria-label="Next"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition enabled:hover:border-white/30 enabled:hover:bg-white/10 disabled:opacity-30"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop: grid */}
        <div
          ref={gridRef}
          className="hidden w-full grid-cols-1 gap-6 py-[1.5rem] md:grid md:grid-cols-2 lg:grid-cols-3"
        >
          {emrFeatures.map((card, index) => (
            <div
              key={index}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-950 p-[2rem] shadow-none transition-all duration-300 hover:border-white/20"
            >
              <div>
                <div
                  className="mb-[1.5rem] flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-sm"
                  style={{ color: PRIMARY_COLOR }}
                >
                  {card.number}
                </div>
                <h3 className="mb-[0.75rem] text-xl font-bold tracking-tight text-white">
                  <T>{card.title}</T>
                </h3>
                <p className="text-sm font-light leading-relaxed text-neutral-400">
                  <T>{card.description}</T>
                </p>
              </div>
              <div className="mt-[2rem] flex items-center justify-between border-t border-white/5 pt-[1rem] text-xs text-neutral-400 transition-colors group-hover:text-white">
                <span>
                  <T>{card.actionText}</T>
                </span>
                <span className="font-mono" style={{ color: PRIMARY_COLOR }}>
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
