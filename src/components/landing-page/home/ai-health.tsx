"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import { T, useT } from "@/i18n/provider";
import { productName } from "@/constants/site";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Dna from "./dna/dna";

type Row = { label: string; value: string };

const FEATURES: {
  title: string;
  body: string;
  inputLabel: string;
  input: string;
  highlights: string[];
  steps: string[];
  outputLabel: string;
  rows: Row[];
}[] = [
  {
    title: "Instant patient summaries",
    body: "Years of visits condensed into one clear overview.",
    inputLabel: "Last 12 visits",
    input:
      "Recurring headaches since March. BP 150/95 on two visits. Amlodipine 5 mg started in June. Missed the August review.",
    highlights: ["BP 150/95", "Amlodipine 5 mg", "Missed the August review"],
    steps: [
      "Reading 12 visits",
      "Extracting vitals and medications",
      "Drafting the summary",
    ],
    outputLabel: "Summary",
    rows: [
      { label: "Overview", value: "Hypertension, recently treated" },
      { label: "Open issue", value: "Overdue review" },
      { label: "Last reading", value: "150/95, recheck today" },
    ],
  },
  {
    title: "Notes into structured records",
    body: "Typed or dictated notes become organized fields.",
    inputLabel: "Clinician note",
    input:
      "Pt c/o cough x3 days, mild fever. Chest clear. Advise rest, fluids, paracetamol. Review in 5 days if no better.",
    highlights: ["cough x3 days", "Chest clear", "paracetamol"],
    steps: [
      "Reading clinician shorthand",
      "Mapping to record fields",
      "Checking for missing details",
    ],
    outputLabel: "Structured record",
    rows: [
      { label: "Complaint", value: "Cough, 3 days" },
      { label: "Findings", value: "Chest clear" },
      { label: "Plan", value: "Rest, fluids, paracetamol" },
      { label: "Follow-up", value: "5 days if no better" },
    ],
  },
  {
    title: "Ask in plain language",
    body: "Search a full history the way you would ask a colleague.",
    inputLabel: "Search",
    input: "When was her last malaria test and what was the result?",
    highlights: ["last malaria test", "result"],
    steps: [
      "Understanding the question",
      "Searching lab history",
      "Verifying the source",
    ],
    outputLabel: "Answer",
    rows: [
      { label: "Result", value: "Malaria RDT, negative" },
      { label: "Date", value: "14 August" },
      { label: "Source", value: "Lab report, visit 8" },
    ],
  },
  {
    title: "Clinicians stay in control",
    body: "Every AI suggestion is approved before it is saved.",
    inputLabel: "AI suggestion",
    input:
      "Add “Type 2 diabetes” to the problem list based on the last three lab results.",
    highlights: ["Type 2 diabetes", "last three lab results"],
    steps: [
      "Reviewing recent lab results",
      "Matching diagnosis criteria",
      "Preparing for clinician review",
    ],
    outputLabel: "Review",
    rows: [
      { label: "Status", value: "Awaiting clinician approval" },
      { label: "Saved to record", value: "Not yet" },
      { label: "Audit trail", value: "Logged" },
    ],
  },
];

const ROLES: { name: string; cards: { title: string; body: string }[] }[] = [
  {
    name: "Doctors",
    cards: [
      {
        title: "Pre-visit summaries",
        body: "Walk into every consult already briefed.",
      },
      {
        title: "Faster documentation",
        body: "Spend less time writing notes after hours.",
      },
      {
        title: "Safer prescribing",
        body: "Surface allergies and past reactions from the record.",
      },
    ],
  },
  {
    name: "Nurses",
    cards: [
      {
        title: "Shift handovers",
        body: "A clear overview of each patient for the next shift.",
      },
      {
        title: "Vitals at a glance",
        body: "Recent readings and trends in one place.",
      },
      {
        title: "Care reminders",
        body: "Pending tasks pulled from the doctor’s plan.",
      },
    ],
  },
  {
    name: "Front desk",
    cards: [
      {
        title: "Quicker check-in",
        body: "Find the right patient file without digging.",
      },
      {
        title: "Cleaner files",
        body: "Details land in the right fields from the start.",
      },
      {
        title: "Fewer duplicates",
        body: "Spot matching records before a new one is made.",
      },
    ],
  },
  {
    name: "Lab and pharmacy",
    cards: [
      {
        title: "Results filed for you",
        body: "Reports attach to the correct patient record.",
      },
      {
        title: "Flagged values",
        body: "Out-of-range results are highlighted for review.",
      },
      {
        title: "Prescription clarity",
        body: "Orders are read back in a clear, structured form.",
      },
    ],
  },
];

