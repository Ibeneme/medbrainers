"use client";

import { useEffect, useRef } from "react";
import { PRIMARY_COLOR, SECONDARY_COLOR } from "@/constants/colors";

/* -------------------------------------------------------------------------- */
/*  <Dna />  animated glossy DNA double helix (extra motion version)           */
/*  Motion layers:                                                             */
/*   1. spin that speeds up / slows down (twist "breathing")                   */
/*   2. helix radius pulses + a travelling wave bends the spine                */
/*   3. light pulses travel up the strands and ignite the rungs they pass      */
/*   4. glossy beads on every rung end, rungs stretch and shimmer              */
/*   5. floating particles drift upward around the helix                       */
/*   6. soft pointer parallax (smoothed)                                       */
/*   7. intro: helix grows + fades in on mount                                 */
/*   8. colour drift: strands/beads slowly blend SECONDARY <-> PRIMARY         */
/*   9. energy rings + comet sparks ride along with each light pulse           */
/*  10. rungs "unzip" in a wave, then zip shut again                           */
/*  11. scroll speeds up the spin; click/tap fires a ripple along the helix    */
/*  12. heartbeat: the whole helix "thumps" with a double-beat every ~3.6s     */
/*  13. twist wobble + shimmering ribbon width                                 */
/*  14. colour-coded base pairs (4 tones) with random flashes                  */
/*  15. orbiting satellites with comet trails                                  */
/*  16. drifting aurora glow + twinkling star sparkles                         */
/*  17. cursor glow: ribbons and beads light up near the pointer               */
/*  18. water hover: bubbles, ripple rings, liquid wobble; click = burst       */
/*  19. scanner beam sweeping along the helix                                  */
/*  20. base letters (A T C G) pop out next to lit rungs                       */
/*  21. neural links between satellites and nearest bead                       */
/*  22. ECG trace behind the lead light pulse                                  */
/*  23. heartbeat shockwave ring                                               */
/*  24. gentle float                                                           */
/*                                                                             */
/*  MOBILE FIXES                                                               */
/*   - zero-size guard (waits for real layout, ResizeObserver redraws)         */
/*   - wrapper has a min-height so a collapsed parent can't hide it            */
/*   - reduced-motion now slows the animation instead of freezing/hiding it    */
/*   - draw() is wrapped in try/catch and canvas state is reset on error       */
/*   - safer colour parsing, steadier 30fps throttle on touch devices          */
/*                                                                             */
/*  Still pauses off-screen / hidden tab.                                      */
/*  Usage: put it inside a `relative` parent; it fills the parent.             */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;

/* ---------------------------------- tuning --------------------------------- */
const SAMPLES = 150; // segments per strand
const RUNGS = 26; // base pairs
const TURNS = 3.1; // full twists across the helix
const SPEED = 0.7; // base rotation speed (rad/s)
const S_MIN = -0.06;
const S_MAX = 1.06;
const PULSES = 3; // light packets travelling along the helix
const PULSE_SPEED = 0.11; // fraction of helix per second
const PULSE_WIDTH = 0.055;
const PARTICLES = 46;
const INTRO = 1.8; // seconds
const REDUCED_MOTION_SLOWDOWN = 0.35; // time scale when the OS asks for less motion

const SCAN_PERIOD = 7.5; // seconds per scan cycle (sweep + rest)
const SCAN_WIDTH = 0.045; // beam thickness along the helix
const BASES = ["A", "T", "C", "G"]; // index ^ 1 gives the complement pair
const ECG_LEN = 0.3; // length of the ECG trail (fraction of helix)

/* one heartbeat: P wave, QRS complex, T wave */
const ecgShape = (p: number) =>
  0.12 * Math.exp(-Math.pow((p - 0.15) / 0.04, 2)) -
  0.15 * Math.exp(-Math.pow((p - 0.38) / 0.015, 2)) +
  1.0 * Math.exp(-Math.pow((p - 0.42) / 0.018, 2)) -
  0.3 * Math.exp(-Math.pow((p - 0.46) / 0.018, 2)) +
  0.25 * Math.exp(-Math.pow((p - 0.7) / 0.06, 2));

/* safe hex parser: accepts #rgb / #rrggbb, falls back to grey if invalid */
function parseHex(hex: string): [number, number, number] {
  let c = (hex || "").trim().replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  const n = parseInt(c, 16);
  if (c.length !== 6 || Number.isNaN(n)) return [136, 136, 136];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* Safari is strict: addColorStop throws on colours it can't parse, and
   tiny alphas print as "1e-7" which older iOS versions reject. So every
   alpha is clamped to 0..1, forced finite and rounded to 3 decimals. */
const safeA = (a: number) =>
  Number.isFinite(a) ? Math.round(Math.min(1, Math.max(0, a)) * 1000) / 1000 : 0;

function hexToRgba(hex: string, alpha: number) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${safeA(alpha)})`;
}

const white = (alpha: number) => `rgba(255,255,255,${safeA(alpha)})`;

function mixHex(a: string, b: string, m: number) {
  const A = parseHex(a);
  const B = parseHex(b);
  const h = (i: number) =>
    Math.round(A[i] + (B[i] - A[i]) * m)
      .toString(16)
      .padStart(2, "0");
  return `#${h(0)}${h(1)}${h(2)}`;
}

