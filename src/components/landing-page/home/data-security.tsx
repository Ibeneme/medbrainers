"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import { Art, type ArtName } from "@/components/atoms/art/isometric-art";
import { T } from "@/i18n/provider";
import { productName } from "@/constants/site";
import React, { useRef, useState, useEffect } from "react";

const FEATURES: { art: ArtName; title: string; body: string }[] = [
  {
    art: "records",
    title: "Zero-Access Architecture",
    body: "Your data is encrypted in transit and at rest. Not even our system administrators can view your patients’ medical files.",
  },
  {
    art: "hospital",
    title: "Strict Role Controls",
    body: "Granular permission levels ensure staff members only view the specific patient records required for their direct clinical duties.",
  },
  {
    art: "emr",
    title: "Compliance Ready",
    body: "Built to adhere to international medical data protection frameworks, safeguarding patient privacy at every single step.",
  },
];

/**
 * The rough, hand-cut edge from the reference image, traced as one path.
 * Black fill below the contour; stretched to the section's full width.
 * `top` flips it so the black hangs down from the top of the section.
 */
const EDGE_PATH =
  "M0 395V180L18 180L32 175L40 178L75 200L110 211L150 198L165 185L175 177L185 181L220 157L255 146L270 150L290 165L310 175L335 177L350 168L365 157L395 152L410 149L458 150L470 153L530 166L560 170L605 178L630 170L670 176L725 173L735 166L765 170L825 170L840 160L870 138L885 129L920 122L925 120L1400 120L1410 123L1430 121L1605 121L1620 125L1650 127L1665 127L1690 120L1710 120L1722 133L1740 130L1750 120L1915 120L1930 121L2335 121L2342 121L2323 172L2303 187L2320 196L2392 200L2430 193L2462 189L2485 197L2545 210L2576 206V395Z";

function RoughEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 2576 395"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 block h-14 w-full md:h-24 lg:h-32 ${
        position === "top" ? "-top-px rotate-180" : "-bottom-px"
      }`}
    >
      <path d={EDGE_PATH} fill="#000" />
    </svg>
  );
}

export default function DataSecurity() {
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

  return (
    <section className="relative w-full overflow-hidden bg-white py-32 text-black md:py-48 font-lufga">
      <RoughEdge position="top" />
      <RoughEdge position="bottom" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-left md:px-12">
        <div
          className="mb-6 inline-flex items-center px-3.5 py-1.5 text-base font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: "#000" }}
        >
          <T>Enterprise-Grade Security</T>
        </div>

        {/* Headline */}
        <h2
          style={{ lineHeight: 1 }}
          className="text-4xl md:text-6xl lg:text-7xl max-w-4xl text-left font-bold leading-tight tracking-tight"
        >
          <T>Your clients and patients data are</T>{" "}
          <span style={{ color: PRIMARY_COLOR }}>
            <T>end-to-end encrypted.</T>
          </span>{" "}
        </h2>

        {/* Description */}
        <p className="mt-6 max-w-4xl text-left text-base font-regular leading-relaxed text-black/70 md:text-lg">
          <T>At {productName}</T>
          <T>
            , we treat patient confidentiality as sacred. All records, clinical
            notes, and health data are secured with military-grade encryption.
            They cannot be read, accessed, or looked up by anyone outside your
            authorized care team.
          </T>
        </p>

        {/* Mobile: Horizontal scroll with arrow controls */}
        <div className="mt-12 md:hidden">
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                data-card
                className="flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col items-start rounded-2xl border border-white/10 bg-black p-6 text-left"
              >
                <div className="mb-6 h-52 w-full rounded-xl border border-white/10 p-4">
                  <Art name={f.art} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  <T>{f.title}</T>
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  <T>{f.body}</T>
                </p>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollLeft}
              aria-label="Previous"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-black/5 text-black transition enabled:hover:border-black/30 enabled:hover:bg-black/10 disabled:opacity-30"
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-black/5 text-black transition enabled:hover:border-black/30 enabled:hover:bg-black/10 disabled:opacity-30"
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

        {/* Desktop: Standard Grid */}
        <div className="mt-12 hidden grid-cols-1 gap-6 text-left md:grid md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-start rounded-2xl border border-white/10 bg-black p-6 text-left"
            >
              <div className="mb-6 h-52 w-full rounded-xl border border-white/10 p-4">
                <Art name={f.art} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                <T>{f.title}</T>
              </h3>
              <p className="text-sm leading-relaxed text-white/60">
                <T>{f.body}</T>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
