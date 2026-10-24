"use client";

import { PRIMARY_COLOR, OTHER_COLOR } from "@/constants/colors";
import React from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import { useTheme } from "@/contexts/theme-context";
import heroSvg from "../../../../public/assets/landing-page-images/home/hero_a.svg";
import { T, useT } from "@/i18n/provider";
import Cells from "./dna/cells";

export default function Hero() {
  const t = useT();
  useTheme();

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden bg-[#000] pb-24 pt-32 font-lufga">
      {/* Background Image Container with SVG Hero, Cells, Fine Radial Gradient Aura & Noise Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroSvg}
          alt={t("MedBrainers EMR Hero background")}
          fill
          priority
          className="object-cover object-center transition-opacity duration-700 opacity-50"
          style={{
            filter: "brightness(0.45) contrast(1.3)",
          }}
        />

        {/* Animated Bacteria & Spores Cells Component */}
        {/* <Cells /> */}

        {/* SVG Film Grain / Noise Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.22] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Bottom / Overall Readability Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.9) 100%)",
          }}
        />
      </div>

      {/* Hero Bottom-Left Content */}
      <div className="relative mt-24 z-10 max-w-7xl w-full mx-auto px-6 md:px-12 flex flex-col items-start text-left">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl font-lufga"
          style={{ color: "#ffffff" }}
        >
          <T>
            The intelligent electronic medical records platform for modern
            healthcare
          </T>
          <span style={{ color: PRIMARY_COLOR }}>.</span>
        </h1>
        <p className="mt-6 mb-8 text-lg md:text-xl max-w-2xl font-light opacity-90 text-white/70 font-lufga">
          <T>
            Empower your care team and administration with unified clinical
            notes, dynamic billing & HMO management, automated lab and pharmacy
            workflows, and real-time ward tracking.
          </T>
        </p>

        {/* Action Button */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/get-started"
            style={{ backgroundColor: PRIMARY_COLOR }}
            className="group inline-flex items-center gap-3 rounded-full py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105 font-lufga"
          >
            <T>Get Started</T>
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
            >
              →
            </span>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="mt-24 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-b border-white/15 py-6">
          {/* HIPAA Compliant */}
          <div className="flex items-center gap-3">
            <span
              className="text-sm md:text-base font-light font-lufga"
              style={{ color: OTHER_COLOR }}
            >
              <T>HIPAA Compliant</T>
            </span>
          </div>

          <span
            className="hidden sm:block h-1 w-1 rounded-full bg-white/30"
            aria-hidden="true"
          />

          {/* Encrypted Patient Data */}
          <div className="flex items-center gap-3">
            <span
              className="text-sm md:text-base font-light font-lufga"
              style={{ color: OTHER_COLOR }}
            >
              <T>Encrypted Client & Patient Data</T>
            </span>
          </div>

          <span
            className="hidden sm:block h-1 w-1 rounded-full bg-white/30"
            aria-hidden="true"
          />

          {/* AI Analysis */}
          <div className="flex items-center gap-3">
            <span
              className="text-sm md:text-base font-light font-lufga"
              style={{ color: OTHER_COLOR }}
            >
              <T>AI Integration & Analysis</T>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
