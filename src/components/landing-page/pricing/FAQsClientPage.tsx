"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { faqData } from "./faq-data";
import { mailto, productName } from "@/constants/site";
import { T, useT } from "@/i18n/provider";

const ACCENT = PRIMARY_COLOR; // brand primary (from constants/colors.ts)

/* 12-point burst graphic */
const burstPath = (() => {
  const points = 12;
  const outer = 11;
  const inner = 8.4;
  const c = 12;
  return (
    Array.from({ length: points * 2 }, (_, i) => {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / points - Math.PI / 2;
      return `${i === 0 ? "M" : "L"}${(c + r * Math.cos(a)).toFixed(2)} ${(
        c +
        r * Math.sin(a)
      ).toFixed(2)}`;
    }).join("") + "Z"
  );
})();

const Burst: React.FC<{ className?: string; spin?: boolean }> = ({
  className,
  spin = false,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      animate={spin && !reduce ? { rotate: 360 } : undefined}
      transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
    >
      <path d={burstPath} />
    </motion.svg>
  );
};

/* ---------- Torn paper edge path ---------- */
const EDGE_PATH =
  "M0 395V180L18 180L32 175L40 178L75 200L110 211L150 198L165 185L175 177L185 181L220 157L255 146L270 150L290 165L310 175L335 177L350 168L365 157L395 152L410 149L458 150L470 153L530 166L560 170L605 178L630 170L670 176L725 173L735 166L765 170L825 170L840 160L870 138L885 129L920 122L925 120L1400 120L1410 123L1430 121L1605 121L1620 125L1650 127L1665 127L1690 120L1710 120L1722 133L1740 130L1750 120L1915 120L1930 121L2335 121L2342 121L2323 172L2303 187L2320 196L2392 200L2430 193L2462 189L2485 197L2545 210L2576 206V395Z";

function RoughEdgeTop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 2576 395"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 -top-px z-20 block h-14 w-full rotate-180 md:h-24 lg:h-32"
    >
      <path d={EDGE_PATH} fill="#000" />
    </svg>
  );
}

export default function FAQsClientPage() {
  const t = useT();
  const [activeId, setActiveId] = useState<string>(faqData[0].id);
  const active = faqData.find((f) => f.id === activeId) ?? faqData[0];

  const select = (id: string) => {
    setActiveId(id);
  };

  return (
    <section
      style={{
        backgroundColor: "#fff",
        color: "#000000",
      }}
      className="relative min-h-[85vh] w-full bg-white px-4 pb-20 pt-32 font-['Lufga'] text-black sm:px-6 md:pt-40 lg:px-8 selection:bg-[var(--accent)] selection:text-white"
    >
      <RoughEdgeTop />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="mb-12 text-6xl font-black leading-none tracking-tight sm:text-8xl text-black"
        >
          <T>FAQs</T>
          <span style={{ color: ACCENT }}>.</span>
        </motion.h1>

        {/* DESKTOP VIEW: 2 Columns (Left: List, Right: Sticky Answer) */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-x-14">
          {/* LEFT: questions list */}
          <div
            role="list"
            className="flex h-[640px] flex-col gap-3 overflow-y-auto pr-4 [scrollbar-width:thin] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-black/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar]:w-2.5"
          >
            {faqData.map((faq, i) => {
              const isActive = faq.id === activeId;
              return (
                <motion.button
                  key={faq.id}
                  role="listitem"
                  type="button"
                  onClick={() => select(faq.id)}
                  aria-current={isActive}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(i, 8), duration: 0.35 }}
                  className={`flex w-full shrink-0 items-center justify-between rounded-xl border px-6 py-6 text-left text-base font-bold tracking-tight transition-all duration-200 sm:text-lg ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-neutral-50 text-black/80 hover:border-black/30 hover:bg-neutral-100"
                  }`}
                >
                  <span className="pr-4">
                    <T>{faq.question}</T>
                  </span>
                  {isActive && (
                    <span className="shrink-0" style={{ color: ACCENT }}>
                      <Burst className="h-6 w-6" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* RIGHT: persistent desktop answer card */}
          <div>
            <div
              className="flex h-[640px] min-h-[380px] flex-col justify-between rounded-[28px] p-8 text-white sm:p-12 shadow-sm"
              style={{ backgroundColor: ACCENT }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                >
                  <Burst className="mb-8 h-9 w-9 shrink-0 text-white" spin />
                  <p className="text-xl font-medium leading-relaxed sm:text-3xl sm:leading-snug text-white">
                    <T>{active.answer}</T>
                  </p>
                </motion.div>
              </AnimatePresence>

              <a
                href={mailto("support", t(`${productName} Software Inquiry`))}
                className="mt-8 inline-flex items-center self-start rounded-full border-[3px] border-black bg-black px-6 py-3.5 text-sm font-black text-white transition-transform hover:-translate-y-0.5 sm:text-base"
              >
                <T>Still have questions? Chat with our care team</T>
              </a>
            </div>
          </div>
        </div>

        {/* MOBILE & TABLET VIEW: Accordion */}
        <div className="flex flex-col gap-3 lg:hidden" role="list">
          {faqData.map((faq, i) => {
            const isActive = faq.id === activeId;
            return (
              <div key={faq.id} className="flex flex-col gap-3">
                <motion.button
                  role="listitem"
                  type="button"
                  onClick={() => select(faq.id)}
                  aria-current={isActive}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(i, 8), duration: 0.35 }}
                  className={`flex w-full items-center justify-between rounded-xl border px-6 py-6 text-left text-base font-bold tracking-tight transition-all duration-200 sm:text-lg ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-neutral-50 text-black/80 hover:border-black/30 hover:bg-neutral-100"
                  }`}
                >
                  <span className="pr-4">
                    <T>{faq.question}</T>
                  </span>
                  {isActive && (
                    <span className="shrink-0" style={{ color: ACCENT }}>
                      <Burst className="h-6 w-6" />
                    </span>
                  )}
                </motion.button>

                {/* Mobile Dropdown Answer */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className="flex flex-col justify-between rounded-[24px] p-6 text-white sm:p-8 shadow-sm"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <div>
                          <Burst
                            className="mb-6 h-8 w-8 shrink-0 text-white"
                            spin
                          />
                          <p className="text-lg font-medium leading-relaxed sm:text-2xl sm:leading-snug text-white">
                            <T>{faq.answer}</T>
                          </p>
                        </div>

                        <a
                          href={mailto(
                            "support",
                            t(`${productName} Software Inquiry`)
                          )}
                          className="mt-8 inline-flex items-center self-start rounded-full border-[3px] border-black bg-black px-6 py-3 text-sm font-black text-white transition-transform hover:-translate-y-0.5 sm:text-base"
                        >
                          <T>Still have questions? Chat with our care team</T>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
