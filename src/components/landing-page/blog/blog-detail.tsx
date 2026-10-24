"use client";

import React from "react";
import Link from "@/i18n/link";
import { PRIMARY_COLOR } from "@/constants/colors";
import { T, useLocale } from "@/i18n/provider";
import { posts, getPost, pick, type Block } from "./data";
import { PostCover, formatDate } from "./blog-page";

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

function renderBlock(block: Block, i: number, locale: string) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={i}
          className="mt-12 text-2xl font-semibold tracking-tight text-white md:text-3xl"
        >
          {pick(block.text, locale)}
        </h2>
      );
    case "p":
      return (
        <p key={i} className="mt-5 text-base leading-[1.8] text-white/70">
          {pick(block.text, locale)}
        </p>
      );
    case "quote":
      return (
        <blockquote
          key={i}
          style={{ borderColor: PRIMARY_COLOR }}
          className="my-10 border-l-2 pl-6 text-xl font-medium leading-snug text-white md:text-2xl"
        >
          {pick(block.text, locale)}
        </blockquote>
      );
    case "list":
      return (
        <ul key={i} className="mt-6 flex flex-col gap-3.5">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] text-white/85">
              <svg
                style={{ color: PRIMARY_COLOR }}
                className="mt-0.5 h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.35" />
                <path d="M7.5 12.5l3 3 6-7" />
              </svg>
              <span>{pick(item, locale)}</span>
            </li>
          ))}
        </ul>
      );
  }
}

export default function BlogDetail({ slug }: { slug: string }) {
  const locale = useLocale();
  const post = getPost(slug);
  if (!post) return null; // the route file calls notFound() before this renders

  const related = posts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="w-full bg-black font-lufga text-white">
      {/* ---------- Header ---------- */}
      <header className="mx-auto max-w-4xl px-6 pb-10 pt-32 md:pt-44 lg:px-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition-colors hover:text-white"
        >
          <span aria-hidden="true">←</span>
          <T>Back to blog</T>
        </Link>

        <p
          style={{ color: PRIMARY_COLOR }}
          className="mt-8 text-sm font-medium"
        >
          {pick(post.category, locale)}
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
          {pick(post.title, locale)}
        </h1>
        <p className="mt-6 text-sm text-white/40">
          {post.author} · {formatDate(post.date, locale)} · {post.readMinutes}{" "}
          <T>min read</T>
        </p>
      </header>

      {/* ---------- Cover ---------- */}
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <PostCover
          art={post.art}
          label={pick(post.category, locale)}
          className="aspect-[16/9] w-full md:aspect-[16/7]"
        />
      </div>

      {/* ---------- Article ---------- */}
      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24 lg:px-12">
        <p className="text-xl leading-relaxed text-white/90">
          {pick(post.excerpt, locale)}
        </p>
        {post.content.map((block, i) => renderBlock(block, i, locale))}

        <div className="mt-16 flex flex-wrap gap-3 border-t border-white/15 pt-10">
          <Link
            href="/get-started"
            style={{ backgroundColor: PRIMARY_COLOR }}
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <T>Get started</T>
          </Link>
          <Link
            href="/solutions"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <T>View Solutions</T>
          </Link>
        </div>
      </article>

      {/* ---------- Related (with top rough torn edge right above the "Keep reading" title) ---------- */}
      <section className="relative w-full overflow-hidden bg-white pt-24 pb-16 text-black md:pt-32 md:pb-24">
        <RoughEdge position="top" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-12">
          <h2 className="mb-10 text-2xl font-semibold tracking-tight md:text-3xl text-black">
            <T>Keep reading</T>
          </h2>
          <div className="grid gap-10 md:grid-cols-2">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col"
              >
                <PostCover
                  art={p.art}
                  label={pick(p.category, locale)}
                  className="aspect-[16/9] w-full"
                />
                <h3 className="mt-6 text-2xl font-semibold leading-tight tracking-tight text-black transition-colors group-hover:text-black/70">
                  {pick(p.title, locale)}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-black/60">
                  {pick(p.excerpt, locale)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