const BAR_SETS = [
  [72, 48, 60],
  [56, 80, 40],
  [64, 44, 70],
];

const AVATARS = ["Dr", "Rn", "Fd", "Lp"];

/* Timings (ms) */
const TYPE_MS = 18;
const STEP_MS = 750;
const WORD_MS = 75;
const ROW_GAP_MS = 220;
const HOLD_MS = 3200;

type Phase = "typing" | "analyzing" | "output" | "hold";

const tint = (pct: number) =>
  `color-mix(in srgb, ${PRIMARY_COLOR} ${pct}%, white)`;
const deep = (pct: number) =>
  `color-mix(in srgb, ${PRIMARY_COLOR} ${pct}%, black)`;

function Sparkle({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 2l2.2 6.3L18.5 10.5l-6.3 2.2L10 19l-2.2-6.3L1.5 10.5l6.3-2.2z" />
      <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" />
    </svg>
  );
}

function Lock() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function ArrowNE({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

function ArrowSE() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7l10 10M17 8v9H8" />
    </svg>
  );
}

function ArrowRight() {
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
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((d) => (
        <span
          key={d}
          className="h-1 w-1 animate-[aiDot_1s_ease-in-out_infinite] rounded-full motion-reduce:animate-none"
          style={{
            backgroundColor: PRIMARY_COLOR,
            animationDelay: `${d * 150}ms`,
          }}
        />
      ))}
    </span>
  );
}

