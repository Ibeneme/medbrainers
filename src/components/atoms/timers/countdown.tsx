"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useEffect, useState } from "react";
import { T } from "@/i18n/provider";

/* Fixed launch date: 14 days from Oct 20, 2026 (WAT, UTC+1) */
const LAUNCH_DATE = new Date("2026-11-05T00:00:00+01:00").getTime();

const getTimeLeft = () => {
  const diff = Math.max(0, LAUNCH_DATE - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const pad = (n: number) => String(n).padStart(2, "0");

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

export default function Countdown() {
  // null on first render avoids a server/client hydration mismatch
  const [left, setLeft] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    setLeft(getTimeLeft());
    const id = setInterval(() => setLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units: { label: string; value: string; active?: boolean }[] = [
    { label: "Hours", value: left ? pad(left.hours) : "--" },
    { label: "Minutes", value: left ? pad(left.minutes) : "--" },
    { label: "Seconds", value: left ? pad(left.seconds) : "--", active: true },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-white py-24 text-black md:py-32 font-lufga">
      <RoughEdge position="top" />
      {/* <RoughEdge position="bottom" /> */}

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p
          style={{ color: PRIMARY_COLOR }}
          className="mb-8 text-sm font-semibold uppercase tracking-[0.35em] sm:text-base md:mb-12 md:text-xl"
        >
          <T>Coming Soon</T>
        </p>

        {/* ---------- Big day count + "Days To Go" ---------- */}
        <div
          className={`flex items-end justify-center gap-3 transition-opacity duration-500 sm:gap-5 md:gap-6 ${
            left ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="font-mono text-[40vw] font-bold leading-none tracking-tight text-black sm:text-[40vw] md:text-[32vw] lg:text-[200px]">
            {pad(left?.days ?? 0)}
          </span>
          <p className="mb-[1.5vw] w-min text-left text-3xl font-semibold capitalize leading-[0.95] tracking-tight text-black sm:text-[5vw] md:mb-3 md:text-3xl lg:text-3xl">
            <T>Days to go</T>
          </p>
        </div>

        {/* Hand-drawn style arrow pointing up at the count */}
        <svg
          aria-hidden
          viewBox="0 0 80 50"
          fill="none"
          stroke={PRIMARY_COLOR}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mt-6 h-10 w-16 md:mt-10 md:h-12 md:w-20"
        >
          <path d="M70 46 C 40 48, 14 38, 14 18 C 14 8, 30 6, 32 16 C 34 26, 18 28, 14 14" />
          <path d="M6 22 L14 12 L22 20" />
        </svg>

        {/* ---------- Joined tiles, active one pops out ---------- */}
        <div className="mx-auto mt-4 grid max-w-3xl grid-cols-3 items-center md:mt-6">
          {units.map(({ label, value, active }) => (
            <div
              key={label}
              style={active ? undefined : { backgroundColor: PRIMARY_COLOR }}
              className={`-ml-px flex flex-col first:ml-0 first:rounded-l-xl last:rounded-r-xl md:first:rounded-l-2xl md:last:rounded-r-2xl ${
                active
                  ? "relative z-10 rounded-xl border border-black/10 bg-black text-white md:rounded-2xl shadow-xl"
                  : "border border-white/25 text-white"
              }`}
            >
              <span
                className={`border-b px-2 font-lufga text-xs font-semibold uppercase tracking-wider sm:text-sm md:text-lg ${
                  active
                    ? "border-white/20 py-3 md:py-5 bg-white text-black rounded-t-xl md:rounded-t-2xl"
                    : "border-white/25 py-2 md:py-4"
                }`}
              >
                <T>{label}</T>
              </span>
              <span
                className={`font-mono text-[11vw] font-bold leading-none tabular-nums sm:text-[9vw] md:text-[6vw] lg:text-8xl ${
                  active
                    ? "py-6 md:py-10 bg-white text-black rounded-b-xl md:rounded-b-2xl"
                    : "py-4 md:py-7"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
