"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRIMARY_COLOR, SECONDARY_COLOR } from "@/constants/colors";

type RGB = [number, number, number];

function parseHex(hex: string): RGB {
  let h = hex.trim().replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [37, 99, 235];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mix = (base: RGB, target: RGB, amt: number): RGB => [
  Math.round(base[0] + (target[0] - base[0]) * amt),
  Math.round(base[1] + (target[1] - base[1]) * amt),
  Math.round(base[2] + (target[2] - base[2]) * amt),
];

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const WHITE: RGB = [255, 255, 255];
const TAU = Math.PI * 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

const SLOTS = [
  {
    pos: "left-[3%] top-[2%] md:left-[6%] md:top-[8%]",
    tail: "rounded-bl-md origin-bottom-left",
    delay: 2600,
  },
  {
    pos: "right-[3%] top-[27%] md:left-[36%] md:right-auto md:top-auto md:bottom-[8%]",
    tail: "rounded-br-md origin-bottom-right md:rounded-bl-md md:origin-bottom-left",
    delay: 3800,
  },
  {
    pos: "left-[3%] top-[52%] md:left-auto md:right-[6%] md:top-[12%]",
    tail: "rounded-bl-md origin-bottom-left md:rounded-br-md md:origin-bottom-right",
    delay: 5000,
  },
  {
    pos: "right-[3%] top-[77%] md:hidden lg:block lg:left-[62%] lg:right-auto lg:top-auto lg:bottom-[10%]",
    tail: "rounded-br-md origin-bottom-right lg:rounded-bl-md lg:origin-bottom-left",
    delay: 6200,
  },
];

interface BubbleData {
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
}

interface DnaHelixProps {
  bubbles?: BubbleData[];
  className?: string;
}

export function DnaHelix({
  bubbles = [],
  className = "h-[340px] sm:h-[420px] md:h-[520px]",
}: DnaHelixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let last = 0;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const lite =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    const c1 = parseHex(PRIMARY_COLOR);
    const c2 = parseHex(SECONDARY_COLOR);

    let down = false;
    let inside = 0;
    let mx = -999;
    let my = -999;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const inBand = (x: number, y: number) => y >= 0 && y <= H;

    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!inBand(x, y)) return;
      if ((e.target as Element | null)?.closest?.("a")) return;
      mx = x;
      my = y;
      if (e.pointerType === "mouse") down = true;
      else inside = 1;
    };

    const onUp = (e: PointerEvent) => {
      down = false;
      if (e.pointerType !== "mouse") inside = 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };

    canvas.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    canvas.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const run = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(loop);
    };
    const halt = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !document.hidden) run();
      else halt();
    });
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) halt();
      else if (visible) run();
    };
    document.addEventListener("visibilitychange", onVis);

    let t = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (lite && last && now - last < 30) return;
      if (!last) last = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      t += 0.016;

      const pitch =
        W < 640
          ? Math.max(W * 0.5, 190)
          : Math.min(Math.max(W * 0.26, 300), 460);
      const centerY = H / 2;

      ctx.save();
      for (let i = 0; i < 40; i++) {
        const x = (i / 40) * W;
        const angle = x * ((Math.PI * 2) / pitch) + t;
        const y = centerY + Math.sin(angle) * 40;
        ctx.fillStyle = rgba(c1, 0.3);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    };

    if (reduce) {
      // draw static snapshot if reduced motion is requested
    } else {
      run();
    }

    return () => {
      halt();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
      />
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
        {bubbles.map((b, i) => {
          const slot = SLOTS[i % SLOTS.length];
          return (
            <div key={i} className={`absolute pointer-events-auto ${slot.pos}`}>
              <a
                href={b.href || "#"}
                onClick={(e) => {
                  if (b.onClick) {
                    e.preventDefault();
                    b.onClick();
                  }
                }}
                className={`block w-[min(15rem,56vw)] md:w-[min(15rem,70vw)] cursor-pointer rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-md transition-transform hover:scale-105 ${slot.tail}`}
              >
                <h4 className="text-sm font-semibold text-white">{b.title}</h4>
                <p className="text-xs text-gray-300 mt-1">{b.desc}</p>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
