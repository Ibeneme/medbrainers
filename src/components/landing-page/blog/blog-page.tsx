"use client";

import React, { useEffect, useRef } from "react";
import Link from "@/i18n/link";
import gsap from "gsap";
import { PRIMARY_COLOR } from "@/constants/colors";
import { T, useLocale } from "@/i18n/provider";
import { productName } from "@/constants/site";
import { Art, type ArtName } from "@/components/atoms/art/isometric-art";
import { posts, pick, type Post } from "./data";
import Cells from "../home/dna/cells";

export const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

/* ---------- Torn paper edge component ---------- */
const EDGE_PATH =
  "M0 395V180L18 180L32 175L40 178L75 200L110 211L150 198L165 185L175 177L185 181L220 157L255 146L270 150L290 165L310 175L335 177L350 168L365 157L395 152L410 149L458 150L470 153L530 166L560 170L605 178L630 170L670 176L725 173L735 166L765 170L825 170L840 160L870 138L885 129L920 122L925 120L1400 120L1410 123L1430 121L1605 121L1620 125L1650 127L1665 127L1690 120L1710 120L1722 133L1740 130L1750 120L1915 120L1930 121L2335 121L2342 121L2323 172L2303 187L2320 196L2392 200L2430 193L2462 189L2485 197L2545 210L2576 206V395Z";

function RoughEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 2576 395"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-20 block h-14 w-full md:h-24 lg:h-32 ${
        position === "top" ? "-top-px rotate-180" : "-bottom-px"
      }`}
    >
      <path d={EDGE_PATH} fill="#000" />
    </svg>
  );
}

/**
 * Cover tile: the shared isometric wireframe art (same family as the Solutions page)
 * on a dark grid panel with a soft brand glow.
 */
export function PostCover({
  art,
  label,
  className = "",
}: {
  art: ArtName;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111] ${className}`}
    >
      <div className="absolute inset-0 p-5 transition-transform duration-500 group-hover:scale-[1.04] md:p-6">
        <Art name={art} />
      </div>
      <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-white/90">
        {label}
      </span>
    </div>
  );
}

function PostMeta({
  post,
  locale,
  tone = "dark",
}: {
  post: Post;
  locale: string;
  tone?: "dark" | "light";
}) {
  return (
    <p
      className={`text-sm ${
        tone === "light" ? "text-black/50" : "text-white/40"
      }`}
    >
      {formatDate(post.date, locale)} · {post.readMinutes} <T>min read</T>
    </p>
  );
}

export default function BlogPage() {
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero] > *", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div ref={rootRef} className="w-full bg-black font-lufga text-white">
      {/* ---------- Page header: product name + Cells bg ---------- */}
      <div className="relative mt-16 flex h-[280px] w-full select-none items-center overflow-hidden bg-black md:h-[350px] lg:h-[390px]">
        <Cells />
        {/* Darkened overlay for contrast */}
        <div className="absolute inset-0 pointer-events-none bg-black/50 z-[1]" />
        {/* Film grain / Noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-overlay z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">
          <p
            aria-hidden="true"
            className="w-full text-left text-[clamp(3.8rem,14vw,12rem)] font-black leading-[0.85] tracking-tighter text-[#ffffff] md:text-[clamp(10rem,17vw,13rem)]"
          >
            <T>{productName}</T>
            <span style={{ color: PRIMARY_COLOR }}>.</span>
          </p>
        </div>
      </div>

      {/* ---------- Title + featured post (torn edge at the BOTTOM) ---------- */}
      <div className="relative w-full overflow-hidden bg-white pb-24 text-black md:pb-36 lg:pb-44">
        <header className="mx-auto max-w-7xl px-6 pb-12 pt-32 md:pb-16 md:pt-44 lg:px-12">
          <div
            data-hero
            className="grid items-end gap-10 md:grid-cols-[1.7fr_1fr] md:gap-16"
          >
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              <T>Insights for smarter</T>{" "}
              <span
                style={{ backgroundColor: PRIMARY_COLOR }}
                className="inline-block px-2 text-white md:px-3"
              >
                <T>healthcare.</T>
              </span>
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-black/60 md:pb-2 md:text-base">
              <T>
                Practical guides on electronic records, billing, pharmacy and
                running a modern hospital.
              </T>
            </p>
          </div>
        </header>

        {/* ---------- Featured post ---------- */}
        <section className="mx-auto max-w-7xl px-6 lg:px-12">
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <PostCover
              art={featured.art}
              label={pick(featured.category, locale)}
              className="aspect-[16/10] w-full"
            />
            <div>
              <PostMeta post={featured} locale={locale} tone="light" />
              <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight transition-colors group-hover:text-black/70 md:text-5xl">
                {pick(featured.title, locale)}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-black/60">
                {pick(featured.excerpt, locale)}
              </p>
              <span
                style={{ color: PRIMARY_COLOR }}
                className="mt-8 inline-flex items-center gap-1.5 border-b border-current pb-0.5 text-sm font-medium"
              >
                <T>Read article</T>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                >
                  ↗
                </span>
              </span>
            </div>
          </Link>
        </section>

        <RoughEdge position="bottom" />
      </div>

      {/* ---------- More posts ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-32 pt-16 md:pb-48 lg:px-12">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight md:text-3xl">
          <T>Latest articles</T>
        </h2>
        <div className="grid gap-x-12 gap-y-24 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <PostCover
                art={post.art}
                label={pick(post.category, locale)}
                className="aspect-[16/9] w-full"
              />
              <div className="mt-6">
                <PostMeta post={post} locale={locale} />
                <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-white/80">
                  {pick(post.title, locale)}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                  {pick(post.excerpt, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section
        style={{ backgroundColor: "#fff", color: "#000" }}
        className="relative w-full overflow-hidden pb-24 pt-28 text-white md:pb-32 md:pt-44"
      >
        <RoughEdge position="top" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.25fr_1fr] lg:gap-20 lg:px-12">
          <div>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              <T>See how</T>{" "}
              <span
                className="inline-block -rotate-1 px-3 text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {productName}
              </span>{" "}
              <T>can run your facility.</T>
            </h2>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/get-started"
                className="group inline-flex items-center gap-3 rounded-full bg-black py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105"
              >
                <T>Get started</T>
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
                >
                  →
                </span>
              </Link>
              <span className="text-sm text-white/80">
                <T>No setup fees. Live in days, not months.</T>
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-square rotate-3 overflow-hidden rounded-[36px] border border-white/20 bg-[#0b0b0b]">
              <div className="absolute inset-0 p-8">
                <Art name={featured.art} />
              </div>
            </div>
            <div
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="absolute -bottom-5 -left-4 -rotate-6 rounded-2xl px-5 py-3 text-sm font-semibold text-white md:-left-8"
            >
              <T>One platform. Every department.</T>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}