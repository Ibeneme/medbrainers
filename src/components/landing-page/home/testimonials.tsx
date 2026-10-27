"use client";

import {
  PRIMARY_COLOR,
  PRIMARY_DEEP,
  PRIMARY_DEEP_HOVER,
  PRIMARY_LIGHT,
} from "@/constants/colors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T, useT } from "@/i18n/provider";
import { productName } from "@/constants/site";
import VirusField from "./dna/virus";

gsap.registerPlugin(ScrollTrigger);

type Hair = "short" | "bun" | "afro";
type Accessory = "stethoscope" | "badge";

type Avatar = {
  bg: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: Hair;
  coat: string;
  scrubs: string;
  accessory: Accessory;
};

/* ---------- Edit these ----------
   SAMPLE clients and hospitals (all fictional). Swap in real ones later.
   To use a real photo, drop it in /public and set `photo`
   (e.g. "/clients/amaka.jpg"); it replaces the illustrated portrait. */
const testimonials: {
  name: string;
  role: string;
  quote: string;
  photo?: string;
  avatar: Avatar;
}[] = [
  // {
  //   name: "Dr. Adaeze Okoro",
  //   role: "Medical Director, Bluewater Specialist Hospital",
  //   quote:
  //     "Our front desk, pharmacy and wards finally work from one system. Patient wait times dropped and our records are always up to date.",
  //   avatar: {
  //     bg: PRIMARY_DEEP,
  //     skin: "#8d5524",
  //     skinShade: "#7a4a1f",
  //     hair: "#1a1412",
  //     hairStyle: "afro",
  //     coat: "#ffffff",
  //     scrubs: "#14b8a6",
  //     accessory: "stethoscope",
  //   },
  // },
  {
    name: "Ibrahim Danjuma",
    role: "Operations Manager, Palmgrove Family Clinic",
    quote:
      "Claims that used to take days now move through in hours. The team feels in control of billing for the first time.",
    avatar: {
      bg: PRIMARY_DEEP_HOVER,
      skin: "#6b3e26",
      skinShade: "#5a321e",
      hair: "#0f0d0c",
      hairStyle: "short",
      coat: "#e0e7ff",
      scrubs: PRIMARY_COLOR,
      accessory: "badge",
    },
  },
  {
    name: "Dr. Chioma Nwachukwu",
    role: "Head of Pharmacy, St. Nicholas Medical Centre",
    quote:
      "Inventory tracking has eliminated stockouts across our branches. Stock audits now take minutes instead of an entire weekend.",
    avatar: {
      bg: "#1e293b",
      skin: "#c68642",
      skinShade: "#a06832",
      hair: "#0f172a",
      hairStyle: "bun",
      coat: "#ffffff",
      scrubs: "#10b981",
      accessory: "badge",
    },
  },
  {
    name: "Dr. Babatunde Folorunsho",
    role: "Chief Medical Officer, Apex Health System",
    quote: `${productName} helped us digitize 10+ years of paper records effortlessly. Our doctors can pull up patient histories in seconds.`,
    avatar: {
      bg: PRIMARY_DEEP,
      skin: "#8d5524",
      skinShade: "#6e3f17",
      hair: "#111827",
      hairStyle: "short",
      coat: "#f1f5f9",
      scrubs: PRIMARY_LIGHT,
      accessory: "stethoscope",
    },
  },
];
/* -------------------------------- */

const QuoteMark = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M10 6H5a2 2 0 00-2 2v5a2 2 0 002 2h3a3 3 0 01-3 3v2a5 5 0 005-5V6zm11 0h-5a2 2 0 00-2 2v5a2 2 0 002 2h3a3 3 0 01-3 3v2a5 5 0 005-5V6z" />
  </svg>
);

/* ---------- Encrypted / decrypting text ---------- */
const SCRAMBLE_CHARS = "ABCDEF0123456789#$%&*+<>/\\=?@";

