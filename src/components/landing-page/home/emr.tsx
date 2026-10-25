"use client";

import { useState } from "react";
import Image from "next/image";
import { PRIMARY_COLOR } from "@/constants/colors";

const CARDS = [
  {
    src: "/assets/landing-page-images/cards/mac-a.png",
    alt: "e-Patient data overview",
    title: "e-Patient data, not paper",
    body: "Every lab result, note, and history lives in one structured record — searchable, shareable, and ready when care teams need it.",
  },
  {
    src: "/assets/landing-page-images/cards/mac-b.png",
    alt: "Patient health folders",
    title: "Health folders that work",
    body: "Organized patient folders replace scattered charts. Visually clear, always up to date, and built for real clinical workflows.",
  },
  {
    src: "/assets/landing-page-images/cards/mac-c.png",
    alt: "Personal EMR profile",
    title: "Personal EMR profile",
    body: "A complete view of each patient — demographics, conditions, meds, and history — in one focused profile your team can trust.",
  },
  {
    src: "/assets/landing-page-images/cards/mac-d.png",
    alt: "Hospital and task management",
    title: "Hospital & task management",
    body: "Coordinate beds, assignments, and daily tasks across the floor. Clear ownership, fewer missed steps, smoother handoffs.",
  },
] as const;

type FeatureCardsSectionProps = {
  className?: string;
};

export default function FeatureCardsSection({
  className = "",
}: FeatureCardsSectionProps) {
  const [index, setIndex] = useState(0);
  const card = CARDS[index];
  const total = CARDS.length;

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <section
      className={`relative pt-40 flex min-h-screen w-full flex-col justify-center bg-black px-4 py-16 text-white sm:px-4 lg:px-8 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* text */}
        <div className="mb-8 max-w-5xl px-[-2] text-left">
          <p
            className="mb-3 text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: PRIMARY_COLOR }}
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </p>
          <h2 className="font-semibold tracking-tight text-white text-4xl  sm:text-6xl md:text-7xl">
            {card.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
            {card.body}
          </p>

          {/* arrows */}
          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
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
              onClick={next}
              aria-label="Next"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
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

            {/* dots */}
            <div className="ml-4 flex gap-2">
              {CARDS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === index ? 24 : 6,
                    backgroundColor:
                      i === index ? PRIMARY_COLOR : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* big image + arrows */}
        <div className="relative w-full mt-16">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:aspect-[16/9]">
            <Image
              key={card.src}
              src={card.src}
              alt={card.alt}
              fill
              className="object-cover object-top"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
