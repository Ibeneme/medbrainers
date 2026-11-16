"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRIMARY_COLOR, SECONDARY_COLOR } from "@/constants/colors";
import ProductDescriptionHome from "./dna/product_description";
import ProductNameHome from "./dna/product_name";

type RGB = [number, number, number];

function parseHex(hex: string): RGB {
  let h = hex.trim().replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [37, 99, 235]; // fallback blue
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(base: RGB, target: RGB, amt: number): RGB {
  return [
    Math.round(base[0] + (target[0] - base[0]) * amt),
    Math.round(base[1] + (target[1] - base[1]) * amt),
    Math.round(base[2] + (target[2] - base[2]) * amt),
  ];
}

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const TAU = Math.PI * 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
const boost = (c: RGB, p: number): RGB =>
  p > 0.02 ? mix(c, WHITE, 0.75 * p) : c;

type Base = { z: number; e: number; p: number };
type Item =
  | (Base & {
      kind: "seg";
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      c: RGB;
    })
  | (Base & { kind: "rung"; x: number; y0: number; y1: number; c: RGB })
  | (Base & { kind: "node"; x: number; y: number; c: RGB })
  | (Base & { kind: "dot"; x: number; y: number });

const SIZE = 1.6;
const REVEAL_MS = 2800;
const PULSE_MS = 5200;

// Water cursor settings
const HOVER_R = 140;
const RIPPLE_LIFE = 1800;
const RIPPLE_REACH = 260;
const MAX_RIPPLES = 10;

// Custom cursor settings
const CURSOR_RING = 13;
const CURSOR_CORE = 3.2;
const CURSOR_LAG = 0.28;

type Solution = {
  title: string;
  description: string;
  href: string;
  variant: "deep" | "surface";
};

const SOLUTIONS: Solution[] = [
  {
    title: "Hospital Management System",
    description: "Comprehensive administration & coordination",
    href: "/solutions#hospital-management",
    variant: "deep",
  },
  {
    title: "Clinic Information System",
    description: "Scheduling, queue & practitioner tools",
    href: "/solutions#clinic-information",
    variant: "surface",
  },
  {
    title: "Electronic Medical Record (EMR)",
    description: "Clinical notes, vitals & patient history",
    href: "/solutions#emr",
    variant: "deep",
  },
  {
    title: "Industry Clinic System",
    description: "Workplace health & occupational services",
    href: "/solutions#industry-clinic",
    variant: "surface",
  },
  {
    title: "Dental Clinic Management",
    description: "Specialized charts & graphical odontograms",
    href: "/solutions#dental-clinic",
    variant: "surface",
  },
  {
    title: "Pharmacy Management System",
    description: "Dispensing, stock alerts & prescriptions",
    href: "/solutions#pharmacy-management",
    variant: "surface",
  },
  {
    title: "Hospital Records Management",
    description: "Secure digital archiving & fast retrieval",
    href: "/solutions#hospital-records",
    variant: "surface",
  },
  {
    title: "Operating Theatre Management",
    description: "Surgical checklists & real-time tracking",
    href: "/solutions#operating-theatre",
    variant: "surface",
  },
];

type Phase = "idle" | "typing" | "shown";

const SLOTS = [
  {
    pos: "left-[3%] top-[14%] md:left-[6%] md:top-[18%]",
    tail: "rounded-bl-md origin-bottom-left",
    delay: 2600,
  },
  {
    pos: "right-[3%] bottom-[16%] md:left-[36%] md:right-auto md:bottom-[18%]",
    tail: "rounded-br-md origin-bottom-right md:rounded-bl-md md:origin-bottom-left",
    delay: 3800,
  },
  {
    pos: "hidden md:block md:right-[6%] md:top-[22%]",
    tail: "rounded-br-md origin-bottom-right",
    delay: 5000,
  },
  {
    pos: "hidden lg:block lg:left-[62%] lg:bottom-[20%]",
    tail: "rounded-bl-md origin-bottom-left",
    delay: 6200,
  },
];

function Bubble({
  slot,
  index,
  next,
}: {
  slot: (typeof SLOTS)[number];
  index: number;
  next: () => Solution;
}) {
  const [sol, setSol] = useState<Solution | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let alive = true;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));

    (async () => {
      await wait(slot.delay);
      while (alive) {
        setSol(next());
        setPhase("typing");
        await wait(900);
        if (!alive) break;
        setPhase("shown");
        await wait(4200);
        if (!alive) break;
        setPhase("idle");
        await wait(1400);
      }
    })();

    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [slot.delay, next]);

  const deep = sol?.variant === "deep";
  const shown = phase === "shown";

  return (
    <div
      className={`pointer-events-none absolute z-25 motion-reduce:animate-none animate-[dnaFloat_7s_ease-in-out_infinite] ${slot.pos}`}
      style={{ animationDelay: `${index * -1.7}s` }}
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-0 flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/15 bg-black px-3.5 py-3 transition-opacity duration-300 ${
          phase === "typing" ? "opacity-100" : "opacity-0"
        }`}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>

      <a
        href={sol?.href ?? "#"}
        tabIndex={shown ? 0 : -1}
        aria-hidden={!shown}
        className={`block w-[min(15rem,70vw)] cursor-pointer rounded-2xl px-4 py-3 shadow-lg transition-all duration-500 ease-out ${
          slot.tail
        } border border-white/15 bg-black text-white ${
          deep ? "" : "border-white/15"
        } ${
          shown
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-90 opacity-0"
        }`}
      >
        <span className="block text-sm font-semibold leading-snug">
          {sol?.title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug opacity-75">
          {sol?.description}
        </span>
      </a>
    </div>
  );
}

function SolutionBubbles() {
  const counter = useRef(0);
  const next = useCallback(() => {
    const s = SOLUTIONS[counter.current % SOLUTIONS.length];
    counter.current += 1;
    return s;
  }, []);

  return (
    <>
      <style>{`@keyframes dnaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
      {SLOTS.map((slot, i) => (
        <Bubble key={i} slot={slot} index={i} next={next} />
      ))}
    </>
  );
}