function EncryptedText({
  text,
  className = "",
  duration = 1900,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const hasPlayed = useRef(false);

  // Deterministic first render (avoids hydration mismatch): every letter shown as "0"
  const [state, setState] = useState<{ chars: string; revealed: number }>({
    chars: text.replace(/\S/g, "0"),
    revealed: 0,
  });

  const run = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState({ chars: text, revealed: text.length });
      return;
    }

    const start = performance.now();
    let lastTick = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(progress * text.length);

      // Re-roll random glyphs ~25 times per second for a readable flicker
      if (now - lastTick > 40 || progress === 1) {
        lastTick = now;
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " " || i < revealed) out += ch;
          else
            out +=
              SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        setState({ chars: out, revealed });
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setState({ chars: text, revealed: text.length });
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [text, duration]);

  // Play once when scrolled into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    hasPlayed.current = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          run();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [run]);

  // Split into words so lines wrap between words, never inside them
  let offset = 0;
  const words = state.chars.split(" ").map((word) => {
    const startIdx = offset;
    offset += word.length + 1;
    return { word, startIdx };
  });

  return (
    <span
      ref={ref}
      aria-label={text}
      onClick={run}
      className={`select-none ${className}`}
    >
      <span aria-hidden="true">
        {words.map(({ word, startIdx }, wi) => (
          <React.Fragment key={wi}>
            <span className="inline-block whitespace-nowrap">
              {word.split("").map((ch, ci) => {
                const done = startIdx + ci < state.revealed;
                return (
                  <span
                    key={ci}
                    style={
                      done ? undefined : { color: PRIMARY_COLOR, opacity: 0.85 }
                    }
                    className="transition-colors duration-150"
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}

/* Flat illustrated portrait */
const Portrait = ({ a }: { a: Avatar }) => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 300 340"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
  >
    <rect width="300" height="340" fill={a.bg} />
    <circle cx="150" cy="170" r="120" fill={PRIMARY_COLOR} opacity="0.18" />
    <circle cx="238" cy="60" r="10" fill="#fff" opacity="0.5" />
    <circle cx="52" cy="96" r="6" fill="#fff" opacity="0.35" />

    {a.hairStyle === "afro" && (
      <circle cx="150" cy="118" r="70" fill={a.hair} />
    )}

    <path d="M24 340c0-72 50-112 126-112s126 40 126 112z" fill={a.coat} />
    <path d="M118 230l32 66 32-66z" fill={a.scrubs} />
    <path
      d="M110 228l40 74-8-74zM190 228l-40 74 8-74z"
      fill="#cbd5e1"
      opacity="0.7"
    />

    <rect x="130" y="188" width="40" height="52" rx="16" fill={a.skinShade} />
    <circle cx="102" cy="154" r="9" fill={a.skin} />
    <circle cx="198" cy="154" r="9" fill={a.skin} />
    <ellipse cx="150" cy="150" rx="48" ry="56" fill={a.skin} />

    {a.hairStyle !== "afro" && (
      <path
        d="M100 142c-5-52 22-74 50-74s55 22 50 74c-10-24-30-36-50-36s-40 12-50 36z"
        fill={a.hair}
      />
    )}
    {a.hairStyle === "bun" && <circle cx="150" cy="62" r="20" fill={a.hair} />}
    {a.hairStyle === "afro" && (
      <path
        d="M104 140c4-30 24-44 46-44s42 14 46 44c-12-18-28-26-46-26s-34 8-46 26z"
        fill={a.hair}
      />
    )}

    <circle cx="130" cy="154" r="5" fill="#111827" />
    <circle cx="170" cy="154" r="5" fill="#111827" />
    <path
      d="M120 140q10-6 20 0M160 140q10-6 20 0"
      stroke="#111827"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M150 158v14"
      stroke="#000"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.18"
    />
    <path
      d="M132 180q18 16 36 0"
      stroke="#111827"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="112" cy="174" r="7" fill="#f472b6" opacity="0.25" />
    <circle cx="188" cy="174" r="7" fill="#f472b6" opacity="0.25" />

    {a.accessory === "stethoscope" && (
      <>
        <path
          d="M112 236c-12 32 4 58 38 58s50-26 38-58"
          stroke="#334155"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="150" cy="296" r="10" fill="#94a3b8" />
        <circle cx="150" cy="296" r="4" fill="#475569" />
      </>
    )}
    {a.accessory === "badge" && (
      <>
        <path
          d="M130 232l12 36M170 232l-12 36"
          stroke={PRIMARY_COLOR}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect x="128" y="266" width="44" height="56" rx="6" fill="#fff" />
        <rect
          x="128"
          y="266"
          width="44"
          height="14"
          rx="6"
          fill={PRIMARY_COLOR}
        />
        <circle cx="150" cy="292" r="8" fill="#cbd5e1" />
        <rect x="136" y="306" width="28" height="5" rx="2.5" fill="#cbd5e1" />
      </>
    )}
  </svg>
);

const PhotoCard = ({
  name,
  role,
  photo,
  avatar,
}: {
  name: string;
  role: string;
  photo?: string;
  avatar: Avatar;
}) => (
  <div
    data-card
    className="group relative h-[340px] overflow-hidden rounded-3xl bg-[#151518]"
  >
    {photo ? (
      <Image
        src={photo}
        alt={name}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
    ) : (
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
        <Portrait a={avatar} />
      </div>
    )}
    <div className="absolute bottom-4 left-4 rounded-full bg-black/75 px-4 py-2">
      <span className="block text-sm font-semibold leading-tight text-white">
        {name}
      </span>
      <span className="block text-[11px] leading-tight text-white/60">
        <T>{role}</T>
      </span>
    </div>
  </div>
);

const QuoteCard = ({
  quote,
  name,
  role,
  highlight = false,
  className = "",
}: {
  quote: string;
  name: string;
  role: string;
  highlight?: boolean;
  className?: string;
}) => (
  <div
    data-card
    style={
      highlight
        ? { backgroundColor: PRIMARY_COLOR, color: "#ffffff" }
        : undefined
    }
    className={`flex h-[340px] flex-col justify-between rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 ${
      highlight ? "" : "border border-white/10 bg-[#151518] text-white"
    } ${className}`}
  >
    <div
      style={
        highlight
          ? { backgroundColor: "#ffffff", color: PRIMARY_COLOR }
          : { backgroundColor: PRIMARY_COLOR, color: "#ffffff" }
      }
      className="flex h-9 w-9 items-center justify-center rounded-full"
    >
      <QuoteMark />
    </div>

    <p
      className={`text-base leading-relaxed md:text-lg ${
        highlight ? "text-white" : "text-white/85"
      }`}
    >
      <T>{quote}</T>
    </p>

    <div>
      <span className="block text-sm font-semibold">{name}</span>
      <span
        className={`block text-xs ${
          highlight ? "text-white/75" : "text-white/50"
        }`}
      >
        <T>{role}</T>
      </span>
    </div>
  </div>
);

export default function Testimonials() {
  const t = useT();
  const rootRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(introRef.current?.children || [], {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: introRef.current, start: "top 85%" },
      });

      gsap.from(gridRef.current?.querySelectorAll("[data-card]") || [], {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 88%" },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden bg-black text-white"
    >
      {/*     <div className="relative my-[24px] mx-[0px] h-[350px] w-[calc(100%-48px)] overflow-hidden  bg-black">
        <VirusField />


        <div
          className="absolute bottom-6 left-6 right-6 md:left-12 md:right-12 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 rounded-2xl shadow-xl"
          style={{
            backgroundColor: PRIMARY_COLOR,
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <p className="text-sm md:text-base font-medium text-white">
              <T>
                Every patient record is end-to-end encrypted and secured in
                transit and at rest.
              </T>
            </p>
          </div>
        </div>
      </div>
 */}
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-12">
        {/* Intro */}
        <div
          ref={introRef}
          className="grid gap-8 md:grid-cols-[1fr_3fr] md:gap-12"
        >
          <span className="flex items-center gap-2 self-start pt-2 text-3xl text-white/60">
            <T>Testimonials</T>
          </span>

          <div>
            <h2 className="text-3xl font-medium leading-[1.15] tracking-tight md:text-5xl">
              <T>
                Hospitals and clinics trust {productName} to run smarter.
                Together, we&apos;re shaping the future of healthcare for a more
                connected, reliable and patient-first Africa.
              </T>
            </h2>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-white/50">
              <T>
                By combining dependable software with hands-on support, we help
                care teams cut paperwork, speed up claims and focus on what
                matters most: their patients. Here&apos;s what they say.
              </T>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = PRIMARY_COLOR;
                  e.currentTarget.style.borderColor = PRIMARY_COLOR;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                }}
                className="inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium text-white transition-colors"
              >
                <T>Get Started</T>
              </Link>
              <Link
                href="/solutions"
                className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80"
                style={{ color: PRIMARY_COLOR }}
              >
                <T>View all solutions</T>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: horizontal scroll + arrows */}
        <div className="mt-14 md:hidden">
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {testimonials.map((item, i) => (
              <QuoteCard
                key={`${item.name}-${i}`}
                quote={item.quote}
                name={item.name}
                role={item.role}
                highlight={i % 2 === 1}
                className="w-[85vw] max-w-[320px] shrink-0 snap-start"
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollLeft}
              aria-label={t("Previous")}
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
              aria-label={t("Next")}
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
          className="mt-14 hidden gap-4 sm:grid-cols-2 md:mt-20 md:grid lg:grid-cols-3"
        >
          {testimonials.map((item, i) => (
            <QuoteCard
              key={`${item.name}-${i}`}
              quote={item.quote}
              name={item.name}
              role={item.role}
              highlight={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
