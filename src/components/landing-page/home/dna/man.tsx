"use client";

import { useEffect, useId, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  <Man />  glowing translucent "x-ray" human, side view, facing right        */
/*  Pure SVG + CSS (no libraries). Animated:                                   */
/*   - body floats gently, aura pulses                                         */
/*   - ribcage + lungs breathe, heart beats (lub-dub)                          */
/*   - energy particles + dashed pulses travel along spine, arms, legs, brain  */
/*   - joints pulse, a scan band sweeps down the body, sparks drift upward     */
/*  Size it with a class: <Man className="h-[80vh]" />                         */
/* -------------------------------------------------------------------------- */

type Pt = [number, number];

/* ------------------------------- silhouettes ------------------------------ */

const BODY =
  "M200 28 C232 28 250 48 252 70 Q254 82 258 88 L266 98 L257 102 L258 108 L254 112 L256 117 L252 122 L252 132 C250 140 240 144 228 146 L226 160 C228 175 230 185 234 190 C254 208 262 250 262 290 C262 325 254 345 256 385 C258 412 256 440 250 462 C252 520 248 580 242 628 C244 640 244 650 242 660 C238 700 232 750 226 792 C236 806 266 812 288 822 L298 832 L176 834 C170 828 176 806 188 794 C186 760 150 712 158 664 C162 650 166 640 172 630 C160 580 146 530 140 492 C124 470 128 432 146 416 C156 404 158 388 156 372 C152 330 142 300 144 260 C146 230 156 210 170 190 C176 180 176 165 176 150 C160 138 148 100 156 68 C160 44 180 28 200 28 Z";

const ARM =
  "M222 192 C238 214 234 262 228 302 C226 330 224 350 224 374 C228 410 230 450 226 520 C230 540 236 560 234 580 L214 586 L206 560 C198 546 196 530 196 522 C186 470 182 420 180 374 C176 340 168 300 166 262 C166 224 178 200 196 190 Z";

const LEG =
  "M248 440 C252 520 248 580 242 628 C244 640 244 650 242 660 C238 700 232 750 226 792 C236 806 266 812 288 822 L298 832 L176 834 C170 828 176 806 188 794 C186 760 150 712 158 664 C162 650 166 640 172 630 C160 580 146 530 142 470 Z";

/* ------------------------- spine / ribs (computed) ------------------------ */

const SPINE_PTS: Pt[] = [
  [188, 146],
  [184, 172],
  [180, 200],
  [172, 232],
  [166, 268],
  [164, 306],
  [166, 342],
  [172, 376],
  [178, 410],
  [176, 444],
  [166, 470],
];

function catmull(pts: Pt[], seg = 20): Pt[] {
  const out: Pt[] = [];
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function makeSampler(dense: Pt[]) {
  const cum = [0];
  for (let i = 1; i < dense.length; i++) {
    cum.push(
      cum[i - 1] +
        Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1])
    );
  }
  const total = cum[cum.length - 1];

  const at = (frac: number) => {
    const d = Math.min(Math.max(frac, 0), 1) * total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const k = (d - cum[i - 1]) / seg;
    const a = dense[i - 1];
    const b = dense[i];
    return {
      x: a[0] + (b[0] - a[0]) * k,
      y: a[1] + (b[1] - a[1]) * k,
      ang: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  };

  const atY = (y: number) => {
    let i = 1;
    while (i < dense.length - 1 && dense[i][1] < y) i++;
    const a = dense[i - 1];
    const b = dense[i];
    const k = b[1] === a[1] ? 0 : (y - a[1]) / (b[1] - a[1]);
    return {
      x: a[0] + (b[0] - a[0]) * k,
      y,
      ang: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  };

  return { at, atY };
}

const SPINE = makeSampler(catmull(SPINE_PTS));

const VERTEBRAE = Array.from({ length: 24 }, (_, i) => {
  const f = 0.02 + (i * 0.94) / 23;
  const p = SPINE.at(f);
  const k = i / 23;
  return {
    x: p.x,
    y: p.y,
    deg: (p.ang * 180) / Math.PI - 90,
    w: 12 + 16 * Math.pow(k, 1.2),
    h: 7 + 8 * k,
  };
});

const RIBS = Array.from({ length: 12 }, (_, i) => {
  const sy = 210 + i * 14.5;
  const s = SPINE.atY(sy);
  let ex: number;
  let ey: number;
  if (i < 10) {
    ex = 234 + 2 * i - (i > 6 ? (i - 6) * 3 : 0);
    ey = sy + 30 + i * 1.5;
  } else {
    ex = 206 - (i - 10) * 6; // floating ribs are shorter
    ey = sy + 22;
  }
  const d = `M${s.x.toFixed(1)} ${sy.toFixed(1)} C${(s.x + 30).toFixed(1)} ${(
    sy +
    6 +
    i * 0.6
  ).toFixed(1)} ${(ex - 22).toFixed(1)} ${(ey - 22 - i * 0.8).toFixed(
    1
  )} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  return { d, w: Math.max(1.6, 3 - i * 0.1) };
});

/* ------------------------------ organ paths ------------------------------- */

const LUNG_A =
  "M186 214 C170 240 170 300 190 332 C210 336 226 320 226 290 C228 250 216 218 186 214 Z";
const LUNG_B =
  "M200 220 C186 246 188 296 206 326 C224 330 240 312 240 282 C240 250 226 224 200 220 Z";
const BRONCHI = [
  "M196 150 C198 170 200 190 200 210",
  "M200 210 C206 224 214 236 222 252",
  "M200 210 C194 228 188 244 184 262",
  "M214 238 C220 244 226 246 232 246",
  "M190 244 C196 250 200 258 202 268",
];
const STOMACH =
  "M208 366 C224 358 246 366 244 384 C242 400 220 402 212 392 C204 384 204 372 208 366 Z";
const GUT = [
  "M206 408 C226 402 242 414 236 428 C230 442 210 438 208 452 C206 466 230 464 238 474",
  "M212 420 C226 424 230 436 218 442",
  "M214 458 C224 454 232 460 228 468",
];
const BRAIN =
  "M176 76 C170 52 196 38 220 44 C244 50 246 78 230 90 C218 98 196 100 184 94 C176 90 174 84 176 76 Z";
const BRAIN_LINES = [
  "M184 70 C196 60 210 62 218 70",
  "M190 84 C204 76 220 80 228 74",
  "M200 56 C206 66 204 80 210 92",
  "M214 52 C222 60 224 70 220 80",
];

/* ------------------------------- flow routes ------------------------------ */

const FLOW_SPINE =
  "M188 146 C184 172 180 200 172 232 C166 268 164 306 166 342 C172 376 178 410 176 444 L166 470";
const FLOW_HEAD = "M188 146 C190 130 196 110 204 90 C212 76 222 64 230 60";
const FLOW_ARM =
  "M200 216 C196 262 192 330 198 374 C206 430 212 480 214 524 L222 582";
const FLOW_LEG =
  "M196 480 C212 540 226 590 224 628 C222 690 214 740 208 790 L262 822";

const PARTICLES = {
  torso: [
    { d: FLOW_SPINE, dur: 5.5, begin: 0, r: 2.4 },
    { d: FLOW_SPINE, dur: 5.5, begin: 2.7, r: 1.8 },
    { d: FLOW_SPINE, dur: 7.5, begin: 4.1, r: 2 },
    { d: FLOW_HEAD, dur: 3.6, begin: 0.6, r: 2.2 },
    { d: FLOW_HEAD, dur: 3.6, begin: 2.4, r: 1.7 },
  ],
  arm: [
    { d: FLOW_ARM, dur: 6, begin: 0.5, r: 2.2 },
    { d: FLOW_ARM, dur: 6, begin: 3.4, r: 1.8 },
    { d: FLOW_ARM, dur: 8, begin: 5, r: 2 },
  ],
  leg: [
    { d: FLOW_LEG, dur: 7, begin: 1, r: 2.4 },
    { d: FLOW_LEG, dur: 7, begin: 4.5, r: 1.9 },
    { d: FLOW_LEG, dur: 9, begin: 6, r: 2 },
  ],
};

const JOINTS = [
  { x: 188, y: 146, r: 4.5, delay: 0 },
  { x: 204, y: 214, r: 6.5, delay: 0.4 },
  { x: 200, y: 374, r: 5.5, delay: 0.9 },
  { x: 212, y: 524, r: 4.5, delay: 1.4 },
  { x: 166, y: 306, r: 3.5, delay: 1.9 },
  { x: 172, y: 376, r: 3.5, delay: 2.2 },
  { x: 204, y: 494, r: 7.5, delay: 0.7 },
  { x: 228, y: 628, r: 6.5, delay: 1.2 },
  { x: 208, y: 790, r: 4.5, delay: 1.7 },
];

/* ---------------------------------- dust ---------------------------------- */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DUST = (() => {
  const r = rng(7);
  return Array.from({ length: 34 }, () => ({
    x: 30 + r() * 340,
    y: 40 + r() * 800,
    r: 0.7 + r() * 1.7,
    dur: 5 + r() * 7,
    delay: -r() * 10,
  }));
})();

/* ------------------------------ tiny helpers ------------------------------ */

function Bone({ d, w = 6 }: { d: string; w?: number }) {
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="#5dffa8"
        strokeOpacity={0.22}
        strokeWidth={w}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke="#d6ffe9"
        strokeOpacity={0.92}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </>
  );
}

function Ring({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#5dffa8"
        fillOpacity={0.12}
        stroke="#5dffa8"
        strokeOpacity={0.25}
        strokeWidth={r * 0.45}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#d6ffe9"
        strokeOpacity={0.9}
        strokeWidth={1.4}
      />
    </>
  );
}

function Flow({
  d,
  dur,
  begin,
  r,
}: {
  d: string;
  dur: number;
  begin: number;
  r: number;
}) {
  return (
    <circle r={r} fill="#eafff2">
      <animateMotion
        dur={`${dur}s`}
        begin={`${-begin}s`}
        repeatCount="indefinite"
        path={d}
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.15;0.85;1"
        dur={`${dur}s`}
        begin={`${-begin}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

const CSS = `
@keyframes man-float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(0.4deg); } }
@keyframes man-breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.03,1.022); } }
@keyframes man-beat { 0%,100% { transform: scale(1); } 12% { transform: scale(1.16); } 24% { transform: scale(1); } 38% { transform: scale(1.1); } 60% { transform: scale(1); } }
@keyframes man-pulse { 0%,100% { transform: scale(0.8); opacity: 0.45; } 50% { transform: scale(1.25); opacity: 1; } }
@keyframes man-scan { 0% { transform: translateY(-140px); } 100% { transform: translateY(900px); } }
@keyframes man-aura { 0%,100% { opacity: 0.26; } 50% { opacity: 0.46; } }
@keyframes man-rise { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 0.9; } 100% { transform: translateY(-46px); opacity: 0; } }
@keyframes man-dash { to { stroke-dashoffset: -28; } }
.man-float { transform-origin: 200px 440px; animation: man-float 8s ease-in-out infinite; }
.man-breathe { transform-origin: 172px 290px; animation: man-breathe 4.6s ease-in-out infinite; }
.man-heart { transform-origin: 228px 296px; animation: man-beat 1.15s ease-in-out infinite; }
.man-pulse { animation: man-pulse 2.6s ease-in-out infinite; }
.man-scan { animation: man-scan 7.5s linear infinite; }
.man-aura { animation: man-aura 5s ease-in-out infinite; }
.man-spark { animation: man-rise 8s ease-out infinite; }
.man-flow { stroke-dasharray: 5 9; animation: man-dash 1.4s linear infinite; }
@media (prefers-reduced-motion: reduce) { .man-root * { animation: none !important; } }
`;

/* -------------------------------- component ------------------------------- */

export default function Man({
  className = "",
  withBackground = true,
}: {
  className?: string;
  /** dark green backdrop like the reference; set false to place it over your own background */
  withBackground?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `man-${uid}-${n}`;
  const ref = (n: string) => `url(#${id(n)})`;

  const [calm, setCalm] = useState(false);
  useEffect(() => {
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div
      role="img"
      aria-label="Glowing translucent human body"
      className={`man-root relative ${className}`}
      style={
        withBackground
          ? {
              background:
                "radial-gradient(ellipse at 50% 38%, #0b3a26 0%, #05160f 55%, #020a07 100%)",
            }
          : undefined
      }
    >
      <style>{CSS}</style>

      <svg
        viewBox="0 0 400 880"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* silhouettes + bone groups, referenced with <use> */}
          <path id={id("body")} d={BODY} />
          <path id={id("arm")} d={ARM} />
          <path id={id("leg")} d={LEG} />

          <g id={id("armBones")}>
            <Bone d="M204 214 C207 262 201 322 200 372" w={9} />
            <Bone d="M204 386 C209 432 214 482 218 520" w={5} />
            <Bone d="M196 386 C198 440 204 490 206 522" w={5} />
            <Bone d="M212 526 L226 578" w={3} />
            <Bone d="M210 528 L220 584" w={3} />
            <Bone d="M207 528 L212 584" w={3} />
            <Bone d="M204 526 L205 578" w={3} />
            <Bone d="M218 524 L234 556" w={3} />
            <Ring cx={200} cy={376} r={9} />
          </g>

          <g id={id("legBones")}>
            <Bone d="M204 494 C216 522 225 582 227 622" w={11} />
            <Bone d="M204 494 L190 480" w={7} />
            <Bone d="M228 642 C226 690 218 742 210 784" w={8} />
            <Bone d="M214 648 C212 702 204 744 198 786" w={4} />
            <Bone d="M210 794 L250 812 L290 828" w={3} />
            <Bone d="M206 796 L246 818 L276 830" w={3} />
            <Bone d="M204 798 L238 822 L262 832" w={3} />
            <Ring cx={228} cy={628} r={11} />
            <Ring cx={246} cy={632} r={9} />
            <Ring cx={188} cy={812} r={8} />
          </g>

          <clipPath id={id("clip")}>
            <use href={`#${id("body")}`} />
            <use href={`#${id("arm")}`} transform="rotate(5 205 212)" />
            <use href={`#${id("arm")}`} transform="rotate(-14 205 212)" />
          </clipPath>

          <clipPath id={id("clipBody")}>
            <use href={`#${id("body")}`} />
          </clipPath>

          <linearGradient id={id("bodyGrad")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9bffd8" stopOpacity="0.2" />
            <stop offset="0.45" stopColor="#5dff9e" stopOpacity="0.24" />
            <stop offset="1" stopColor="#7be8cf" stopOpacity="0.12" />
          </linearGradient>

          <radialGradient id={id("chest")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8aff4a" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#3dff8a" stopOpacity="0.18" />
            <stop offset="1" stopColor="#3dff8a" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={id("lung")} cx="0.45" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#b4ff6a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#2ee67a" stopOpacity="0.14" />
          </radialGradient>

          <radialGradient id={id("heart")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#f4ffd0" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#7dff5a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3dff8a" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={id("joint")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#8dff9a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3dff8a" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={id("back")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#3dff8a" stopOpacity="0.2" />
            <stop offset="1" stopColor="#3dff8a" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={id("scan")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c8ffe6" stopOpacity="0" />
            <stop offset="0.9" stopColor="#c8ffe6" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>

          <filter id={id("glow")} x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={id("soft")} x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={id("aura")} x="-40%" y="-15%" width="180%" height="130%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        {/* ambient glow behind the figure */}
        <circle cx="210" cy="300" r="270" fill={ref("back")} />

        <g className="man-float">
          {/* aura */}
          <g
            className="man-aura"
            filter={ref("aura")}
            fill="none"
            stroke="#2dff7c"
            strokeWidth="26"
            strokeLinejoin="round"
          >
            <use href={`#${id("body")}`} />
            <use href={`#${id("arm")}`} transform="rotate(5 205 212)" />
          </g>

          {/* far limbs (behind the body) */}
          <g opacity="0.55">
            <g transform="rotate(5 200 470)">
              <use
                href={`#${id("leg")}`}
                fill={ref("bodyGrad")}
                stroke="#9dffd8"
                strokeOpacity="0.6"
                strokeWidth="1.1"
              />
              <use href={`#${id("legBones")}`} />
            </g>
            <g transform="rotate(-14 205 212)">
              <use
                href={`#${id("arm")}`}
                fill={ref("bodyGrad")}
                stroke="#9dffd8"
                strokeOpacity="0.6"
                strokeWidth="1.1"
              />
              <use href={`#${id("armBones")}`} />
            </g>
          </g>

          {/* body */}
          <use href={`#${id("body")}`} fill={ref("bodyGrad")} />
          <g clipPath={ref("clipBody")}>
            <circle cx="215" cy="275" r="125" fill={ref("chest")} />
            {/* abdomen */}
            <g
              fill="none"
              stroke="#b4ff9a"
              strokeOpacity="0.5"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d={STOMACH} fill="#7dff5a" fillOpacity="0.14" />
              {GUT.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>

          {/* skeleton + organs */}
          <g filter={ref("glow")}>
            {/* skull + brain */}
            <g
              fill="none"
              stroke="#d6ffe9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <ellipse
                cx="200"
                cy="78"
                rx="46"
                ry="50"
                strokeOpacity="0.5"
                strokeWidth="1.4"
                fill="#5dffa8"
                fillOpacity="0.07"
              />
              <path d={BRAIN} strokeOpacity="0.4" strokeWidth="1.2" />
              {BRAIN_LINES.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  className="man-flow"
                  stroke="#aaffd0"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
              <circle
                cx="234"
                cy="78"
                r="10"
                strokeOpacity="0.9"
                strokeWidth="1.4"
              />
              <circle
                cx="234"
                cy="78"
                r="3"
                fill="#f2fff8"
                stroke="none"
                className="man-pulse"
                style={{ transformOrigin: "234px 78px" }}
              />
              <path
                d="M252 92 L244 106 L254 104"
                strokeOpacity="0.8"
                strokeWidth="1.3"
              />
              <path
                d="M206 112 C206 130 220 140 244 136 L250 128"
                strokeOpacity="0.85"
                strokeWidth="1.5"
              />
              <path
                d="M232 118 L250 118 M234 122 L250 122"
                strokeOpacity="0.7"
                strokeWidth="1.2"
              />
              <circle
                cx="190"
                cy="92"
                r="7"
                strokeOpacity="0.6"
                strokeWidth="1.2"
              />
              <path
                d="M214 112 L236 112"
                strokeOpacity="0.5"
                strokeWidth="1.2"
              />
            </g>

            {/* spine */}
            <g>
              {VERTEBRAE.map((v, i) => (
                <g
                  key={i}
                  transform={`translate(${v.x.toFixed(1)} ${v.y.toFixed(
                    1
                  )}) rotate(${v.deg.toFixed(1)})`}
                >
                  <rect
                    x={-v.w / 2}
                    y={-v.h / 2}
                    width={v.w}
                    height={v.h}
                    rx={v.h * 0.38}
                    fill="#5dffa8"
                    fillOpacity="0.16"
                    stroke="#d6ffe9"
                    strokeOpacity="0.85"
                    strokeWidth="1.1"
                  />
                  <path
                    d={`M${-v.w / 2} 0 L${-v.w / 2 - 6} ${v.h * 0.45}`}
                    stroke="#d6ffe9"
                    strokeOpacity="0.7"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </g>

            {/* thorax (breathes) */}
            <g className="man-breathe">
              <path
                d={LUNG_A}
                fill={ref("lung")}
                stroke="#c8ffa0"
                strokeOpacity="0.6"
                strokeWidth="1.2"
              />
              <path
                d={LUNG_B}
                fill={ref("lung")}
                stroke="#c8ffa0"
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />
              <g
                fill="none"
                stroke="#e6ffd0"
                strokeOpacity="0.7"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                {BRONCHI.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g fill="none" stroke="#d6ffe9" strokeLinecap="round">
                {RIBS.map((r, i) => (
                  <g key={i}>
                    <path
                      d={r.d}
                      stroke="#5dffa8"
                      strokeOpacity="0.22"
                      strokeWidth={r.w + 3}
                    />
                    <path d={r.d} strokeOpacity="0.9" strokeWidth={r.w * 0.6} />
                  </g>
                ))}
                <Bone d="M232 198 C240 240 246 290 246 332 L243 346" w={7} />
              </g>
            </g>

            {/* heart */}
            <g className="man-heart">
              <circle cx="228" cy="296" r="26" fill={ref("heart")} />
              <ellipse
                cx="228"
                cy="296"
                rx="12"
                ry="15"
                fill="#f4ffd0"
                fillOpacity="0.4"
              />
            </g>

            {/* clavicle + scapula */}
            <Bone d="M228 192 C214 186 196 190 182 200" w={5} />
            <path
              d="M160 214 L192 232 L176 300 Q162 280 160 214 Z"
              fill="#5dffa8"
              fillOpacity="0.07"
              stroke="#d6ffe9"
              strokeOpacity="0.7"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />

            {/* pelvis */}
            <g
              fill="none"
              stroke="#d6ffe9"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path
                d="M150 420 C140 450 156 492 196 500 C226 504 244 486 242 452 C240 436 226 428 214 432 C200 420 176 410 150 420 Z"
                fill="#5dffa8"
                fillOpacity="0.08"
                strokeOpacity="0.85"
                strokeWidth="1.4"
              />
              <path
                d="M172 428 L178 470 L160 466 Z"
                strokeOpacity="0.7"
                strokeWidth="1.2"
              />
              <circle
                cx="222"
                cy="478"
                r="9"
                strokeOpacity="0.6"
                strokeWidth="1.2"
              />
              <Ring cx={204} cy={494} r={12} />
            </g>

            {/* near leg */}
            <use href={`#${id("legBones")}`} />
          </g>

          {/* body rim light */}
          <use
            href={`#${id("body")}`}
            fill="none"
            stroke="#7dffc8"
            strokeOpacity="0.45"
            strokeWidth="5"
            filter={ref("soft")}
          />
          <use
            href={`#${id("body")}`}
            fill="none"
            stroke="#d8fff0"
            strokeOpacity="0.95"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          {/* near arm (in front of the torso) */}
          <g transform="rotate(5 205 212)">
            <use href={`#${id("arm")}`} fill={ref("bodyGrad")} />
            <g filter={ref("glow")}>
              <use href={`#${id("armBones")}`} />
            </g>
            <use
              href={`#${id("arm")}`}
              fill="none"
              stroke="#7dffc8"
              strokeOpacity="0.4"
              strokeWidth="5"
              filter={ref("soft")}
            />
            <use
              href={`#${id("arm")}`}
              fill="none"
              stroke="#d8fff0"
              strokeOpacity="0.95"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d={FLOW_ARM}
              className="man-flow"
              fill="none"
              stroke="#aaffd0"
              strokeOpacity="0.55"
              strokeWidth="1.3"
            />
            {!calm && (
              <g filter={ref("glow")}>
                {PARTICLES.arm.map((p, i) => (
                  <Flow key={i} {...p} />
                ))}
              </g>
            )}
          </g>

          {/* energy flow along nerves */}
          <g
            fill="none"
            stroke="#aaffd0"
            strokeOpacity="0.55"
            strokeWidth="1.3"
          >
            <path d={FLOW_SPINE} className="man-flow" />
            <path d={FLOW_HEAD} className="man-flow" />
            <path d={FLOW_LEG} className="man-flow" />
          </g>
          {!calm && (
            <g filter={ref("glow")}>
              {[...PARTICLES.torso, ...PARTICLES.leg].map((p, i) => (
                <Flow key={i} {...p} />
              ))}
            </g>
          )}

          {/* glowing joints */}
          <g>
            {JOINTS.map((j, i) => (
              <g key={i}>
                <circle
                  cx={j.x}
                  cy={j.y}
                  r={j.r * 3.4}
                  fill={ref("joint")}
                  className="man-pulse"
                  style={{
                    transformOrigin: `${j.x}px ${j.y}px`,
                    animationDelay: `${j.delay}s`,
                  }}
                />
                <circle
                  cx={j.x}
                  cy={j.y}
                  r={j.r}
                  fill="#f2fff8"
                  fillOpacity="0.9"
                />
              </g>
            ))}
          </g>

          {/* x-ray scan band */}
          <g clipPath={ref("clip")}>
            <g className="man-scan">
              <rect x="0" y="0" width="400" height="140" fill={ref("scan")} />
            </g>
          </g>
        </g>

        {/* drifting sparks */}
        <g fill="#b8ffd8">
          {DUST.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              className="man-spark"
              style={{
                animationDuration: `${d.dur}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
