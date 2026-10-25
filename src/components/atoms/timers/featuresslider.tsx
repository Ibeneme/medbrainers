"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRIMARY_COLOR } from "@/constants/colors";

gsap.registerPlugin(ScrollTrigger);

type FeatureSliderProps = {
  /* optional override: "en", "fr", "fr-FR"... If omitted, it is detected automatically */
  locale?: string;
  /* seconds for one full loop (higher = slower) */
  duration?: number;
  /* extra classes for the band, e.g. to change colours */
  className?: string;
  /* whether to show rough edges on top and bottom */
  roughEdges?: boolean;
};

type Lang = "en" | "fr";

/* ---------- EMR words (English + French) ---------- */
const EMR_FEATURES: { en: string; fr: string }[] = [
  { en: "Electronic Medical Records", fr: "Dossiers médicaux électroniques" },
  { en: "Patient Registration", fr: "Enregistrement des patients" },
  { en: "Appointment Scheduling", fr: "Prise de rendez-vous" },
  { en: "Clinical Notes", fr: "Notes cliniques" },
  { en: "e-Prescriptions", fr: "Ordonnances électroniques" },
  { en: "Lab & Imaging Results", fr: "Résultats de laboratoire et d’imagerie" },
  { en: "Medical History", fr: "Antécédents médicaux" },
  { en: "Billing & Insurance", fr: "Facturation et assurance" },
  { en: "Secure Patient Data", fr: "Données patients sécurisées" },
  { en: "Doctor Dashboard", fr: "Tableau de bord du médecin" },
  { en: "HIPAA Compliant", fr: "Conforme HIPAA" },
  {
    en: "Encrypted Client & Patient Data",
    fr: "Données clients et patients chiffrées",
  },
  { en: "AI Integration & Analysis", fr: "Intégration et analyse IA" },
];

const toLang = (value?: string | null): Lang =>
  value?.toLowerCase().startsWith("fr") ? "fr" : "en";

/* ---------- Torn paper edge path ---------- */
const EDGE_PATH =
  "M0 395V180L18 180L32 175L40 178L75 200L110 211L150 198L165 185L175 177L185 181L220 157L255 146L270 150L290 165L310 175L335 177L350 168L365 157L395 152L410 149L458 150L470 153L530 166L560 170L605 178L630 170L670 176L725 173L735 166L765 170L825 170L840 160L870 138L885 129L920 122L925 120L1400 120L1410 123L1430 121L1605 121L1620 125L1650 127L1665 127L1690 120L1710 120L1722 133L1740 130L1750 120L1915 120L1930 121L2335 121L2342 121L2323 172L2303 187L2320 196L2392 200L2430 193L2462 189L2485 197L2545 210L2576 206V395Z";

function RoughEdge({
  position,
  fillColor,
}: {
  position: "top" | "bottom";
  fillColor: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 2576 395"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-20 block h-10 w-full md:h-16 lg:h-20 ${
        position === "top" ? "-top-px rotate-180" : "-bottom-px"
      }`}
    >
      <path d={EDGE_PATH} fill={fillColor} />
    </svg>
  );
}

/* 8-spoke asterisk separator */
const Asterisk = () => (
  <svg
    className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none md:h-6 md:w-6"
    style={{ animationDuration: "10s" }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" />
  </svg>
);

export default function FeatureSlider({
  locale,
  duration = 30,
  className = "text-white",
  roughEdges = false,
}: FeatureSliderProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  /* ---------- locale detected inside the component ---------- */
  const params = useParams();
  const routeLocale =
    typeof params?.locale === "string" ? params.locale : undefined;

  const [htmlLang, setHtmlLang] = useState<string | undefined>(undefined);

  useEffect(() => {
    // read <html lang> and keep it in sync when the language switcher changes it
    const read = () => setHtmlLang(document.documentElement.lang || undefined);
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    return () => observer.disconnect();
  }, []);

  // priority: prop > /fr/... route > <html lang> > English
  const lang: Lang = toLang(locale ?? routeLocale ?? htmlLang);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Band fades in on scroll (plays once, never stays hidden)
      gsap.from(bandRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: {
          trigger: bandRef.current,
          start: "top 95%",
          once: true,
        },
      });

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (trackRef.current && !reduce) {
        // two identical copies: sliding by 50% and looping = seamless roll
        tweenRef.current = gsap.fromTo(
          trackRef.current,
          { xPercent: -50 },
          { xPercent: 0, duration, ease: "none", repeat: -1 }
        );
      }
    }, bandRef);

    const refresh = setTimeout(() => ScrollTrigger.refresh(), 100);

    return () => {
      clearTimeout(refresh);
      ctx.revert();
    };
  }, [duration]);

  const slow = () =>
    tweenRef.current &&
    gsap.to(tweenRef.current, { timeScale: 0.15, duration: 0.5 });
  const resume = () =>
    tweenRef.current &&
    gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5 });

  return (
    <div
      ref={bandRef}
      onMouseEnter={slow}
      onMouseLeave={resume}
      style={{ backgroundColor: PRIMARY_COLOR }}
      className={`relative w-full overflow-hidden py-5 md:py-6 ${className}`}
    >
      {roughEdges && <RoughEdge position="top" fillColor="#000" />}
      {roughEdges && <RoughEdge position="bottom" fillColor="#000" />}

      <div ref={trackRef} className="flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1}
          >
            {EMR_FEATURES.map((item) => (
              <div
                key={`${copy}-${item.en}`}
                className="flex shrink-0 items-center gap-8 pl-8 md:gap-14 md:pl-14"
              >
                <span className="whitespace-nowrap text-lg font-bold tracking-tight md:text-2xl">
                  {item[lang]}
                </span>
                <Asterisk />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
