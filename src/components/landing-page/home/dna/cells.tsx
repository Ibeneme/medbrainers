"use client";

import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------- */
/*  <Cells />  standalone animated field of glowing rod-shaped bacteria        */
/*  - chains of translucent capsules with pili, flagella and inner organelles  */
/*  - cells tumble in 3D (a rod turned end-on shortens into a circle)          */
/*  - rising bubbles and drifting spores for depth                             */
/*  - parallax on scroll: far chains drift less, near chains more              */
/*  Usage: put it inside a `relative` parent with an explicit height.          */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Hair = { u: number; len: number; ph: number };
type Blob = {
  u: number;
  v: number;
  rx: number;
  ry: number;
  rot: number;
  ph: number;
};
type Grain = { u: number; v: number; r: number; ph: number };

type Cell = {
  ox: number;
  oy: number;
  ang: number;
  len: number;
  rad: number;
  tiltA: number;
  tiltW: number;
  tiltPh: number;
  spin: number;
  jph: number;
  flag: boolean;
  flagDir: 1 | -1;
  flagLen: number;
  flagPh: number;
  hairs: Hair[];
  blobs: Blob[];
  grains: Grain[];
};

type ChainCfg = {
  x: number;
  y: number;
  n: number;
  ang: number;
  spacing: number;
  depth: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  rotW: number;
  ph: number;
};

type ChainInst = { cfg: ChainCfg; cells: Cell[] };

const CHAINS: ChainCfg[] = [
  {
    x: 0.8,
    y: 0.2,
    n: 6,
    ang: 2.2,
    spacing: 92,
    depth: 0.25,
    ax: 40,
    ay: 30,
    fx: 0.08,
    fy: 0.07,
    rotW: 0.012,
    ph: 1.0,
  },
  {
    x: 0.1,
    y: 0.72,
    n: 5,
    ang: -0.5,
    spacing: 96,
    depth: 0.3,
    ax: 36,
    ay: 34,
    fx: 0.07,
    fy: 0.08,
    rotW: -0.01,
    ph: 2.6,
  },
  {
    x: 0.52,
    y: 0.5,
    n: 5,
    ang: 0.9,
    spacing: 90,
    depth: 0.28,
    ax: 44,
    ay: 28,
    fx: 0.09,
    fy: 0.06,
    rotW: 0.014,
    ph: 4.3,
  },
  {
    x: 0.2,
    y: 0.24,
    n: 7,
    ang: 0.7,
    spacing: 78,
    depth: 1,
    ax: 46,
    ay: 34,
    fx: 0.1,
    fy: 0.08,
    rotW: 0.018,
    ph: 0.4,
  },
  {
    x: 0.8,
    y: 0.58,
    n: 6,
    ang: -0.8,
    spacing: 80,
    depth: 0.9,
    ax: 50,
    ay: 36,
    fx: 0.09,
    fy: 0.1,
    rotW: -0.016,
    ph: 3.1,
  },
  {
    x: 0.42,
    y: 0.86,
    n: 5,
    ang: 0.15,
    spacing: 82,
    depth: 0.8,
    ax: 42,
    ay: 30,
    fx: 0.11,
    fy: 0.09,
    rotW: 0.02,
    ph: 5.2,
  },
  {
    x: 0.64,
    y: 0.14,
    n: 4,
    ang: 1.0,
    spacing: 72,
    depth: 0.7,
    ax: 38,
    ay: 28,
    fx: 0.12,
    fy: 0.1,
    rotW: -0.022,
    ph: 1.9,
  },
  {
    x: 0.06,
    y: 0.5,
    n: 4,
    ang: -1.2,
    spacing: 74,
    depth: 0.65,
    ax: 32,
    ay: 30,
    fx: 0.1,
    fy: 0.12,
    rotW: 0.017,
    ph: 4.8,
  },
].sort((m, n) => m.depth - n.depth);

