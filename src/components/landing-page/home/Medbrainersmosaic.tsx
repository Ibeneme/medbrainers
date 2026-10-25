"use client";

import {
  PRIMARY_COLOR,
  PRIMARY_DEEP,
  PRIMARY_HOVER,
  PRIMARY_TINT,
} from "@/constants/colors";
import React, { useEffect, useRef, useState } from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T, useT } from "@/i18n/provider";
import { productName } from "@/constants/site";
import Cells from "./dna/cells";

gsap.registerPlugin(ScrollTrigger);

type Tile = {
  src: string;
  alt: string;
  bg: string;
  flex: number;
  position?: string;
};

type Row = {
  /* Tailwind height classes: mobile first, then md and up */
  heightClass: string;
  tiles: Tile[];
};

/* Exactly 5 photos split into 2 rows */
const rows: Row[] = [
  {
    // mobile: 200px | tablet: 380px | desktop: 530px
    heightClass: "h-[200px] sm:h-[300px] md:h-[400px] lg:h-[530px]",
    tiles: [
      {
        src: "/mosaic/01.svg",
        alt: "Doctor in scrubs",
        bg: "#c2410c",
        flex: 1.2,
        position: "50% 30%",
      },
      {
        src: "/mosaic/02.svg",
        alt: "Capsules and tablets",
        bg: "#be7a8c",
        flex: 1,
      },
    ],
  },
  {
    // mobile: 180px | tablet: 340px | desktop: 510px
    heightClass: "h-[180px] sm:h-[280px] md:h-[380px] lg:h-[510px]",
    tiles: [
      {
        src: "/mosaic/03.svg",
        alt: "Nurse portrait",
        bg: PRIMARY_DEEP,
        flex: 1,
        position: "30% 40%",
      },
      {
        src: "/mosaic/04.svg",
        alt: "Surgical team at work",
        bg: PRIMARY_TINT,
        flex: 1.8,
        position: "50% 20%",
      },
      {
        src: "/mosaic/05.svg",
        alt: "Stethoscope close-up",
        bg: PRIMARY_HOVER,
        flex: 1.2,
        position: "50% 20%",
      },
    ],
  },
];

/* Film grain background */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Photo = ({ tile, priority }: { tile: Tile; priority: boolean }) => {
  const t = useT();
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!failed && (
        <Image
          src={tile.src}
          alt={t(tile.alt)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 40vw"
          priority={priority}
          className="object-cover"
          style={{ objectPosition: tile.position ?? "50% 50%" }}
          onError={() => setFailed(true)}
        />
      )}

      {/* Dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      {/* Grain layer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px" }}
      />
    </div>
  );
};

export default function MedBrainersMosaic() {
  const rootRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tiles = gsap.utils.toArray<HTMLElement>("[data-tile]");
      const inners = gsap.utils.toArray<HTMLElement>("[data-tile-inner]");

      // Tiles reveal upward
      gsap.from(tiles, {
        clipPath: "inset(100% 0% 0% 0% round 16px)",
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
      });

      // Wordmark slides up
      gsap.from(wordRef.current, {
        yPercent: 60,
        opacity: 0,
        duration: 1.1,
        delay: 0.5,
        ease: "power3.out",
      });

      // Parallax effect on scroll (smaller shift on mobile so images stay in frame)
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        inners.forEach((el, i) => {
          gsap.fromTo(
            el,
            { yPercent: i % 2 ? 6 : -6, scale: 1.12 },
            {
              yPercent: i % 2 ? -6 : 6,
              scale: 1.12,
              ease: "none",
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      });

      mm.add("(max-width: 767px)", () => {
        inners.forEach((el, i) => {
          gsap.fromTo(
            el,
            { yPercent: i % 2 ? 2 : -2, scale: 1.05 },
            {
              yPercent: i % 2 ? -2 : 2,
              scale: 1.05,
              ease: "none",
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      });

      gsap.from(introRef.current?.children || [], {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: introRef.current, start: "top 85%" },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full bg-black text-white overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex mb-16 mt-24 w-full items-center justify-center gap-4 px-4">
          <span className="text-[17vw] text-center font-semibold leading-none tracking-tighter text-white md:text-[10vw]">
            <T>Your Healthcare’s second brain.</T>
          </span>{" "}
          {/* */}
          {/* Lock Icon */}
          {/* <div className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[8vw] h-[8vw] md:w-[7vw] md:h-[7vw] text-white"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div> */}
        </div>
        {/* ---------- Mosaic hero ---------- */}
        <div
          ref={heroRef}
          className="relative flex w-full flex-col gap-1.5 overflow-hidden bg-black/40 p-1.5 sm:gap-2 sm:p-2"
        >
          {rows.map((row, ri) => (
            <div
              key={ri}
              className={`relative flex w-full gap-1.5 sm:gap-2 ${row.heightClass}`}
            >
              {row.tiles.map((t, ti) => (
                <div
                  key={`${ri}-${ti}`}
                  data-tile
                  className="relative min-w-0 overflow-hidden rounded-xl sm:rounded-2xl"
                  style={{ flex: t.flex, backgroundColor: t.bg }}
                >
                  <div
                    data-tile-inner
                    className="absolute inset-0 will-change-transform"
                  >
                    <Photo tile={t} priority={ri === 0} />
                  </div>
                </div>
              ))}
              {/* Giant wordmark across the last row */}

              {ri === rows.length - 1 && (
                <div
                  ref={wordRef}
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between gap-2 px-1 sm:gap-4 sm:px-2 md:px-4"
                >
                  <span className="text-[14vw] font-semibold leading-none tracking-tighter text-white md:text-[13vw]">
                    <T>{productName.slice(0, 3)?.toLowerCase()}</T>
                  </span>
                  <span className="h-px flex-1 bg-white/70" />
                  <span className="text-[14vw] font-semibold leading-none tracking-tighter text-white md:text-[13vw]">
                    <T>{productName.slice(3)}</T>
                    <span className="align-super text-[5vw] font-medium md:text-[4vw]">
                      ®
                    </span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---------- Intro ---------- */}
        <div className="mx-auto max-w-4xl px-5 py-12 text-center sm:px-6 sm:py-16 md:py-28">
          <div ref={introRef} className="flex flex-col items-center">
            <p className="mt-4 text-xl font-medium leading-snug tracking-tight sm:mt-8 sm:text-2xl md:text-4xl md:leading-[1.2]">
              <T>
                {productName} ® — a healthcare software company working at the
                intersection of care, operations, and technology. Building
                hospital and clinic systems that move providers forward.
              </T>
            </p>
            <Link
              href="/get-started"
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="group mt-8 inline-flex items-center gap-3 rounded-full py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105 sm:mt-10"
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
        </div>

        {/* ---------- Dedicated Cells Section (300px height) ---------- */}
        <div className="relative w-full h-[420px] overflow-hidden bg-black">
          <Cells />
        </div>
      </div>
    </section>
  );
}
