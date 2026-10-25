"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import { T } from "@/i18n/provider";
import { productName } from "@/constants/site";
import React, { useEffect, useRef, useState } from "react";

const SLIDES: { src: string; title: string; body: string }[] = [
  {
    src: "/assets/landing-page-images/cards/mac-b.png",
    title: "Every patient, one clear record",
    body: "Open a patient and see their history, notes and results together, instead of hunting across files and folders.",
  },
  {
    src: "/assets/landing-page-images/cards/mac-a.png",
    title: "Your day at a glance",
    body: "See who is waiting, what needs attention and what comes next, so the whole team starts from the same page.",
  },
];

/* Keep in sync with the 6500ms in the animate-[...] classes below */
const AUTOPLAY_MS = 6500;

const tint = (pct: number) =>
  `color-mix(in srgb, ${PRIMARY_COLOR} ${pct}%, white)`;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

function ArrowNE() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

export default function MacShowcase() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const total = SLIDES.length;
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + total) % total);

  /* One reveal when the section first enters the screen */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Autoplay only runs while the stage is visible */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = parallaxRef.current;
    const box = stageRef.current?.getBoundingClientRect();
    if (!el || !box) return;
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    el.style.setProperty("--px", x.toFixed(3));
    el.style.setProperty("--py", y.toFixed(3));
  };

  const onLeave = () => {
    parallaxRef.current?.style.setProperty("--px", "0");
    parallaxRef.current?.style.setProperty("--py", "0");
  };

  const playState = inView && !paused ? "running" : "paused";

  /* Header reveal: staggered once, nothing hidden for reduced-motion users */
  const rise = (delay: number) =>
    revealed
      ? {
          className:
            "animate-[aiUp_800ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none",
          style: { animationDelay: `${delay}ms` },
        }
      : { className: "opacity-0 motion-reduce:opacity-100", style: {} };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white py-20 text-neutral-950 md:py-28 font-lufga"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* ───────── Header ───────── */}
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div {...rise(0)}>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
                style={{ borderColor: tint(35) }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                />
                <T>Product tour</T>
              </span>
            </div>

            <h2
              style={{ lineHeight: 1.02, ...rise(120).style }}
              className={`mt-6 text-5xl font-medium tracking-tight md:text-6xl lg:text-7xl ${
                rise(120).className
              }`}
            >
              <T>Your whole practice,</T>{" "}
              <span style={{ color: PRIMARY_COLOR }}>
                <T>on one screen.</T>
              </span>
            </h2>
          </div>

          <p
            style={rise(260).style}
            className={`max-w-md text-sm leading-relaxed text-neutral-600 md:text-base lg:col-span-5 ${
              rise(260).className
            }`}
          >
            <T>
              {productName} brings patient records, notes and follow-ups into
              one clean workspace, so every member of your team sees the same
              up-to-date picture.
            </T>
          </p>
        </div>

        {/* ───────── Interactive block ───────── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          style={rise(400).style}
          className={`mt-10 md:mt-14 ${rise(400).className}`}
        >
          {/* Stage */}
          <div
            ref={stageRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Product tour"
            tabIndex={0}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") go(-1);
              if (e.key === "ArrowRight") go(1);
            }}
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
              touchX.current = null;
            }}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:aspect-[16/10]"
            style={{ backgroundColor: tint(7), borderColor: tint(18) }}
          >
            {/* faint grid, flat and decorative */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${tint(
                  12
                )} 1px, transparent 1px), linear-gradient(90deg, ${tint(
                  12
                )} 1px, transparent 1px)`,
                backgroundSize: "56px 56px",
                maskImage:
                  "radial-gradient(ellipse at center, black 25%, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at center, black 25%, transparent 75%)",
              }}
            />

            {/* Slides: cross-fade with a small sideways drift */}
            <div
              ref={parallaxRef}
              className="absolute inset-0 transition-transform duration-300 ease-out [transform:translate3d(calc(var(--px,0)*12px),calc(var(--py,0)*8px),0)] motion-reduce:[transform:none]"
            >
              {SLIDES.map((s, i) => {
                const on = i === index;
                return (
                  <div
                    key={s.src}
                    aria-hidden={!on}
                    className="absolute inset-0 flex items-center justify-center p-8 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:p-14 lg:p-16"
                    style={{
                      opacity: on ? 1 : 0,
                      transform: on
                        ? "translateX(0) scale(1)"
                        : `translateX(${i < index ? "-5%" : "5%"}) scale(0.97)`,
                    }}
                  >
                    <img
                      src={s.src}
                      alt={s.title}
                      draggable={false}
                      className={`max-h-full w-full select-none object-contain ${
                        on
                          ? "animate-[aiKen_6500ms_linear_forwards] motion-reduce:animate-none"
                          : ""
                      }`}
                      style={{ animationPlayState: playState }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Counter */}
            <div
              className="absolute left-4 top-4 rounded-full border bg-white px-3 py-1 text-xs font-medium md:left-6 md:top-6 md:text-sm"
              style={{ borderColor: tint(25) }}
              aria-hidden="true"
            >
              <span
                key={index}
                className="inline-block animate-[aiUp_500ms_ease-out_both] motion-reduce:animate-none"
                style={{ color: PRIMARY_COLOR }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-neutral-400">
                {" "}
                / {String(total).padStart(2, "0")}
              </span>
            </div>

            {/* Left arrow */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 transition-colors hover:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:left-6 md:h-14 md:w-14"
            >
              <Chevron dir="left" />
            </button>

            {/* Right arrow */}
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:right-6 md:h-14 md:w-14"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Chevron dir="right" />
            </button>
          </div>

          {/* Title + description cards; the active one fills as autoplay runs */}
          <div
            role="tablist"
            aria-label="Tour steps"
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            {SLIDES.map((s, i) => {
              const on = i === index;
              return (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setIndex(i)}
                  className="relative flex items-start justify-between gap-4 overflow-hidden rounded-2xl border bg-white p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:p-6"
                  style={{ borderColor: on ? PRIMARY_COLOR : tint(18) }}
                >
                  <span className="flex items-start gap-4 md:gap-5">
                    <span
                      className="text-3xl font-medium leading-none tracking-tight transition-colors duration-500 md:text-4xl"
                      style={{ color: on ? PRIMARY_COLOR : "#d4d4d4" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span
                        className={`block text-base font-medium leading-snug transition-colors duration-500 md:text-xl ${
                          on ? "text-neutral-950" : "text-neutral-500"
                        }`}
                      >
                        <T>{s.title}</T>
                      </span>
                      <span
                        className={`mt-2 block max-w-md text-sm leading-relaxed transition-colors duration-500 md:text-base ${
                          on ? "text-neutral-600" : "text-neutral-400"
                        }`}
                      >
                        <T>{s.body}</T>
                      </span>
                    </span>
                  </span>

                  <span
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-500"
                    style={{
                      borderColor: on ? PRIMARY_COLOR : "#d4d4d4",
                      backgroundColor: on ? PRIMARY_COLOR : "transparent",
                      color: on ? "#fff" : "#171717",
                    }}
                  >
                    <ArrowNE />
                  </span>

                  {/* progress track + fill; finishing the fill advances the slide */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{ backgroundColor: tint(12) }}
                  />
                  {on && (
                    <span
                      key={index}
                      aria-hidden="true"
                      onAnimationEnd={() => go(1)}
                      className="absolute bottom-0 left-0 h-0.5 w-0 animate-[aiFill_6500ms_linear_forwards] motion-reduce:w-full motion-reduce:animate-none"
                      style={{
                        backgroundColor: PRIMARY_COLOR,
                        animationPlayState: playState,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aiUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
        @keyframes aiKen { from { transform: scale(1) } to { transform: scale(1.035) } }
        @keyframes aiFill { from { width: 0% } to { width: 100% } }
      `}</style>
    </section>
  );
}