function buildChain(cfg: ChainCfg, index: number): ChainInst {
  const rand = rng(5000 + index * 131);
  const ca = Math.cos(cfg.ang);
  const sa = Math.sin(cfg.ang);
  const cells: Cell[] = [];

  for (let i = 0; i < cfg.n; i++) {
    const along = (i - (cfg.n - 1) / 2) * cfg.spacing;
    const pj = (rand() - 0.5) * cfg.spacing * 0.55;
    const cross = rand() < 0.3 ? (rand() < 0.5 ? 1 : -1) * Math.PI * 0.4 : 0;

    cells.push({
      ox: ca * along - sa * pj,
      oy: sa * along + ca * pj,
      ang: cfg.ang + (rand() - 0.5) * 1.2 + cross,
      len: 38 + rand() * 38,
      rad: 15 + rand() * 7,
      tiltA: 0.2 + rand() * 1.1,
      tiltW: 0.12 + rand() * 0.2,
      tiltPh: rand() * TAU,
      spin: (rand() - 0.5) * 0.05,
      jph: rand() * TAU,
      flag: rand() < 0.45,
      flagDir: rand() < 0.5 ? 1 : -1,
      flagLen: 2.2 + rand() * 2.2,
      flagPh: rand() * TAU,
      hairs: Array.from({ length: 26 }, () => ({
        u: rand(),
        len: 0.18 + rand() * 0.22,
        ph: rand() * TAU,
      })),
      blobs: Array.from({ length: 2 + Math.floor(rand() * 2) }, () => ({
        u: (rand() - 0.5) * 1.2,
        v: (rand() - 0.5) * 1.2,
        rx: 0.3 + rand() * 0.4,
        ry: 0.28 + rand() * 0.22,
        rot: (rand() - 0.5) * 0.8,
        ph: rand() * TAU,
      })),
      grains: Array.from({ length: 9 }, () => ({
        u: (rand() - 0.5) * 2,
        v: (rand() - 0.5) * 2,
        r: 0.6 + rand() * 1.2,
        ph: rand() * TAU,
      })),
    });
  }
  return { cfg, cells };
}

