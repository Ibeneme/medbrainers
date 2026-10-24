"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T } from "@/i18n/provider";
import FeatureSlider from "@/components/atoms/timers/featuresslider";
import MedbrainersLoader from "@/components/atoms/loaders/Medbrainersloader";
import { productName } from "@/constants/site";

gsap.registerPlugin(ScrollTrigger);

export const features: string[] = [
  "Extensive Hospital Network",
  "Affordable Health Plans",
  "24/7 Customer Support",
  "Fast Claims Processing",
  "Preventive & Wellness Programs",
];

export default function IntegrationsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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
          scrollTrigger: { trigger: headerRef.current, start: "top 85%" },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black py-16 text-white md:py-24"
    >
      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div ref={headerRef} className="mb-10 md:mb-14">
          {/* <MedbrainersLoader
            showText={false}
            size={220}
            fontUrl=""
            className="mb-[120px] mt-[48px]"
          /> */}
          <span
            className="mb-2 block text-xs font-semibold uppercase tracking-widest"
            style={{ color: PRIMARY_COLOR }}
          >
            <T>Why {productName}</T>
          </span>
          <h3 className="max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.1]">
            <T>Designed for excellence across every clinical tier</T>
            <span style={{ color: PRIMARY_COLOR }}>.</span>
          </h3>
        </div>
      </div>

      {/* Solid full-width sliding band */}
      <FeatureSlider />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <p className="mt-10 max-w-lg text-sm text-white/40 md:text-base">
          <T>
            Empowering healthcare providers and patients with reliable,
            connected infrastructure.
          </T>
        </p>
      </div>
    </section>
  );
}