export type HelixColor = "primary" | "secondary" | "gradient" | "white";

const shades = (base: RGB) => ({
  backboneA: mix(base, WHITE, 0.15),
  backboneB: mix(base, WHITE, 0.6),
  baseLight: mix(base, WHITE, 0.35),
  baseMain: base,
});
const WHITE_SHADES = {
  backboneA: WHITE,
  backboneB: mix(WHITE, BLACK, 0.45),
  baseLight: WHITE,
  baseMain: mix(WHITE, BLACK, 0.3),
};

type Ripple = { x: number; y: number; born: number };

export default function DnaSection({
  color = "primary",
}: {
  color?: HelixColor;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [customCursor, setCustomCursor] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const primary = parseHex(PRIMARY_COLOR);
    const secondary = parseHex(SECONDARY_COLOR);
    let palW = 1;
    const paletteAt = (x: number) => {
      if (color === "white") return WHITE_SHADES;
      if (color === "secondary") return shades(secondary);
      if (color === "primary") return shades(primary);
      const u = smooth((x + palW / 2) / palW);
      return shades(mix(primary, secondary, u));
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    setCustomCursor(!reduce && finePointer);

    let W = 0;
    let H = 0;
    let raf = 0;
    let start = -1;

    let px = 0.5;
    let py = 0.5;
    let tilt = 0;
    let lift = 0;

    let mx = 0;
    let my = 0;
    let inside = 0;
    let hover = 0;
    let lastSpawn = 0;
    let lastRx = -1e9;
    let lastRy = -1e9;
    let ripples: Ripple[] = [];

    let cursorOn = 0;
    let cursorVis = 0;
    let sx = 0;
    let sy = 0;
    let speed = 0;
    let down = false;
    let press = 0;
    let pendingClick = false;

    const inBand = (x: number, y: number) =>
      x >= 0 && x <= W && y >= 0 && y <= H;

    const onPointer = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth;
      py = e.clientY / window.innerHeight;
      const r = section.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      const m = 40;
      inside =
        mx > -m && mx < r.width + m && my > -m && my < r.height + m ? 1 : 0;

      const overLink = !!(e.target as Element | null)?.closest?.("a, button");
      const wantCursor =
        e.pointerType === "mouse" && inBand(mx, my) && !overLink;
      if (wantCursor && cursorVis < 0.05) {
        sx = mx;
        sy = my;
      }
      cursorOn = wantCursor ? 1 : 0;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = section.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!inBand(x, y)) return;
      if ((e.target as Element | null)?.closest?.("a, button")) return;
      down = true;
      pendingClick = true;
    };

    const onUp = () => {
      down = false;
    };

    const onLeave = () => {
      inside = 0;
      cursorOn = 0;
      down = false;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = section.clientWidth;
      H = section.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      palW = W;
    };

    const draw = (t: number, tt: number) => {
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      // Center the helix vertically within the whole section bounds
      const cy = H / 2;
      const fit = (H / 2 - 12 - (W / 2) * 0.09) / 1.35;
      const R0 =
        Math.max(24, Math.min(96 * SIZE, fit)) *
        (1 + 0.035 * Math.sin(t * 0.0012));
      const thick = 1 + (SIZE - 1) * 0.5;
      const pitch =
        Math.min(Math.max(W * 0.26, 300), 460) * (1 + (SIZE - 1) * 0.5);
      const k = TAU / pitch;
      const reveal = easeOutCubic(tt / REVEAL_MS);
      const phase = t * 0.0006 + (1 - reveal) * 3.2;
      const span = W * 0.62;
      const step = Math.max(11, W / 125);
      const sub = 3;

      const env = (x: number) => smooth((W / 2 - Math.abs(x)) / (W * 0.14));
      const revealR = reveal * (W / 2 + W * 0.2);
      const revEnv = (x: number) =>
        smooth((revealR - Math.abs(x)) / (W * 0.12));
      const radius = (x: number) => R0 * (0.4 + 0.6 * env(x));
      const at = (x: number, off: number) => {
        const a = x * k + phase + off;
        const z = Math.cos(a);
        const wob = Math.sin(x * 0.005 + t * 0.0006) * R0 * 0.2 * env(x);
        return { y: Math.sin(a) * radius(x) * (1 + 0.1 * z) + wob, z };
      };

      const pulseGain = clamp01((tt - REVEAL_MS * 0.8) / 800);
      const pulseX =
        -W * 0.55 + (((tt - REVEAL_MS * 0.8) % PULSE_MS) / PULSE_MS) * W * 1.1;
      const pw = W * 0.07;
      const pulseAt = (x: number) =>
        pulseGain > 0 ? Math.exp(-(((x - pulseX) / pw) ** 2)) * pulseGain : 0;

      const items: Item[] = [];

      for (let s = 0; s < 2; s++) {
        const off = s * Math.PI;
        for (let x = -span; x < span; x += sub) {
          const e = env(x) * revEnv(x);
          if (e <= 0) continue;
          const pal = paletteAt(x);
          const c = s === 0 ? pal.backboneA : pal.backboneB;
          const p0 = at(x, off);
          const p1 = at(x + sub, off);
          items.push({
            kind: "seg",
            z: (p0.z + p1.z) / 2,
            x0: x,
            y0: p0.y,
            x1: x + sub,
            y1: p1.y,
            c,
            e,
            p: pulseAt(x),
          });
        }
      }

      const i0 = Math.ceil(-span / step);
      const i1 = Math.floor(span / step);
      for (let i = i0; i <= i1; i++) {
        const x = i * step;
        const e = env(x) * revEnv(x);
        if (e <= 0) continue;
        const p = pulseAt(x);
        const pA = at(x, 0);
        const pB = at(x, Math.PI);
        const flip = ((i % 2) + 2) % 2 === 0;
        const pal = paletteAt(x);
        const cA = flip ? pal.baseLight : pal.baseMain;
        const cB = flip ? pal.baseMain : pal.baseLight;
        const gap = 0.44;
        items.push({
          kind: "rung",
          z: pA.z * 0.5,
          x,
          y0: pA.y,
          y1: pA.y + (pB.y - pA.y) * gap,
          c: cA,
          e,
          p,
        });
        items.push({
          kind: "rung",
          z: pB.z * 0.5,
          x,
          y0: pB.y,
          y1: pB.y + (pA.y - pB.y) * gap,
          c: cB,
          e,
          p,
        });
        items.push({ kind: "node", z: pA.z, x, y: pA.y, c: cA, e, p });
        items.push({ kind: "node", z: pB.z, x, y: pB.y, c: cB, e, p });
        items.push({ kind: "dot", z: 0, x, y: (pA.y + pB.y) / 2, e, p });
      }

      items.sort((a, b) => a.z - b.z);

      tilt += ((px - 0.5) * 0.06 - tilt) * 0.06;
      lift += ((py - 0.5) * 16 - lift) * 0.06;

      const rot = -0.06 + tilt;
      hover += (inside - hover) * 0.08;

      const ddx = mx - cx;
      const ddy = my - (cy + lift);
      const lx = ddx * Math.cos(rot) + ddy * Math.sin(rot);
      const ly = -ddx * Math.sin(rot) + ddy * Math.cos(rot);

      if (
        hover > 0.3 &&
        t - lastSpawn > 90 &&
        Math.hypot(lx - lastRx, ly - lastRy) > 28
      ) {
        ripples.push({ x: lx, y: ly, born: t });
        if (ripples.length > MAX_RIPPLES) ripples.shift();
        lastSpawn = t;
        lastRx = lx;
        lastRy = ly;
      }

      if (pendingClick) {
        pendingClick = false;
        ripples.push({ x: lx, y: ly, born: t });
        ripples.push({ x: lx, y: ly, born: t - 220 });
        while (ripples.length > MAX_RIPPLES) ripples.shift();
        lastSpawn = t;
        lastRx = lx;
        lastRy = ly;
      }
      ripples = ripples.filter((r) => t - r.born < RIPPLE_LIFE);

      const warp = (x: number, y: number) => {
        let ox = 0;
        let oy = 0;
        let inf = 0;
        if (hover > 0.001) {
          const dx = x - lx;
          const dy = y - ly;
          const d = Math.hypot(dx, dy) || 1;
          inf = hover * Math.exp(-((d / HOVER_R) ** 2));
          const push = inf * (16 + 7 * Math.sin(d * 0.085 - t * 0.007));
          ox += (dx / d) * push;
          oy += (dy / d) * push;
        }
        for (const rp of ripples) {
          const age = (t - rp.born) / RIPPLE_LIFE;
          const dx = x - rp.x;
          const dy = y - rp.y;
          const d = Math.hypot(dx, dy) || 1;
          const rr = easeOutCubic(age) * RIPPLE_REACH;
          const band = Math.exp(-(((d - rr) / 22) ** 2));
          const push = band * (1 - age) * 9 * Math.sin((d - rr) * 0.25);
          ox += (dx / d) * push;
          oy += (dy / d) * push;
          inf = Math.max(inf, band * (1 - age) * 0.6);
        }
        return [x + ox, y + oy, inf] as const;
      };

      ctx.save();
      ctx.translate(cx, cy + lift);
      ctx.rotate(rot);
      ctx.lineCap = "round";

      if (hover > 0.02) {
        const gc = paletteAt(lx).baseLight;
        const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, HOVER_R);
        glow.addColorStop(0, rgba(gc, 0.16 * hover));
        glow.addColorStop(1, rgba(gc, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, ly, HOVER_R, 0, TAU);
        ctx.fill();
      }

      for (const it of items) {
        const d = (it.z + 1) / 2;
        if (it.kind === "seg") {
          const [ax, ay, w0] = warp(it.x0, it.y0);
          const [bx, by, w1] = warp(it.x1, it.y1);
          const inf = (w0 + w1) / 2;
          const pp = clamp01(it.p + inf * 0.6);
          const al = clamp01((0.16 + 0.84 * d + 0.45 * pp) * it.e);
          ctx.lineWidth = (0.9 + 1.5 * d + 0.7 * pp) * thick * (1 + 0.5 * inf);
          ctx.strokeStyle = rgba(boost(it.c, pp), al);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        } else if (it.kind === "rung") {
          const [ax, ay, w0] = warp(it.x, it.y0);
          const [bx, by, w1] = warp(it.x, it.y1);
          const inf = (w0 + w1) / 2;
          const pp = clamp01(it.p + inf * 0.6);
          const al = clamp01((0.16 + 0.84 * d + 0.45 * pp) * it.e);
          const c = boost(it.c, pp);
          const g = ctx.createLinearGradient(ax, ay, bx, by);
          g.addColorStop(0, rgba(c, 0.9 * al));
          g.addColorStop(1, rgba(c, 0.3 * al));
          ctx.lineWidth = (0.9 + 0.6 * d + 0.4 * pp) * thick;
          ctx.strokeStyle = g;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        } else if (it.kind === "node") {
          const [x, y, inf] = warp(it.x, it.y);
          const pp = clamp01(it.p + inf * 0.6);
          const al = clamp01((0.16 + 0.84 * d + 0.45 * pp) * it.e);
          const r = (1.3 + 1.7 * d + 1.1 * pp) * thick * (1 + 0.45 * inf);
          ctx.fillStyle = rgba(boost(it.c, pp), al);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = rgba(WHITE, 0.35 * al);
          ctx.stroke();
        } else {
          const [x, y, inf] = warp(it.x, it.y);
          const pp = clamp01(it.p + inf * 0.6);
          ctx.fillStyle = rgba(WHITE, clamp01(0.5 + 0.5 * pp) * it.e);
          ctx.beginPath();
          ctx.arc(x, y, 0.9 + 0.6 * pp, 0, TAU);
          ctx.fill();
        }
      }

      for (const rp of ripples) {
        const age = (t - rp.born) / RIPPLE_LIFE;
        const rr = easeOutCubic(age) * RIPPLE_REACH;
        const fade = Math.pow(1 - age, 1.6);
        const rc = mix(paletteAt(rp.x).baseLight, WHITE, 0.4);
        ctx.strokeStyle = rgba(rc, 0.45 * fade);
        ctx.lineWidth = 0.6 + 1.6 * (1 - age);
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rr, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = rgba(rc, 0.25 * fade);
        ctx.lineWidth = 0.5 + 1.0 * (1 - age);
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rr * 0.72, 0, TAU);
        ctx.stroke();
      }

      ctx.restore();

      // Custom water-drop cursor
      cursorVis += (cursorOn - cursorVis) * 0.18;
      const dxm = mx - sx;
      const dym = my - sy;
      sx += dxm * CURSOR_LAG;
      sy += dym * CURSOR_LAG;
      speed += (Math.hypot(dxm, dym) - speed) * 0.15;
      press += ((down ? 1 : 0) - press) * 0.22;

      if (cursorVis > 0.01) {
        const v = cursorVis;
        const cc = mix(paletteAt(sx - cx).baseLight, WHITE, 0.5);
        const swell = Math.min(speed, 30) * 0.5;
        const ringR = Math.max(
          4,
          (CURSOR_RING + swell - press * 6) * (0.6 + 0.4 * v)
        );

        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, ringR * 2.4);
        halo.addColorStop(0, rgba(cc, 0.22 * v));
        halo.addColorStop(1, rgba(cc, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, ringR * 2.4, 0, TAU);
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(cc, 0.3 * v);
        ctx.beginPath();
        ctx.arc(
          sx,
          sy,
          ringR * (1.55 + 0.07 * Math.sin(t * 0.008)),
          0,
          TAU
        );
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rgba(cc, 0.85 * v);
        ctx.beginPath();
        ctx.arc(sx, sy, ringR, 0, TAU);
        ctx.stroke();

        const coreR = CURSOR_CORE * (1 + 0.35 * press) * (0.5 + 0.5 * v);
        ctx.fillStyle = rgba(WHITE, 0.95 * v);
        ctx.beginPath();
        ctx.arc(mx, my, coreR, 0, TAU);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(cc, 0.9 * v);
        ctx.stroke();
      }
    };

    const loop = (t: number) => {
      if (start < 0) start = t;
      draw(t, t - start);
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(1500, 1e9);
    });
    ro.observe(section);

    if (reduce) {
      draw(1500, 1e9);
    } else {
      window.addEventListener("pointermove", onPointer);
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [color]);

  return (
    <section
      ref={sectionRef}
      aria-label="Animated DNA double helix section"
      className={`relative flex w-full flex-col gap-8 overflow-hidden bg-black pb-32 text-white md:pt-32 ${
        customCursor ? "cursor-none" : ""
      }`}
    >
      {/* Background Canvas spanning the full section */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block h-full w-full z-0"
      />

      {/* Content Layer with pointer-events-auto for interactive elements */}
      <div className="relative z-10 flex flex-col gap-8 w-full">
        <ProductNameHome />
        <div className="relative h-[300px] sm:h-[420px] md:h-[520px] w-full">
          <SolutionBubbles />
        </div>
        <ProductDescriptionHome />
      </div>
    </section>
  );
}