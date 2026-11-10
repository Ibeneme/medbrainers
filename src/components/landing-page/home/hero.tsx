"use client";

import { PRIMARY_COLOR, OTHER_COLOR } from "@/constants/colors";
import React from "react";
import Link from "@/i18n/link";
import { useTheme } from "@/contexts/theme-context";
import { T, useT } from "@/i18n/provider";
import Image from "next/image";

const IMAGE_SRC = "/medbrainers-team.svg"; // put your photo in /public

export default function Hero() {
  const t = useT();
  useTheme();

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden pb-24 pt-32 font-lufga">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={IMAGE_SRC}
          alt="Background"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Dark overlay to soften the image and enhance contrast */}
      <div className="absolute inset-0 z-0 bg-black/70 pointer-events-none" />

      <div className="relative mt-14 z-10 max-w-7xl w-full mx-auto px-6 md:px-12 flex flex-col items-start text-left">
        <h1 className="text-5xl md:text-7xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl font-lufga text-white">
          <T>Your Modern Operating System for Healthcare (EMR)</T>
          <span style={{ color: PRIMARY_COLOR }}>.</span>
        </h1>
        <p className="mt-4 mb-8 text-lg md:text-xl max-w-2xl font-regular font-lufga text-white/65">
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
        <div className="mt-24 flex flex-wrap items-center gap-x-6 gap-y-3 py-6">
          {/* HIPAA Compliant */}
          <div className="flex items-center gap-3">
            <span className="text-sm md:text-base font-medium font-lufga text-neutral-300">
              <T>HIPAA Compliant</T>
            </span>
          </div>

          <span
            className="hidden sm:block h-1 w-1 rounded-full bg-white/40"
            aria-hidden="true"
          />

          {/* Encrypted Patient Data */}
          <div className="flex items-center gap-3">
            <span className="text-sm md:text-base font-medium font-lufga text-neutral-300">
              <T>Encrypted Client & Patient Data</T>
            </span>
          </div>

          <span
            className="hidden sm:block h-1 w-1 rounded-full bg-white/40"
            aria-hidden="true"
          />

          {/* AI Analysis */}
          <div className="flex items-center gap-3">
            <span className="text-sm md:text-base font-medium font-lufga text-neutral-300">
              <T>AI Integration & Analysis</T>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