function capsule(ctx: CanvasRenderingContext2D, h: number, r: number) {
  ctx.beginPath();
  ctx.arc(h, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.arc(-h, 0, r, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
}

function perimPoint(u: number, h: number, r: number) {
  const side = 2 * h;
  const cap = Math.PI * r;
  const total = 2 * side + 2 * cap;
  let d = u * total;
  if (d < side) return { x: -h + d, y: -r, nx: 0, ny: -1 };
  d -= side;
  if (d < cap) {
    const a = -Math.PI / 2 + (d / cap) * Math.PI;
    return {
      x: h + Math.cos(a) * r,
      y: Math.sin(a) * r,
      nx: Math.cos(a),
      ny: Math.sin(a),
    };
  }
  d -= cap;
  if (d < side) return { x: h - d, y: r, nx: 0, ny: 1 };
  d -= side;
  const a = Math.PI / 2 + (d / cap) * Math.PI;
  return {
    x: -h + Math.cos(a) * r,
    y: Math.sin(a) * r,
    nx: Math.cos(a),
    ny: Math.sin(a),
  };
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  c: Cell,
  x: number,
  y: number,
  ang: number,
  tilt: number,
  s: number,
  t: number,
  a: number,
  soft: boolean
) {
  const h = Math.max(0, (c.len / 2) * Math.cos(tilt)) * s;
  const rc = c.rad * s;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (!soft && c.flag) {
    const x0 = c.flagDir * (h + rc * 0.92);
    ctx.strokeStyle = `rgba(170,255,110,${0.35 * a})`;
    ctx.lineWidth = Math.max(0.7, rc * 0.06);
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    const steps = 18;
    for (let k = 1; k <= steps; k++) {
      const u = k / steps;
      const px = x0 + c.flagDir * u * c.flagLen * rc;
      const py =
        Math.sin(u * 6.5 - t * 2.6 + c.flagPh) * rc * 0.42 * (0.12 + u);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "lighter";
  capsule(ctx, h, rc);
  ctx.strokeStyle = soft
    ? `rgba(90,255,70,${0.12 * a})`
    : `rgba(90,255,70,${0.1 * a})`;
  ctx.lineWidth = soft ? rc * 1.4 : rc * 0.9;
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  const g = ctx.createLinearGradient(0, -rc, 0, rc);
  g.addColorStop(0, `rgba(170,255,100,${0.45 * a})`);
  g.addColorStop(0.22, `rgba(80,205,50,${0.35 * a})`);
  g.addColorStop(0.5, `rgba(40,150,40,${0.35 * a})`);
  g.addColorStop(0.78, `rgba(80,205,50,${0.35 * a})`);
  g.addColorStop(1, `rgba(170,255,100,${0.45 * a})`);
  capsule(ctx, h, rc);
  ctx.fillStyle = g;
  ctx.fill();

  if (!soft) {
    for (const b of c.blobs) {
      const bx = b.u * h * 0.8 + Math.sin(t * 0.5 + b.ph) * rc * 0.08;
      const by = b.v * rc * 0.35 + Math.cos(t * 0.4 + b.ph) * rc * 0.06;
      ctx.fillStyle = `rgba(120,235,80,${0.14 * a})`;
      ctx.strokeStyle = `rgba(205,255,155,${0.3 * a})`;
      ctx.lineWidth = Math.max(0.6, rc * 0.09);
      ctx.beginPath();
      ctx.ellipse(
        bx,
        by,
        (h + rc * 0.5) * b.rx * 1.2,
        rc * b.ry,
        b.rot,
        0,
        TAU
      );
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(215,255,165,${0.35 * a})`;
    ctx.beginPath();
    for (const gr of c.grains) {
      const gx = gr.u * (h + rc * 0.5) + Math.sin(t * 0.6 + gr.ph) * rc * 0.05;
      const gy = gr.v * rc * 0.6 + Math.cos(t * 0.5 + gr.ph) * rc * 0.05;
      const r = Math.max(0.6, rc * 0.045 * gr.r);
      ctx.moveTo(gx + r, gy);
      ctx.arc(gx, gy, r, 0, TAU);
    }
    ctx.fill();
  }

  capsule(ctx, h, rc);
  ctx.strokeStyle = soft
    ? `rgba(190,255,130,${0.18 * a})`
    : `rgba(190,255,130,${0.55 * a})`;
  ctx.lineWidth = soft ? rc * 0.5 : Math.max(1, rc * 0.2);
  ctx.stroke();

  if (!soft) {
    capsule(ctx, h, rc * 0.8);
    ctx.strokeStyle = `rgba(225,255,190,${0.25 * a})`;
    ctx.lineWidth = Math.max(0.6, rc * 0.06);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,235,${0.22 * a})`;
    ctx.lineWidth = Math.max(0.8, rc * 0.1);
    ctx.beginPath();
    ctx.moveTo(-h * 0.6, -rc * 0.58);
    ctx.lineTo(h * 0.6 + 0.01, -rc * 0.58);
    ctx.stroke();

    ctx.strokeStyle = `rgba(190,255,120,${0.35 * a})`;
    ctx.lineWidth = Math.max(0.6, rc * 0.04);
    ctx.beginPath();
    for (const hr of c.hairs) {
      const p = perimPoint(hr.u, h, rc);
      const l = hr.len * rc * (1 + 0.2 * Math.sin(t * 3 + hr.ph));
      const w = Math.sin(t * 2 + hr.ph) * rc * 0.04;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.nx * l - p.ny * w, p.y + p.ny * l + p.nx * w);
    }
    ctx.stroke();
  }

  ctx.restore();
}

export default function Cells({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const chains = CHAINS.map((c, i) => buildChain(c, i));

    const dr = rng(42);
    const dust = Array.from({ length: 46 }, () => ({
      x: dr(),
      y: dr(),
      vx: (dr() - 0.5) * 0.006,
      vy: -0.004 - dr() * 0.01,
      r: 0.6 + dr() * 1.5,
      ph: dr() * TAU,
      sp: 0.4 + dr() * 0.9,
    }));
    const bubbles = Array.from({ length: 26 }, () => ({
      x: dr(),
      y: dr(),
      vy: -0.006 - dr() * 0.012,
      sway: 0.004 + dr() * 0.01,
      r: 2 + dr() * 6,
      ph: dr() * TAU,
    }));

    let W = 0;
    let H = 0;
    let dpr = 1;
    let scrollY = 0;

    const updateScroll = () => {
      const rect = wrap.getBoundingClientRect();
      scrollY = window.innerHeight * 0.5 - (rect.top + rect.height * 0.5);
    };

    const resize = () => {
      // Limit dpr to 2 on Safari to save memory and avoid GPU context loss crashes
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      // Safari fallback: check clientWidth, fallback to bounding rect or window width
      const rect = canvas.getBoundingClientRect();
      W = canvas.clientWidth || rect.width || window.innerWidth;
      H = canvas.clientHeight || rect.height || window.innerHeight;

      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      updateScroll();
    };

    const draw = (t: number) => {
      if (W === 0 || H === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const scale = Math.min(1.15, Math.max(0.55, W / 1280));
      const baseParallax = reduce ? 0 : scrollY * 0.18;

      ctx.globalCompositeOperation = "lighter";
      for (const d of dust) {
        const x = (((d.x + t * d.vx) % 1) + 1) % 1;
        const y = (((d.y + t * d.vy) % 1) + 1) % 1;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * d.sp + d.ph));
        const py = y * H + baseParallax * 0.35;
        ctx.fillStyle = `rgba(140,255,100,${0.28 * tw})`;
        ctx.beginPath();
        ctx.arc(x * W, py, d.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      ctx.lineWidth = 1;
      for (const b of bubbles) {
        const x = b.x + Math.sin(t * 0.4 + b.ph) * b.sway;
        const y = (((b.y + t * b.vy) % 1) + 1) % 1;
        const py = y * H + baseParallax * 0.5;
        ctx.strokeStyle = "rgba(190,230,255,0.22)";
        ctx.beginPath();
        ctx.arc(x * W, py, b.r, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        ctx.arc(x * W, py, b.r * 0.62, Math.PI * 1.1, Math.PI * 1.55);
        ctx.stroke();
      }

      for (const ch of chains) {
        const c = ch.cfg;
        const cs = scale * (0.6 + 0.55 * c.depth);
        const depthParallax = reduce ? 0 : scrollY * (0.08 + 0.47 * c.depth);

        const ax =
          c.x * W +
          c.ax * scale * Math.sin(t * c.fx + c.ph) +
          c.ax * scale * 0.3 * Math.sin(t * c.fx * 2.4 + c.ph * 1.6);
        const ay =
          c.y * H +
          c.ay * scale * Math.cos(t * c.fy + c.ph * 1.2) +
          c.ay * scale * 0.3 * Math.cos(t * c.fy * 2.2 + c.ph * 0.7) +
          depthParallax;

        const rotA = t * c.rotW;
        const cr = Math.cos(rotA);
        const sr = Math.sin(rotA);
        const soft = c.depth < 0.6;
        const a = (0.22 + 0.5 * c.depth) * (soft ? 0.7 : 1);

        for (const cell of ch.cells) {
          const ox = cell.ox * cs;
          const oy = cell.oy * cs;
          const x =
            ax + ox * cr - oy * sr + Math.sin(t * 0.5 + cell.jph) * 3 * cs;
          const y =
            ay +
            ox * sr +
            oy * cr +
            Math.cos(t * 0.45 + cell.jph * 1.3) * 3 * cs;
          const ang =
            cell.ang +
            rotA +
            0.1 * Math.sin(t * 0.6 + cell.jph) +
            t * cell.spin;
          const tilt = cell.tiltA * Math.sin(t * cell.tiltW + cell.tiltPh);
          drawCell(ctx, cell, x, y, ang, tilt, cs, t, a, soft);
        }
      }
    };

    resize();

    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = true;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      draw(t);
    };

    const start = () => {
      if (raf || reduce) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onScroll = () => {
      updateScroll();
      if (reduce) draw(t);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce || !raf) draw(t);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    });
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("scroll", onScroll, { passive: true });

    if (reduce) {
      updateScroll();
      draw(0);
    } else start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 block h-full w-full overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}