/** Renders the note with the phrases the AI has “found” highlighted. */
function renderNote(
  text: string,
  phrases: string[],
  hlCount: number,
  shownLen: number
) {
  const shown = text.slice(0, shownLen);
  const ranges = phrases
    .map((p, i) => ({ i, s: text.indexOf(p), e: text.indexOf(p) + p.length }))
    .filter((r) => r.s >= 0 && r.i < hlCount && r.e <= shown.length)
    .sort((a, b) => a.s - b.s);

  const out: React.ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r) => {
    if (r.s < pos) return;
    if (r.s > pos) out.push(shown.slice(pos, r.s));
    out.push(
      <mark
        key={r.i}
        className="animate-[aiMark_550ms_ease-out_both] rounded-sm px-0.5 text-neutral-950 motion-reduce:animate-none"
        style={{
          backgroundColor: "transparent",
          backgroundImage: `linear-gradient(${tint(22)}, ${tint(22)})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
        }}
      >
        {shown.slice(r.s, r.e)}
      </mark>
    );
    pos = r.e;
  });
  if (pos < shown.length) out.push(shown.slice(pos));
  return out;
}

export default function HealthMeetsAI() {
  const t = useT();
  const [active, setActive] = useState(0);
  const [role, setRole] = useState(0);

  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState(0);
  const [step, setStep] = useState(0);
  const [rowIdx, setRowIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  const f = FEATURES[active];
  const isReview = active === FEATURES.length - 1;
  const typingDone = typed >= f.input.length;
  const allRowsDone = rowIdx >= f.rows.length;

  const restart = () => {
    setTyped(0);
    setStep(0);
    setRowIdx(0);
    setWordIdx(0);
    setPhase("typing");
  };

  const select = (i: number) => {
    setActive(i);
    restart();
  };

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(rm.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    rm.addEventListener("change", onChange);
    return () => rm.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!reduced) return;
    const cur = FEATURES[active];
    setTyped(cur.input.length);
    setStep(cur.steps.length);
    setRowIdx(cur.rows.length);
    setWordIdx(0);
    setPhase("hold");
  }, [reduced, active]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView) return;
    let t: ReturnType<typeof setTimeout> | undefined;

    if (phase === "typing") {
      if (typed < f.input.length) {
        t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
      } else {
        t = setTimeout(() => setPhase("analyzing"), 350);
      }
    } else if (phase === "analyzing") {
      if (step < f.steps.length) {
        t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
      } else {
        t = setTimeout(() => setPhase("output"), 350);
      }
    } else if (phase === "output") {
      if (rowIdx < f.rows.length) {
        const words = f.rows[rowIdx].value.split(" ").length;
        if (wordIdx < words) {
          t = setTimeout(() => setWordIdx((w) => w + 1), WORD_MS);
        } else {
          t = setTimeout(() => {
            setRowIdx((r) => r + 1);
            setWordIdx(0);
          }, ROW_GAP_MS);
        }
      } else {
        t = setTimeout(() => setPhase("hold"), 0);
      }
    } else if (phase === "hold") {
      t = setTimeout(() => {
        setActive((a) => (a + 1) % FEATURES.length);
        restart();
      }, HOLD_MS);
    }

    return () => {
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, typed, step, rowIdx, wordIdx, active, inView, reduced]);

  const progress =
    phase === "typing"
      ? 0.25 * (typed / f.input.length)
      : phase === "analyzing"
      ? 0.25 + 0.35 * (step / f.steps.length)
      : phase === "output"
      ? 0.6 + 0.4 * (rowIdx / f.rows.length)
      : 1;

  return (
    <section className="relative w-full overflow-hidden bg-white py-16 text-neutral-950 md:py-24 font-lufga">
      {/* Background field. Eased back at the top so the header stays readable. */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.3) 20%, #000 50%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.3) 20%, #000 50%)",
        }}
      >
        <Dna brightness={2.0} />
      </div>

      {/* Fade into the next section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t from-white to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-16 md:px-10">
        {/* ───────── Header ───────── */}
        <div className="relative max-w-4xl">
          <p className="text-base text-neutral-500 md:text-lg">
            <T>Patient records, reimagined.</T>
          </p>

          <h2
            style={{ lineHeight: 1.08 }}
            className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <T>Health meets</T>{" "}
            <span
              className="animate-[aiShine_3.5s_linear_infinite] bg-clip-text text-transparent motion-reduce:animate-none"
              style={{
                color: PRIMARY_COLOR,
                backgroundImage: `linear-gradient(100deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_COLOR} 40%, ${tint(
                  45
                )} 50%, ${PRIMARY_COLOR} 60%, ${PRIMARY_COLOR} 100%)`,
                backgroundSize: "250% 100%",
              }}
            >
              <T>AI,</T>
            </span>
            <br className="hidden md:block" />
            <T>built around every</T>
            <br className="hidden md:block" />
            <T>patient record.</T>
            <span
              className="ml-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 align-middle text-sm font-medium leading-none tracking-normal text-white md:ml-4"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Sparkle size={12} />
              <T>Coming soon</T>
            </span>
            <span className="ml-3 hidden align-middle text-sm font-normal leading-snug tracking-normal text-neutral-400 sm:inline-block md:ml-4">
              <span className="block">
                <T>Smarter records</T>
              </span>
              <span className="block font-medium text-neutral-600">
                <T>for every care team</T>
              </span>
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-600 md:text-base">
            <T>
              Soon, {productName} will read, organize and connect every patient
              record so your team spends less time on paperwork and more time
              with patients.
            </T>
          </p>

          <Link
            href="/get-started"
            className="group mt-6 inline-flex items-center gap-3 rounded-full bg-neutral-950 py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <T>Get Started</T>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-neutral-950 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
            >
              →
            </span>
          </Link>
        </div>

        {/* ───────── Tiles ───────── */}
        <div
          ref={stageRef}
          className="mt-14 grid gap-3 md:mt-20 md:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr]"
        >
          {/* 01 · care team */}
          <div
            className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-2xl p-6"
            style={{ backgroundColor: tint(8) }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent 0 7px, ${tint(
                  14
                )} 7px 8px)`,
                maskImage: "linear-gradient(to bottom, black, transparent 75%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black, transparent 75%)",
              }}
            />
            <span className="relative text-xs font-medium text-neutral-400">
              01
            </span>

            <div className="relative">
              <div className="flex -space-x-2" aria-hidden="true">
                {AVATARS.map((a, i) => (
                  <span
                    key={a}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-medium"
                    style={{
                      backgroundColor: tint(i % 2 ? 22 : 38),
                      color: i % 2 ? PRIMARY_COLOR : deep(55),
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-lg font-medium leading-snug md:text-xl">
                <T>Built for your whole care team</T>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                <T>Doctors, nurses, front desk, lab and pharmacy.</T>
              </p>
              <Link
                href="/facility-size"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm font-medium transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <T>See who it will help</T>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <ArrowRight />
                </span>
              </Link>
            </div>
          </div>

          {/* 02 · capabilities, with a moving black-to-primary gradient */}
          <div className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-2xl bg-neutral-950 p-6 text-white">
            {/* 1. slow colour sweep: black → primary → black */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 animate-[aiGradient_12s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                backgroundImage: `linear-gradient(135deg, #0a0a0b 0%, #0a0a0b 30%, ${PRIMARY_COLOR} 55%, #0a0a0b 80%, ${deep(
                  55
                )} 100%)`,
                backgroundSize: "300% 300%",
              }}
            />

            {/* 2. two soft colour blobs drifting in opposite directions */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-1/4 -top-1/4 h-3/4 w-3/4 animate-[aiBlobA_9s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                backgroundImage: `radial-gradient(closest-side, ${PRIMARY_COLOR}, transparent)`,
                opacity: 0.55,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-3/4 w-3/4 animate-[aiBlobB_11s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                backgroundImage: `radial-gradient(closest-side, ${tint(
                  45
                )}, transparent)`,
                opacity: 0.35,
              }}
            />

            {/* 3. dark scrim at the bottom so the list stays readable */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
            />

            <span className="relative text-xs font-medium text-white/60">
              02
            </span>

            <div
              role="tablist"
              aria-label={t("AI capabilities")}
              className="relative flex flex-col"
            >
              {FEATURES.map((item, i) => {
                const on = i === active;
                return (
                  <button
                    key={item.title}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => (on ? restart() : select(i))}
                    className={`relative py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      on ? "text-white" : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium md:text-base">
                        <T>{item.title}</T>
                      </span>
                      <span
                        className={`shrink-0 transition-transform duration-300 ${
                          on ? "translate-x-0.5 translate-y-0.5" : ""
                        }`}
                      >
                        <ArrowSE />
                      </span>
                    </span>

                    <span
                      className={`grid transition-all duration-500 ease-out motion-reduce:transition-none ${
                        on
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <span className="overflow-hidden">
                        <span className="block pt-1.5 text-xs leading-relaxed text-white/75">
                          <T>{item.body}</T>
                        </span>
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="absolute -bottom-px left-0 h-px bg-white transition-[width] duration-300 ease-linear motion-reduce:transition-none"
                      style={{ width: on ? `${progress * 100}%` : "0%" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 03 · AI preview */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 md:col-span-2 md:p-6 lg:col-span-1 lg:p-7"
            style={{
              backgroundImage: `radial-gradient(55% 50% at 12% 12%, ${tint(
                48
              )}, transparent 70%), radial-gradient(50% 60% at 92% 88%, ${PRIMARY_COLOR}, transparent 68%), linear-gradient(135deg, ${tint(
                24
              )}, ${tint(55)})`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 5px, rgba(255,255,255,0.22) 5px 7px)",
              }}
            />
            <span className="relative text-xs font-medium text-white/75">
              03
            </span>

            {/* Record card */}
            <div
              className="relative mt-4 overflow-hidden rounded-xl border bg-white"
              style={{ borderColor: tint(16) }}
            >
              <div
                className="flex items-center justify-between gap-4 border-b px-4 py-3.5 md:px-5"
                style={{ borderColor: tint(14) }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium md:text-sm"
                    style={{ backgroundColor: tint(14), color: PRIMARY_COLOR }}
                  >
                    AO
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-tight md:text-base">
                      <T>Amara O.</T>
                    </p>
                    <p className="text-xs text-neutral-500">
                      <T>Patient record</T>
                    </p>
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: tint(30), color: PRIMARY_COLOR }}
                >
                  <span
                    className={
                      phase === "analyzing" || phase === "output"
                        ? "animate-pulse motion-reduce:animate-none"
                        : ""
                    }
                  >
                    <Sparkle size={11} />
                  </span>
                  <T>AI preview</T>
                </span>
              </div>

              <div className="grid gap-6 p-4 md:p-5 xl:grid-cols-2 xl:gap-6">
                {/* Left */}
                <div>
                  <p className="text-xs font-medium text-neutral-500 md:text-sm">
                    <T>{f.inputLabel}</T>
                  </p>

                  <p
                    className="relative mt-3 overflow-hidden rounded-lg border border-dashed px-4 py-3.5 text-sm leading-relaxed text-neutral-700 transition-colors duration-300"
                    style={{
                      borderColor:
                        phase === "analyzing" ? PRIMARY_COLOR : "#e5e5e5",
                    }}
                  >
                    <span className="invisible block" aria-hidden="true">
                      {f.input}
                    </span>
                    <span className="absolute inset-x-4 top-3.5">
                      {renderNote(
                        f.input,
                        f.highlights,
                        step,
                        phase === "typing" ? typed : f.input.length
                      )}
                      {phase === "typing" && (
                        <span
                          aria-hidden="true"
                          className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[0.2em] animate-[aiBlink_1s_steps(1)_infinite] motion-reduce:animate-none"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />
                      )}
                    </span>

                    {phase === "analyzing" && (
                      <span
                        key={step}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 w-14 animate-[aiScan_750ms_ease-in-out_1] motion-reduce:animate-none"
                        style={{
                          backgroundImage: `linear-gradient(90deg, transparent, ${tint(
                            20
                          )})`,
                          borderRight: `1px solid ${PRIMARY_COLOR}`,
                        }}
                      />
                    )}
                  </p>

                  <ul className="mt-4 space-y-2.5" aria-live="polite">
                    {f.steps.map((s, i) => {
                      const done = typingDone && phase !== "typing" && i < step;
                      const current =
                        phase === "analyzing" && i === step && typingDone;
                      return (
                        <li
                          key={s}
                          className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                            done
                              ? "text-neutral-700"
                              : current
                              ? "font-medium text-neutral-950"
                              : "text-neutral-400"
                          }`}
                        >
                          {done ? (
                            <span
                              className="flex h-4 w-4 shrink-0 animate-[aiPop_300ms_ease-out] items-center justify-center rounded-full motion-reduce:animate-none"
                              style={{ backgroundColor: PRIMARY_COLOR }}
                              aria-hidden="true"
                            >
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                              </svg>
                            </span>
                          ) : current ? (
                            <span
                              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-t-transparent motion-reduce:animate-none"
                              style={{ borderColor: PRIMARY_COLOR }}
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              className="h-4 w-4 shrink-0 rounded-full border border-neutral-300"
                              aria-hidden="true"
                            />
                          )}
                          <T>{s}</T>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Right */}
                <div>
                  <div className="flex h-5 items-center justify-between gap-3">
                    <p
                      className="text-xs font-medium md:text-sm"
                      style={{ color: PRIMARY_COLOR }}
                    >
                      <T>{f.outputLabel}</T>
                    </p>
                    {(phase === "analyzing" || phase === "output") && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                        <T>
                          {phase === "analyzing" ? "Analyzing" : "Generating"}
                        </T>
                        <Dots />
                      </span>
                    )}
                  </div>

                  <dl
                    className="mt-3 divide-y rounded-lg border"
                    style={{ borderColor: tint(14) }}
                  >
                    {f.rows.map((r, i) => {
                      const started =
                        i <= rowIdx &&
                        phase !== "typing" &&
                        phase !== "analyzing";
                      const done = i < rowIdx;
                      const streaming = started && !done;
                      const partial = r.value
                        .split(" ")
                        .slice(0, wordIdx)
                        .join(" ");

                      return (
                        <div
                          key={`${active}-${i}-${started ? "on" : "off"}`}
                          className={`grid grid-cols-5 items-center gap-3 px-4 py-3 ${
                            started
                              ? "animate-[aiRow_700ms_ease-out] motion-reduce:animate-none"
                              : ""
                          }`}
                          style={{ borderColor: tint(12) }}
                        >
                          <dt className="col-span-2 text-sm text-neutral-500">
                            {started ? (
                              <T>{r.label}</T>
                            ) : (
                              <span
                                aria-hidden="true"
                                className="block h-3 w-3/5 rounded-full"
                                style={{ backgroundColor: tint(9) }}
                              />
                            )}
                          </dt>

                          <dd className="relative col-span-3 text-sm font-medium">
                            <span
                              className={done ? "block" : "invisible block"}
                              aria-hidden={!done}
                            >
                              <T>{r.value}</T>
                            </span>

                            {!done && (
                              <span className="absolute inset-0 flex items-center">
                                {streaming ? (
                                  <span>
                                    {partial}
                                    <span
                                      aria-hidden="true"
                                      className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[0.2em] animate-[aiBlink_700ms_steps(1)_infinite] motion-reduce:animate-none"
                                      style={{ backgroundColor: PRIMARY_COLOR }}
                                    />
                                  </span>
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className={`block h-3 rounded-full ${
                                      phase === "analyzing"
                                        ? "animate-pulse motion-reduce:animate-none"
                                        : ""
                                    }`}
                                    style={{
                                      width: `${60 + ((i * 17) % 35)}%`,
                                      backgroundColor: tint(9),
                                    }}
                                  />
                                )}
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>

                  <div className="mt-4 flex h-10 gap-3" aria-hidden="true">
                    {isReview && (
                      <div
                        className={`flex gap-3 transition-opacity duration-500 ${
                          allRowsDone ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <span
                          className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-white"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                          <T>Approve</T>
                        </span>
                        <span className="inline-flex h-10 items-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium">
                          <T>Edit</T>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 border-t px-4 py-3 text-xs text-neutral-500 transition-opacity duration-500 md:px-5 ${
                  allRowsDone ? "opacity-100" : "opacity-0"
                }`}
                style={{ borderColor: tint(14) }}
              >
                <span style={{ color: PRIMARY_COLOR }}>
                  <Sparkle size={12} />
                </span>
                <T>
                  Drafted by AI. A clinician reviews it before anything is
                  saved.
                </T>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── Who it will help ───────── */}
        <div
          id="health-ai-roles"
          className="mt-20 grid gap-10 md:mt-28 lg:grid-cols-12 lg:gap-10"
        >
          <div className="lg:col-span-4">
            <p className="flex items-center gap-2 text-sm font-medium text-neutral-500">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PRIMARY_COLOR }}
              />
              <T>Who it will help</T>
            </p>
            <h3 className="mt-3 text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              <T>Built for your whole care team</T>
            </h3>

            <div
              role="tablist"
              aria-label={t("Care team roles")}
              className="mt-8 flex flex-col"
            >
              {ROLES.map((r, i) => {
                const on = i === role;
                return (
                  <button
                    key={r.name}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setRole(i)}
                    className={`flex items-center justify-between border-b py-3.5 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      on
                        ? "font-medium text-neutral-950"
                        : "text-neutral-500 hover:text-neutral-950"
                    }`}
                    style={{ borderColor: on ? PRIMARY_COLOR : tint(16) }}
                  >
                    <T>{r.name}</T>
                    <span
                      className={`transition-opacity ${
                        on ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ color: PRIMARY_COLOR }}
                    >
                      <ArrowNE color={PRIMARY_COLOR} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            key={role}
            className="grid animate-[aiFade_400ms_ease-out] gap-3 motion-reduce:animate-none md:grid-cols-3 lg:col-span-8"
          >
            {ROLES[role].cards.map((c, i) => (
              <div
                key={c.title}
                className="flex flex-col overflow-hidden rounded-2xl"
                style={{ backgroundColor: tint(5) }}
              >
                <div
                  className="flex h-40 flex-col justify-end gap-2 p-5 md:h-48"
                  style={{ backgroundColor: tint(9) }}
                  aria-hidden="true"
                >
                  <span
                    className="mb-2 h-7 w-7 rounded-full"
                    style={{ backgroundColor: tint(26) }}
                  />
                  {BAR_SETS[i % BAR_SETS.length].map((w, j) => (
                    <span
                      key={j}
                      className="h-1.5 origin-left animate-[aiGrow_700ms_ease-out_both] rounded-full motion-reduce:animate-none"
                      style={{
                        width: `${w}%`,
                        backgroundColor: j === 0 ? PRIMARY_COLOR : tint(22),
                        opacity: j === 0 ? 0.9 : 1,
                        animationDelay: `${i * 120 + j * 120}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex flex-1 items-start justify-between gap-3 p-5">
                  <div>
                    <h4 className="text-sm font-medium md:text-base">
                      <T>{c.title}</T>
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500 md:text-sm">
                      <T>{c.body}</T>
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200">
                    <ArrowNE />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ───────── Security note ───────── */}
        <div className="mt-12 flex items-center gap-3 rounded-2xl bg-black px-6 py-4 text-white">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15"
            aria-hidden="true"
          >
            <Lock />
          </span>
          <p className="text-sm font-medium md:text-base">
            <T>
              Every patient record is end-to-end encrypted and secured in
              transit and at rest.
            </T>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes aiFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes aiBlink { 50% { opacity: 0 } }
        @keyframes aiScan { from { left: -3.5rem } to { left: 100% } }
        @keyframes aiDot { 0%, 80%, 100% { opacity: .25 } 40% { opacity: 1 } }
        @keyframes aiGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes aiPop { from { transform: scale(.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes aiMark { from { background-size: 0% 100% } to { background-size: 100% 100% } }
        @keyframes aiShine { from { background-position: 120% 0 } to { background-position: -120% 0 } }
        @keyframes aiRow {
          from { opacity: 0; transform: translateY(5px); background-color: ${tint(
            12
          )} }
          to   { opacity: 1; transform: none; background-color: transparent }
        }

        /* tile 02: moving black-to-primary gradient */
        @keyframes aiGradient {
          0%, 100% { background-position: 0% 50% }
          50%      { background-position: 100% 50% }
        }
        @keyframes aiBlobA {
          0%, 100% { transform: translate(0, 0) scale(1) }
          50%      { transform: translate(45%, 35%) scale(1.25) }
        }
        @keyframes aiBlobB {
          0%, 100% { transform: translate(0, 0) scale(1.1) }
          50%      { transform: translate(-40%, -45%) scale(0.9) }
        }
      `}</style>
    </section>
  );
}