const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

type Item = { z: number; draw: () => void };
type Bubble = {
  x: number;
  y: number;
  r: number;
  vy: number;
  life: number;
  ph: number;
  wf: number;
  wa: number;
  t0: number;
};
type Particle = {
  s: number; // position along spine
  off: number; // sideways offset (in helix radii)
  speed: number;
  size: number;
  phase: number;
  front: boolean;
};

type DnaProps = {
  className?: string;
  useWhite?: boolean;
};

export default function Dna({ className = "", useWhite = false }: DnaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const activeColor = useWhite ? "#ffffff" : SECONDARY_COLOR;
    const accentBase = useWhite ? "#ffffff" : PRIMARY_COLOR;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    /* reduced motion: keep it visible, just calmer */
    const slow = reduce ? REDUCED_MOTION_SLOWDOWN : 1;

    // Mobile / touch performance tuning
    const lite =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const samples = lite ? 90 : SAMPLES;
    const rungs = lite ? 18 : RUNGS;
    const particleCount = lite ? 24 : PARTICLES;
    const starCount = lite ? 14 : 28;
    const maxBubbles = lite ? 30 : 70;
    let clearTimer = 0;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let scrollY = 0;

    /* pointer parallax (smoothed) */
    let targetX = 0;
    let targetY = 0;
    let px = 0;
    let py = 0;

    /* spin is integrated so scroll can add momentum */
    let spinAcc = 0;
    let boost = 0;
    let lastScrollY = window.scrollY;
    const ripples: { s0: number; t0: number }[] = [];
    let mouseX = -9999;
    let mouseY = -9999;
    const bubbles: Bubble[] = [];
    const rings: { x: number; y: number; t0: number }[] = [];
    let spawnAcc = 0;
    let lastBX = 0;
    let lastBY = 0;
    let lastRing = 0;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.6 + Math.random() * 1.4,
      phase: Math.random() * TAU,
      speed: 0.6 + Math.random() * 1.4,
    }));

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      s: Math.random(),
      off: (Math.random() * 2 - 1) * 2.2,
      speed: 0.015 + Math.random() * 0.04,
      size: 0.8 + Math.random() * 2.2,
      phase: Math.random() * TAU,
      front: Math.random() > 0.5,
    }));

    const updateScroll = () => {
      const rect = wrap.getBoundingClientRect();
      scrollY = window.innerHeight * 0.5 - (rect.top + rect.height * 0.5);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      /* layout not ready yet (collapsed parent / hidden): wait for the
         ResizeObserver to call us again with a real size */
      if (w === 0 || h === 0) {
        W = 0;
        H = 0;
        return;
      }
      W = w;
      H = h;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      updateScroll();
    };

    /* centre line: bottom-left -> top-right, S bend + travelling wave,
       plus a slow float so the whole helix feels suspended */
    const spine = (s: number, t: number, par: number) => ({
      x:
        W * (0.1 + 0.8 * s) +
        Math.sin(s * 5.2 + t * 0.45) * W * 0.04 +
        Math.sin(t * 0.23) * W * 0.012 +
        px,
      y:
        H * (1.08 - 1.16 * s) +
        par +
        py +
        Math.cos(s * 3.4 + t * 0.35) * H * 0.025 +
        Math.sin(s * 9 - t * 1.4) * H * 0.012 +
        Math.cos(t * 0.19) * H * 0.01,
    });

    const draw = (t: number) => {
      /* nothing to draw until the canvas has a real size */
      if (!W || !H) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);

      /* smooth pointer */
      px += (targetX - px) * 0.05;
      py += (targetY - py) * 0.05;

      const intro = easeOut(t / INTRO);
      ctx.globalAlpha = 0.15 + 0.85 * intro;
      /* colour drifts between the two brand colours */
      const accent = mixHex(
        activeColor,
        accentBase,
        0.5 + 0.5 * Math.sin(t * 0.6)
      );

      const par = reduce ? 0 : scrollY * 0.12;
      const rBase =
        Math.max(
          1,
          Math.min(Math.max(W * 0.1, 60), H * 0.2, 150)
        ) *
        (0.55 + 0.45 * intro);

      /* twist speed breathes: fast, slow, fast */
      const spin = spinAcc + Math.sin(t * 0.5) * 0.9;

      /* heartbeat: lub-dub every 3.6s */
      const beatT = t % 3.6;
      const beat =
        Math.exp(-Math.pow((beatT - 0.2) / 0.09, 2)) +
        0.6 * Math.exp(-Math.pow((beatT - 0.5) / 0.09, 2));

      /* scanner beam: sweeps the helix for ~72% of the cycle, then rests */
      const scanPh = (t % SCAN_PERIOD) / SCAN_PERIOD;
      const scanOn = scanPh < 0.72;
      const scanK = scanOn ? scanPh / 0.72 : 0;
      const scanS = S_MIN - 0.06 + (S_MAX - S_MIN + 0.12) * scanK;
      const scanAmt = scanOn ? Math.pow(Math.sin(scanK * Math.PI), 0.5) : 0;
      const scanGlow = (s: number) =>
        scanAmt > 0
          ? scanAmt * Math.exp(-Math.pow((s - scanS) / SCAN_WIDTH, 2))
          : 0;

      /* cursor proximity (0..1) */
      const hov = (x: number, y: number) =>
        Math.max(0, 1 - Math.hypot(x - mouseX, y - mouseY) / 150);

      /* pulse centres along the helix (0..1 -> S_MIN..S_MAX) */
      const pulsePos: number[] = [];
      for (let j = 0; j < PULSES; j++) {
        const p = (t * PULSE_SPEED + j / PULSES) % 1;
        pulsePos.push(S_MIN + (S_MAX - S_MIN) * p);
      }
      const glowAt = (s: number) => {
        let g = 0;
        for (const c of pulsePos) {
          const d = (s - c) / PULSE_WIDTH;
          g += Math.exp(-d * d);
        }
        /* click ripples: an expanding ring that fades out */
        for (const rp of ripples) {
          const age = t - rp.t0;
          if (age < 0 || age > 2.4) continue;
          const d2 = (Math.abs(s - rp.s0) - age * 0.32) / 0.045;
          g += Math.exp(-d2 * d2) * (1 - age / 2.4);
        }
        /* scanner beam */
        g += 0.9 * scanGlow(s);
        return Math.min(1, g);
      };

      type P = {
        x: number;
        y: number;
        z: number;
        w: number;
        ps: number;
        g: number;
      };

      const frame = (s: number) => {
        const a = spine(s - 0.002, t, par);
        const b = spine(s + 0.002, t, par);
        const c = spine(s, t, par);
        let tx = b.x - a.x;
        let ty = b.y - a.y;
        const l = Math.hypot(tx, ty) || 1;
        tx /= l;
        ty /= l;
        const ps = 0.5 + 0.7 * (1 - Math.min(1, Math.max(0, s)));
        /* radius pulses along the length */
        const breathe = 1 + 0.09 * Math.sin(t * 1.1 - s * 7) + 0.1 * beat;
        return { c, nx: -ty, ny: tx, ps, R: rBase * ps * breathe };
      };

      const strandPoint = (s: number, k: 0 | 1): P => {
        const f = frame(s);
        const th =
          s * TURNS * TAU +
          spin +
          k * Math.PI +
          0.45 * Math.sin(s * 4 - t * 1.2);
        const off = f.R * Math.cos(th);
        /* water wobble: points ripple away from / toward the cursor */
        let wx = 0;
        let wy = 0;
        if (mouseX > -1000) {
          const ddx = f.c.x + f.nx * off - mouseX;
          const ddy = f.c.y + f.ny * off - mouseY;
          const dd = Math.hypot(ddx, ddy) || 1;
          if (dd < 170) {
            const fall = Math.pow(1 - dd / 170, 2);
            const push = 16 * fall * Math.sin(dd * 0.09 - t * 7);
            wx = (ddx / dd) * push;
            wy = (ddy / dd) * push;
          }
        }
        return {
          x: f.c.x + f.nx * off + wx,
          y: f.c.y + f.ny * off + wy,
          z: Math.sin(th),
          w:
            f.R *
            0.3 *
            (0.3 + 0.7 * Math.abs(Math.sin(th))) *
            (1 + 0.12 * Math.sin(s * 60 - t * 5)),
          ps: f.ps,
          g: glowAt(s),
        };
      };

      const items: Item[] = [];
      const strands: P[][] = [[], []];
      /* collected for the neural-link layer */
      const heads: { x: number; y: number }[] = [];
      const beadPts: { x: number; y: number }[] = [];

      for (let k = 0 as 0 | 1; k < 2; k = (k + 1) as 0 | 1) {
        for (let i = 0; i <= samples; i++) {
          strands[k].push(
            strandPoint(S_MIN + ((S_MAX - S_MIN) * i) / samples, k)
          );
        }
      }

      /* soft glow behind everything (swells with time) */
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      /* drifting aurora blobs */
      for (let i = 0; i < 2; i++) {
        const cx = W * (0.3 + 0.4 * i + 0.12 * Math.sin(t * 0.15 + i * 2));
        const cy = H * (0.5 + 0.25 * Math.cos(t * 0.12 + i * 3));
        const rr = Math.max(W, H) * 0.35;
        const ag = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        const ac = i ? accent : activeColor;
        ag.addColorStop(0, hexToRgba(ac, 0.07));
        ag.addColorStop(1, hexToRgba(ac, 0));
        ctx.fillStyle = ag;
        ctx.fillRect(0, 0, W, H);
      }
      /* twinkling sparkles */
      ctx.lineWidth = 1;
      for (const st of stars) {
        const tw = Math.max(0, Math.sin(t * st.speed + st.phase));
        if (tw < 0.05) continue;
        const x = st.x * W + px * 0.5;
        const y = st.y * H;
        const sr = st.size * 3 * tw;
        ctx.strokeStyle = hexToRgba(accent, 0.6 * tw);
        ctx.beginPath();
        ctx.moveTo(x - sr, y);
        ctx.lineTo(x + sr, y);
        ctx.moveTo(x, y - sr);
        ctx.lineTo(x, y + sr);
        ctx.stroke();
      }
      /* cursor glow */
      if (mouseX > -1000) {
        const cg = ctx.createRadialGradient(
          mouseX,
          mouseY,
          0,
          mouseX,
          mouseY,
          120
        );
        cg.addColorStop(0, hexToRgba(accent, 0.14));
        cg.addColorStop(1, hexToRgba(accent, 0));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 120, 0, TAU);
        ctx.fill();
      }

      /* heartbeat shockwave: a ring leaves the helix on every beat */
      const sw = beatT - 0.2;
      if (sw > 0 && sw < 1.8) {
        const k = sw / 1.8;
        const c0 = spine(0.5, t, par);
        const rx = Math.max(0.5, easeOut(k) * Math.max(W, H) * 0.6);
        ctx.beginPath();
        ctx.ellipse(c0.x, c0.y, rx, rx * 0.6, -0.5, 0, TAU);
        ctx.strokeStyle = hexToRgba(accent, 0.22 * (1 - k));
        ctx.lineWidth = 1 + 2 * (1 - k);
        ctx.stroke();
      }

      const glowAlpha = 0.06 + 0.035 * Math.sin(t * 1.3);
      for (const pts of strands) {
        ctx.beginPath();
        pts.forEach((p, i) =>
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
        );
        ctx.strokeStyle = hexToRgba(activeColor, glowAlpha);
        ctx.lineWidth = rBase * 0.9;
        ctx.stroke();
      }
      /* travelling pulse halos */
      for (const pts of strands) {
        for (let i = 0; i < pts.length; i += 3) {
          const p = pts[i];
          if (p.g < 0.08) continue;
          const r = Math.max(0.5, rBase * 0.5 * p.ps * p.g);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          grad.addColorStop(0, hexToRgba(accent, 0.28 * p.g));
          grad.addColorStop(1, hexToRgba(accent, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
        }
      }
      /* energy rings around the helix at each pulse */
      for (const c of pulsePos) {
        if (c < 0 || c > 1) continue;
        const f = frame(c);
        const pr = 0.5 + 0.5 * Math.sin(t * 3 + c * 10);
        ctx.beginPath();
        ctx.ellipse(
          f.c.x,
          f.c.y,
          Math.max(0.5, f.R * (1.3 + 0.3 * pr)),
          Math.max(0.5, f.R * 0.3),
          Math.atan2(f.ny, f.nx),
          0,
          TAU
        );
        ctx.strokeStyle = hexToRgba(accent, 0.3 + 0.2 * pr);
        ctx.lineWidth = Math.max(1, 1.8 * f.ps);
        ctx.stroke();
      }

      /* scanner beam: a bright plane with a fading trail behind it */
      if (scanAmt > 0.02) {
        for (let i = 0; i < 8; i++) {
          const f = frame(scanS - i * 0.006);
          const a = scanAmt * (1 - i / 8);
          const half = f.R * 2.1;
          ctx.beginPath();
          ctx.moveTo(f.c.x - f.nx * half, f.c.y - f.ny * half);
          ctx.lineTo(f.c.x + f.nx * half, f.c.y + f.ny * half);
          ctx.strokeStyle = hexToRgba(accent, 0.5 * a);
          ctx.lineWidth =
            i === 0
              ? Math.max(1.2, 2.2 * f.ps)
              : Math.max(1, 5 * f.ps * (1 - i / 8));
          ctx.stroke();
          if (i === 0) {
            ctx.strokeStyle = white(0.7 * a);
            ctx.lineWidth = Math.max(0.8, 1 * f.ps);
            ctx.stroke();
          }
        }
      }

      /* ECG trace riding behind the lead light pulse */
      const hs = pulsePos[0];
      if (hs > S_MIN && hs < S_MAX) {
        let prev: { x: number; y: number } | null = null;
        let lastF: ReturnType<typeof frame> | null = null;
        for (let s = hs - ECG_LEN; s <= hs; s += 0.004) {
          if (s < S_MIN) continue;
          const f = frame(s);
          const env = 1 - (hs - s) / ECG_LEN;
          const p = ((hs - s) * 9) % 1;
          const off = ecgShape(p) * f.R * 1.5 * Math.pow(env, 0.8);
          const x = f.c.x + f.nx * off;
          const y = f.c.y + f.ny * off;
          if (prev) {
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = hexToRgba(accent, 0.65 * env);
            ctx.lineWidth = Math.max(1, 1.8 * f.ps * env + 0.4);
            ctx.stroke();
          }
          prev = { x, y };
          lastF = f;
        }
        if (prev && lastF) {
          ctx.beginPath();
          ctx.arc(prev.x, prev.y, Math.max(1.5, 3 * lastF.ps), 0, TAU);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      /* comet sparks trailing behind each pulse */
      for (const c of pulsePos) {
        for (let i = 1; i <= 7; i++) {
          const ss = c - i * 0.011;
          if (ss < S_MIN) continue;
          const fade = 1 - i / 8;
          for (const k of [0, 1] as const) {
            const sp = strandPoint(ss, k);
            items.push({
              z: sp.z + 0.02,
              draw: () => {
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, Math.max(0.8, 3.2 * sp.ps * fade), 0, TAU);
                ctx.fillStyle = white(0.75 * fade);
                ctx.fill();
              },
            });
          }
        }
      }

      /* orbiting satellites with trails */
      for (let i = 0; i < 5; i++) {
        const s0 = 0.18 + i * 0.16 + 0.04 * Math.sin(t * 0.4 + i);
        const f = frame(s0);
        const rot = t * (1.2 + 0.25 * i) + i * 1.7;
        const orb = f.R * (1.7 + 0.25 * Math.sin(t * 0.9 + i));
        for (let j = 0; j < 9; j++) {
          const ang = rot - j * 0.13;
          const ox = Math.cos(ang) * orb;
          const oz = Math.sin(ang);
          const x = f.c.x + f.nx * ox + f.ny * oz * orb * 0.28;
          const y = f.c.y + f.ny * ox - f.nx * oz * orb * 0.28;
          const fade = 1 - j / 9;
          if (j === 0) heads.push({ x, y });
          items.push({
            z: oz * 1.2,
            draw: () => {
              ctx.beginPath();
              ctx.arc(
                x,
                y,
                Math.max(0.8, (j === 0 ? 5 : 3.5) * f.ps * fade),
                0,
                TAU
              );
              ctx.fillStyle =
                j === 0
                  ? "rgba(255,255,255,0.9)"
                  : hexToRgba(accent, 0.55 * fade);
              ctx.fill();
            },
          });
        }
      }

      /* particles */
      for (const pa of particles) {
        const s = ((pa.s + t * pa.speed) % 1.1) - 0.05;
        const f = frame(s);
        const sway = Math.sin(t * 0.8 + pa.phase) * f.R * 0.25;
        const x = f.c.x + f.nx * (pa.off * f.R + sway);
        const y =
          f.c.y + f.ny * (pa.off * f.R + sway) - Math.sin(t + pa.phase) * 6;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + pa.phase));
        items.push({
          z: pa.front ? 1.5 : -1.5,
          draw: () => {
            ctx.beginPath();
            ctx.arc(x, y, Math.max(0.3, pa.size * f.ps), 0, TAU);
            ctx.fillStyle = hexToRgba(activeColor, 0.5 * tw);
            ctx.fill();
          },
        });
      }

      /* ribbon quads */
      for (let k = 0; k < 2; k++) {
        const pts = strands[k];
        const col = k === 0 ? activeColor : mixHex(activeColor, accent, 0.45);
        for (let i = 0; i < pts.length - 1; i++) {
          const p = pts[i];
          const q = pts[i + 1];
          let dx = q.x - p.x;
          let dy = q.y - p.y;
          const l = Math.hypot(dx, dy) || 1;
          dx /= l;
          dy /= l;
          const nx = -dy;
          const ny = dx;
          const z = (p.z + q.z) / 2;
          const g = Math.min(1, (p.g + q.g) / 2 + 0.7 * hov(p.x, p.y));
          items.push({
            z,
            draw: () => {
              const lit = z * 0.5 + 0.5;
              const a = Math.min(1, 0.3 + 0.55 * lit + 0.3 * g);
              ctx.beginPath();
              ctx.moveTo(p.x - nx * p.w, p.y - ny * p.w);
              ctx.lineTo(p.x + nx * p.w, p.y + ny * p.w);
              ctx.lineTo(q.x + nx * q.w, q.y + ny * q.w);
              ctx.lineTo(q.x - nx * q.w, q.y - ny * q.w);
              ctx.closePath();
              ctx.fillStyle = hexToRgba(col, a);
              ctx.fill();
              ctx.strokeStyle = hexToRgba(col, a);
              ctx.lineWidth = 0.8;
              ctx.stroke();
              /* gloss, brighter where a pulse passes */
              const gloss = Math.max(0, 0.45 * (lit - 0.55)) + 0.5 * g;
              if (gloss > 0.02) {
                ctx.beginPath();
                ctx.moveTo(p.x + nx * p.w * 0.6, p.y + ny * p.w * 0.6);
                ctx.lineTo(q.x + nx * q.w * 0.6, q.y + ny * q.w * 0.6);
                ctx.strokeStyle = white(Math.min(0.9, gloss));
                ctx.lineWidth = Math.max(1, p.ps * 1.6);
                ctx.stroke();
              }
            },
          });
        }
      }

      /* base-pair rungs + glossy beads */
      for (let r = 0; r < rungs; r++) {
        const s = 0.02 + (0.96 * r) / (rungs - 1);
        const a = strandPoint(s, 0);
        const b = strandPoint(s, 1);
        /* the join point slides back and forth like the pair is "talking" */
        const slide = 0.5 + 0.12 * Math.sin(t * 1.6 + r * 0.7);
        const mx = a.x + (b.x - a.x) * slide;
        const my = a.y + (b.y - a.y) * slide;
        /* unzip wave: halves pull apart, then close again */
        const open = Math.pow(Math.max(0, Math.sin(t * 0.8 - s * 7)), 3) * 0.7;
        const aex = a.x + (mx - a.x) * (1 - open);
        const aey = a.y + (my - a.y) * (1 - open);
        const bex = b.x + (mx - b.x) * (1 - open);
        const bey = b.y + (my - b.y) * (1 - open);
        const wd = Math.max(1.5, 5.5 * a.ps) * (1 + 0.35 * a.g);
        /* base-pair colour code + occasional random flash */
        const tone = [0, 0.33, 0.66, 1][r % 4];
        const colA = mixHex(activeColor, accent, tone);
        const colB = mixHex(activeColor, accent, 1 - tone);
        const hsh =
          Math.sin(Math.floor(t * 2) * 12.9898 + r * 78.233) * 43758.5453;
        const flashAmt =
          hsh - Math.floor(hsh) > 0.93 ? Math.sin(((t * 2) % 1) * Math.PI) : 0;
        const g = Math.min(1, a.g + flashAmt);
        const shimmer = 0.5 + 0.5 * Math.sin(t * 2.2 + r);
        items.push({
          z: 0,
          draw: () => {
            ctx.lineCap = "round";
            ctx.lineWidth = wd;
            ctx.strokeStyle = hexToRgba(colA, 0.5 + 0.4 * g);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(aex, aey);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(colB, 0.3 + 0.4 * g);
            ctx.beginPath();
            ctx.moveTo(bex, bey);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.strokeStyle = white(0.15 + 0.25 * shimmer + 0.4 * g);
            ctx.lineWidth = Math.max(0.6, wd * 0.25);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - wd * 0.2);
            ctx.lineTo(aex, aey - wd * 0.2);
            ctx.stroke();
          },
        });
        /* beads sit on the strands, depth-sorted with the ribbons */
        for (const e of [a, b]) {
          beadPts.push({ x: e.x, y: e.y });
          items.push({
            z: e.z + 0.01,
            draw: () => {
              const rad = Math.max(
                0.5,
                wd * (1.25 + 0.2 * shimmer + 0.9 * hov(e.x, e.y))
              );
              const lit = e.z * 0.5 + 0.5;
              const grad = ctx.createRadialGradient(
                e.x - rad * 0.3,
                e.y - rad * 0.3,
                rad * 0.1,
                e.x,
                e.y,
                rad
              );
              grad.addColorStop(0, white(0.7 + 0.3 * g));
              grad.addColorStop(0.45, hexToRgba(accent, 0.6 + 0.35 * lit));
              grad.addColorStop(1, hexToRgba(activeColor, 0.35 + 0.3 * lit));
              ctx.beginPath();
              ctx.arc(e.x, e.y, rad, 0, TAU);
              ctx.fillStyle = grad;
              ctx.fill();
              /* a thin ring flares around beads the beam or a pulse touches */
              if (g > 0.45) {
                ctx.beginPath();
                ctx.arc(e.x, e.y, rad * (1.5 + 0.8 * g), 0, TAU);
                ctx.strokeStyle = hexToRgba(accent, 0.45 * g);
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            },
          });
        }
        /* base letters pop out beside lit rungs, always as a true pair */
        if (g > 0.3) {
          const la = Math.min(1, (g - 0.3) * 1.6);
          const letters = [BASES[r % 4], BASES[(r % 4) ^ 1]];
          [a, b].forEach((e, idx) => {
            const ddx = e.x - mx;
            const ddy = e.y - my;
            const dl = Math.hypot(ddx, ddy) || 1;
            const lx = e.x + (ddx / dl) * wd * 3.2;
            const ly = e.y + (ddy / dl) * wd * 3.2;
            items.push({
              z: e.z + 0.02,
              draw: () => {
                ctx.font = `${Math.max(
                  8,
                  11 * a.ps
                )}px ui-monospace, SFMono-Regular, Menlo, monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = hexToRgba(idx ? colB : colA, 0.9 * la);
                ctx.fillText(letters[idx], lx, ly);
              },
            });
          });
        }
      }

      /* painter's algorithm: back -> front */
      items.sort((m, n) => m.z - n.z);
      for (const it of items) it.draw();

      /* neural links: satellites connect to each other and the nearest bead */
      ctx.lineCap = "round";
      for (let i = 0; i < heads.length; i++) {
        const h = heads[i];
        if (i > 0) {
          const prevH = heads[i - 1];
          ctx.beginPath();
          ctx.moveTo(prevH.x, prevH.y);
          ctx.lineTo(h.x, h.y);
          ctx.strokeStyle = hexToRgba(accent, 0.14);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        let best: { x: number; y: number } | null = null;
        let bd = 150;
        for (const bp of beadPts) {
          const d = Math.hypot(bp.x - h.x, bp.y - h.y);
          if (d < bd) {
            bd = d;
            best = bp;
          }
        }
        if (best) {
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(best.x, best.y);
          ctx.strokeStyle = hexToRgba(accent, 0.35 * (1 - bd / 150));
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(h.x, h.y, 7 + 2 * Math.sin(t * 3 + i), 0, TAU);
        ctx.strokeStyle = hexToRgba(accent, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* water ripple rings from the cursor */
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i];
        const age = t - rg.t0;
        if (age > 1.3) {
          rings.splice(i, 1);
          continue;
        }
        const k = Math.max(0, age / 1.3);
        const rx = 18 + easeOut(k) * 150;
        ctx.lineWidth = 0.6 + 1.4 * (1 - k);
        ctx.strokeStyle = hexToRgba(accent, 0.38 * (1 - k));
        ctx.beginPath();
        ctx.ellipse(rg.x, rg.y, rx, rx * 0.42, 0, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(accent, 0.2 * (1 - k));
        ctx.beginPath();
        ctx.ellipse(rg.x, rg.y, rx * 0.6, rx * 0.6 * 0.42, 0, 0, TAU);
        ctx.stroke();
      }

      /* glossy water bubbles */
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const age = t - b.t0;
        const life = age / b.life;
        if (life >= 1) {
          bubbles.splice(i, 1);
          continue;
        }
        const popK = life > 0.85 ? (life - 0.85) / 0.15 : 0; // 0..1 while popping
        const x = b.x + Math.sin(age * b.wf + b.ph) * b.wa;
        const y = b.y - age * b.vy;
        const grow = 0.55 + 0.45 * easeOut(age / 0.35);
        const r = Math.max(0.5, b.r * grow * (1 + 0.4 * popK));
        const wob = 0.06 * Math.sin(age * 6 + b.ph);
        const rx = r * (1 + wob);
        const ry = r * (1 - wob);
        const al = Math.max(0, 1 - popK);

        /* body: clear in the middle, tinted toward the rim */
        const bg = ctx.createRadialGradient(
          x - rx * 0.2,
          y - ry * 0.2,
          rx * 0.1,
          x,
          y,
          rx
        );
        bg.addColorStop(0, hexToRgba(accent, 0.02 * al));
        bg.addColorStop(0.75, hexToRgba(accent, 0.1 * al));
        bg.addColorStop(1, hexToRgba(accent, 0.3 * al));
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
        ctx.fillStyle = bg;
        ctx.fill();
        /* rim */
        ctx.lineWidth = popK > 0 ? 1 : 1.3;
        ctx.strokeStyle = white(0.55 * al);
        ctx.stroke();
        if (popK === 0) {
          /* big highlight top-left */
          ctx.beginPath();
          ctx.ellipse(
            x - rx * 0.38,
            y - ry * 0.42,
            rx * 0.26,
            ry * 0.14,
            -0.7,
            0,
            TAU
          );
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.fill();
          /* small reflection bottom-right */
          ctx.beginPath();
          ctx.arc(
            x + rx * 0.42,
            y + ry * 0.4,
            Math.max(0.8, rx * 0.08),
            0,
            TAU
          );
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fill();
        } else {
          /* pop droplets */
          for (let d = 0; d < 6; d++) {
            const ang = (d / 6) * TAU + b.ph;
            const dist = r * (1 + popK * 0.9);
            ctx.beginPath();
            ctx.arc(
              x + Math.cos(ang) * dist,
              y + Math.sin(ang) * dist,
              Math.max(0.5, 1.8 * (1 - popK)),
              0,
              TAU
            );
            ctx.fillStyle = white(0.7 * al);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    /* draw wrapper: an exception can never kill the loop or leave the
       canvas in a broken state (wrong composite mode / alpha) */
    const safeDraw = (t: number) => {
      try {
        draw(t);
      } catch (err) {
        console.error("Dna draw failed:", err);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    };

    resize();

    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = true;

    const spawnBubble = (x: number, y: number, burst = false) => {
      if (bubbles.length > maxBubbles) bubbles.shift();
      const r = 4 + Math.random() * (burst ? 16 : 12);
      bubbles.push({
        x: x + (Math.random() - 0.5) * 28,
        y: y + (Math.random() - 0.5) * 18,
        r,
        vy: 25 + (16 - r) * 3 + Math.random() * 20,
        life: 1.6 + Math.random() * 1.6,
        ph: Math.random() * TAU,
        wf: 2 + Math.random() * 3,
        wa: 6 + Math.random() * 10,
        t0: t,
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      /* cap at ~30fps on touch screens to save battery */
      if (lite && last && now - last < 33) return;
      if (!last) last = now;
      const rawDt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dt = rawDt * slow;
      t += dt;
      boost *= Math.pow(0.12, dt); // momentum decays
      spinAcc += dt * (SPEED + boost);
      while (ripples.length && t - ripples[0].t0 > 2.4) ripples.shift();
      /* hovering the canvas makes bubbles (more when moving) + ripple rings */
      if (mouseX > 0 && mouseX < W && mouseY > 0 && mouseY < H) {
        const moved = Math.hypot(mouseX - lastBX, mouseY - lastBY);
        lastBX = mouseX;
        lastBY = mouseY;
        spawnAcc += dt * 5 + Math.min(moved, 60) * 0.06;
        while (spawnAcc >= 1) {
          spawnAcc -= 1;
          spawnBubble(mouseX, mouseY);
        }
        if (moved > 6 && t - lastRing > 0.28) {
          rings.push({ x: mouseX, y: mouseY, t0: t });
          lastRing = t;
        }
      }
      safeDraw(t);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onScroll = () => {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (!reduce) boost = Math.max(-6, Math.min(6, boost + dy * 0.01));
      updateScroll();
    };

    const onPointer = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      targetX = nx * W * 0.04;
      targetY = ny * H * 0.04;
      const rc = canvas.getBoundingClientRect();
      mouseX = e.clientX - rc.left;
      mouseY = e.clientY - rc.top;
    };

    const onDown = (e: PointerEvent) => {
      if (!W || !H) return;
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;
      const s = Math.min(
        1.05,
        Math.max(-0.05, ((e.clientX - rect.left) / W - 0.1) / 0.8)
      );
      ripples.push({ s0: s, t0: t });
      if (ripples.length > 6) ripples.shift();
      boost += 3;
      /* splash: ring + burst of bubbles */
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      rings.push({ x: cx, y: cy, t0: t });
      for (let i = 0; i < 12; i++) spawnBubble(cx, cy, true);

      if (e.pointerType !== "mouse") {
        window.clearTimeout(clearTimer);
        mouseX = cx;
        mouseY = cy;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        mouseX = -9999;
        mouseY = -9999;
      }, 700);
    };

    const onLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    /* fires whenever the canvas gets (or changes) its real size, which also
       covers the "parent had no height at first" mobile case */
    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) safeDraw(t);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      /* Safari can report 0-area/transformed elements as not intersecting;
         only pause when it is clearly off-screen */
      visible = e.isIntersecting || e.intersectionRatio > 0;
      if (visible && !document.hidden) start();
      else stop();
    });
    io.observe(wrap);

    const onVis = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("scroll", onScroll, { passive: true });
    /* mobile browsers resize the viewport when the address bar hides */
    window.addEventListener("orientationchange", resize);

    /* pointer effects are skipped for reduced motion */
    if (!reduce) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    /* always animate (slowly when reduced motion is on) */
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.clearTimeout(clearTimer);
    };
  }, [useWhite]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      /* min-h keeps it visible even if the parent collapses on mobile */
      className={`pointer-events-none absolute inset-0 min-h-[320px] overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}