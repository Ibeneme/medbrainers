"use client";

import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------- */
/*  Animated microbe field (canvas) with two looks you can switch between:    */
/*   - "virus": 3D spiky viruses tumbling in space                             */
/*   - "cells": glowing rod-shaped bacteria in chains, with pili + flagella    */
/*  Switching cross-fades between the two.                                     */
/* -------------------------------------------------------------------------- */

export type FieldVariant = "virus" | "cells";

const TAU = Math.PI * 2;

/* ========================================================================== */
/*  Shared helpers                                                             */
/* ========================================================================== */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ========================================================================== */
/*  VIRUSES                                                                    */
/* ========================================================================== */

type V3 = { x: number; y: number; z: number };
type Spike = { p: V3; len: number; head: number; width: number };
type Speck = { p: V3; size: number; light: boolean };

type VirusCfg = {
  x: number; // anchor 0..1
  y: number;
  r: number; // body radius (px at scale 1)
  ax: number; // wander amplitude (px)
  ay: number;
  fx: number; // wander speed (rad/s)
  fy: number;
  yaw: number; // spin speeds (rad/s)
  pitch: number;
  phase: number;
  detail: boolean; // false = out-of-focus bokeh virus
  alpha: number;
};

type VirusInst = {
  cfg: VirusCfg;
  spikes: Spike[];
  specks: Speck[];
  clumps: Speck[];
  soft: V3[]; // bokeh spike positions
};

const VIRUSES: VirusCfg[] = [
  // out-of-focus, far away
  {
    x: 0.62,
    y: 0.52,
    r: 74,
    ax: 40,
    ay: 30,
    fx: 0.09,
    fy: 0.07,
    yaw: 0.12,
    pitch: 0.08,
    phase: 1.2,
    detail: false,
    alpha: 0.5,
  },
  {
    x: 0.07,
    y: 0.82,
    r: 92,
    ax: 36,
    ay: 40,
    fx: 0.07,
    fy: 0.08,
    yaw: 0.1,
    pitch: 0.06,
    phase: 3.1,
    detail: false,
    alpha: 0.42,
  },
  {
    x: 0.93,
    y: 0.16,
    r: 60,
    ax: 30,
    ay: 34,
    fx: 0.1,
    fy: 0.06,
    yaw: 0.14,
    pitch: 0.09,
    phase: 5.2,
    detail: false,
    alpha: 0.45,
  },
  {
    x: 0.42,
    y: 0.66,
    r: 48,
    ax: 30,
    ay: 24,
    fx: 0.11,
    fy: 0.09,
    yaw: 0.16,
    pitch: 0.1,
    phase: 2.4,
    detail: false,
    alpha: 0.4,
  },
  // in focus
  {
    x: 0.72,
    y: 0.12,
    r: 36,
    ax: 34,
    ay: 26,
    fx: 0.16,
    fy: 0.12,
    yaw: 0.34,
    pitch: 0.2,
    phase: 0.8,
    detail: true,
    alpha: 0.9,
  },
  {
    x: 0.5,
    y: 0.2,
    r: 44,
    ax: 40,
    ay: 30,
    fx: 0.13,
    fy: 0.1,
    yaw: 0.28,
    pitch: 0.17,
    phase: 4.1,
    detail: true,
    alpha: 0.95,
  },
  {
    x: 0.3,
    y: 0.8,
    r: 58,
    ax: 48,
    ay: 36,
    fx: 0.1,
    fy: 0.12,
    yaw: 0.22,
    pitch: 0.13,
    phase: 2.9,
    detail: true,
    alpha: 1,
  },
  {
    x: 0.12,
    y: 0.3,
    r: 82,
    ax: 56,
    ay: 40,
    fx: 0.09,
    fy: 0.08,
    yaw: 0.18,
    pitch: 0.11,
    phase: 0.2,
    detail: true,
    alpha: 1,
  },
  {
    x: 0.87,
    y: 0.64,
    r: 100,
    ax: 60,
    ay: 44,
    fx: 0.08,
    fy: 0.09,
    yaw: 0.16,
    pitch: 0.09,
    phase: 3.7,
    detail: true,
    alpha: 1,
  },
];

function fibSphere(n: number, rand: () => number, jitter = 0): V3[] {
  const out: V3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    const th = i * ga;
    let p: V3 = { x: Math.cos(th) * rr, y, z: Math.sin(th) * rr };
    if (jitter) {
      p = {
        x: p.x + (rand() - 0.5) * jitter,
        y: p.y + (rand() - 0.5) * jitter,
        z: p.z + (rand() - 0.5) * jitter,
      };
      const l = Math.hypot(p.x, p.y, p.z) || 1;
      p = { x: p.x / l, y: p.y / l, z: p.z / l };
    }
    out.push(p);
  }
  return out;
}

function rot(p: V3, cy: number, sy: number, cp: number, sp: number): V3 {
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  return { x: x1, y: p.y * cp - z1 * sp, z: p.y * sp + z1 * cp };
}

function buildVirus(cfg: VirusCfg, index: number): VirusInst {
  const rand = rng(1000 + index * 77);
  const R = cfg.r;

  if (!cfg.detail) {
    return {
      cfg,
      spikes: [],
      specks: [],
      clumps: [],
      soft: fibSphere(16, rand, 0.15),
    };
  }

  const n = Math.max(16, Math.round(R * 0.32));
  const spikes: Spike[] = fibSphere(n, rand, 0.22).map((p) => ({
    p,
    len: R * (0.45 + rand() * 0.38),
    head: R * (0.062 + rand() * 0.024),
    width: R * (0.05 + rand() * 0.018),
  }));

  const specks: Speck[] = fibSphere(Math.round(R * 3.4), rand, 0.9).map(
    (p) => ({
      p,
      size: 0.5 + rand() * 1.3,
      light: rand() > 0.42,
    })
  );

  const clumps: Speck[] = fibSphere(Math.round(R * 0.5), rand, 0.9).map(
    (p) => ({
      p,
      size: 0.6 + rand() * 1.1,
      light: rand() > 0.35,
    })
  );

  return { cfg, spikes, specks, clumps, soft: [] };
}

function drawHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  a: number
) {
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, R * 0.6, x, y, R * 2.3);
  g.addColorStop(0, `rgba(70,230,50,${0.26 * a})`);
  g.addColorStop(1, "rgba(70,230,50,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, R * 2.3, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function drawSpike(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  s: Spike,
  rp: V3,
  a: number
) {
  const depth = (rp.z + 1) / 2; // 0 = back, 1 = front
  const alpha = (0.5 + 0.5 * depth) * a;
  const persp = 1 + 0.06 * rp.z;

  const bx = cx + rp.x * R;
  const by = cy + rp.y * R;
  const tx = cx + rp.x * (R + s.len) * persp;
  const ty = cy + rp.y * (R + s.len) * persp;
  const dx = tx - bx;
  const dy = ty - by;
  const len = Math.hypot(dx, dy);
  const light = 26 + 30 * depth;
  const wb = s.width * (1 + 0.15 * rp.z);
  const wt = wb * 0.52;

  // collar where the stalk meets the body
  if (rp.z > -0.25) {
    ctx.globalCompositeOperation = "lighter";
    const cg = ctx.createRadialGradient(bx, by, 0, bx, by, wb * 1.9);
    cg.addColorStop(0, `rgba(120,255,80,${0.32 * alpha})`);
    cg.addColorStop(1, "rgba(120,255,80,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(bx, by, wb * 1.9, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  // stalk
  if (len > 1) {
    const nx = -dy / len;
    const ny = dx / len;

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(90,255,60,${0.09 * alpha})`;
    ctx.lineWidth = wb * 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    const g = ctx.createLinearGradient(bx, by, tx, ty);
    g.addColorStop(0, `hsla(108,72%,${light - 9}%,${alpha})`);
    g.addColorStop(1, `hsla(100,90%,${light + 10}%,${alpha})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx + (nx * wb) / 2, by + (ny * wb) / 2);
    ctx.lineTo(tx + (nx * wt) / 2, ty + (ny * wt) / 2);
    ctx.lineTo(tx - (nx * wt) / 2, ty - (ny * wt) / 2);
    ctx.lineTo(bx - (nx * wb) / 2, by - (ny * wb) / 2);
    ctx.closePath();
    ctx.fill();

    // lit edge
    ctx.strokeStyle = `hsla(95,100%,76%,${0.38 * alpha})`;
    ctx.lineWidth = Math.max(0.6, wt * 0.24);
    ctx.beginPath();
    ctx.moveTo(bx + nx * wb * 0.24, by + ny * wb * 0.24);
    ctx.lineTo(tx + nx * wt * 0.24, ty + ny * wt * 0.24);
    ctx.stroke();
  }

  // knob head
  const rk = s.head * (1 + 0.22 * rp.z);
  const hg = ctx.createRadialGradient(
    tx - rk * 0.35,
    ty - rk * 0.4,
    rk * 0.1,
    tx,
    ty,
    rk
  );
  hg.addColorStop(0, `hsla(95,100%,${60 + 12 * depth}%,${alpha})`);
  hg.addColorStop(0.6, `hsla(100,85%,${34 + 14 * depth}%,${alpha})`);
  hg.addColorStop(1, `hsla(110,80%,${16 + 6 * depth}%,${alpha})`);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(tx, ty, rk, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = `hsla(92,100%,72%,${0.7 * alpha})`;
  ctx.lineWidth = Math.max(0.6, rk * 0.14);
  ctx.stroke();

  // hollow opening at the tip
  const face = rp.z > 0 ? rp.z : 0.2;
  const ang = len > 1 ? Math.atan2(dy, dx) : 0;
  const ux = len > 1 ? dx / len : 0;
  const uy = len > 1 ? dy / len : 0;
  const off = rk * 0.28 * (1 - face);
  ctx.fillStyle = `rgba(8,40,6,${0.55 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(
    tx + ux * off,
    ty + uy * off,
    rk * 0.54,
    rk * (0.18 + 0.37 * face),
    ang + Math.PI / 2,
    0,
    TAU
  );
  ctx.fill();

  // specular dot
  ctx.fillStyle = `rgba(230,255,215,${0.75 * alpha})`;
  ctx.beginPath();
  ctx.arc(tx - rk * 0.36, ty - rk * 0.42, rk * 0.16, 0, TAU);
  ctx.fill();
}

function drawDetailVirus(
  ctx: CanvasRenderingContext2D,
  v: VirusInst,
  cx: number,
  cy: number,
  R: number,
  yaw: number,
  pitch: number,
  fade: number
) {
  const a = v.cfg.alpha * fade;
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  drawHalo(ctx, cx, cy, R, a);

  const rs = v.spikes.map((s) => ({ s, p: rot(s.p, cyw, syw, cp, sp) }));
  const back = rs.filter((o) => o.p.z < 0).sort((m, n) => m.p.z - n.p.z);
  const front = rs.filter((o) => o.p.z >= 0).sort((m, n) => m.p.z - n.p.z);

  // spikes behind the body
  for (const o of back) drawSpike(ctx, cx, cy, R, o.s, o.p, a);

  // body
  const bg = ctx.createRadialGradient(
    cx - R * 0.35,
    cy - R * 0.4,
    R * 0.08,
    cx,
    cy,
    R
  );
  bg.addColorStop(0, "#43a82a");
  bg.addColorStop(0.5, "#237016");
  bg.addColorStop(0.85, "#0f3a0c");
  bg.addColorStop(1, "#0a2a08");
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();

  // rotating surface texture (fine speckle + soft clumps)
  const drawPoints = (
    pts: Speck[],
    light: boolean,
    scale: number,
    fill: string
  ) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (const sp0 of pts) {
      if (sp0.light !== light) continue;
      const p = rot(sp0.p, cyw, syw, cp, sp);
      if (p.z < 0.02) continue;
      const x = cx + p.x * R * 0.985;
      const y = cy + p.y * R * 0.985;
      const r = sp0.size * scale * (0.45 + 0.55 * p.z);
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
  };
  const k = Math.max(0.6, R / 70);
  drawPoints(v.clumps, true, k * 3.6, `rgba(130,235,80,${0.11 * a})`);
  drawPoints(v.clumps, false, k * 3.2, `rgba(4,28,4,${0.22 * a})`);
  drawPoints(v.specks, true, k, `rgba(150,255,90,${0.55 * a})`);
  drawPoints(v.specks, false, k, `rgba(6,32,6,${0.5 * a})`);

  // limb darkening
  const vg = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R);
  vg.addColorStop(0, "rgba(0,18,0,0)");
  vg.addColorStop(1, `rgba(0,18,0,${0.55 * a})`);
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();

  // rim light
  ctx.globalCompositeOperation = "lighter";
  const rg = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.1);
  rg.addColorStop(0, "rgba(140,255,90,0)");
  rg.addColorStop(0.58, `rgba(140,255,90,${0.42 * a})`);
  rg.addColorStop(1, "rgba(140,255,90,0)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.1, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  // spikes in front of the body
  for (const o of front) drawSpike(ctx, cx, cy, R, o.s, o.p, a);
}

function drawBokehVirus(
  ctx: CanvasRenderingContext2D,
  v: VirusInst,
  cx: number,
  cy: number,
  R: number,
  yaw: number,
  pitch: number,
  fade: number
) {
  const a = v.cfg.alpha * fade;
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  ctx.globalCompositeOperation = "lighter";

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
  g.addColorStop(0, `rgba(60,170,40,${0.34 * a})`);
  g.addColorStop(0.7, `rgba(60,170,40,${0.22 * a})`);
  g.addColorStop(1, "rgba(60,170,40,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.1, 0, TAU);
  ctx.fill();

  for (const s of v.soft) {
    const p = rot(s, cyw, syw, cp, sp);
    const x = cx + p.x * R * 1.18;
    const y = cy + p.y * R * 1.18;
    const r = R * 0.24;
    const d = (p.z + 1) / 2;
    const bg = ctx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, `rgba(90,220,60,${(0.12 + 0.2 * d) * a})`);
    bg.addColorStop(1, "rgba(90,220,60,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

/* ========================================================================== */
/*  CELLS (rod-shaped bacteria in chains)                                      */
/* ========================================================================== */

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
  ox: number; // offset from chain anchor (px @ scale 1)
  oy: number;
  ang: number; // base angle
  len: number; // straight section length
  rad: number; // capsule radius
  tiltA: number; // out-of-plane tumble amplitude (rad)
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
  depth: number; // 0 = far/soft, 1 = near/sharp
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  rotW: number;
  ph: number;
};

type ChainInst = { cfg: ChainCfg; cells: Cell[] };

const CHAINS: ChainCfg[] = [
  // far, out of focus
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
  // in focus
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

/** point on the capsule outline for u in [0,1), plus outward normal */
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

  // flagellum (behind the body)
  if (!soft && c.flag) {
    const x0 = c.flagDir * (h + rc * 0.92);
    ctx.strokeStyle = `rgba(170,255,110,${0.55 * a})`;
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

  // outer glow
  ctx.globalCompositeOperation = "lighter";
  capsule(ctx, h, rc);
  ctx.strokeStyle = soft
    ? `rgba(90,255,70,${0.2 * a})`
    : `rgba(90,255,70,${0.15 * a})`;
  ctx.lineWidth = soft ? rc * 1.4 : rc * 0.9;
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  // translucent body
  const g = ctx.createLinearGradient(0, -rc, 0, rc);
  g.addColorStop(0, `rgba(170,255,100,${0.8 * a})`);
  g.addColorStop(0.22, `rgba(80,205,50,${0.6 * a})`);
  g.addColorStop(0.5, `rgba(40,150,40,${0.6 * a})`);
  g.addColorStop(0.78, `rgba(80,205,50,${0.6 * a})`);
  g.addColorStop(1, `rgba(170,255,100,${0.8 * a})`);
  capsule(ctx, h, rc);
  ctx.fillStyle = g;
  ctx.fill();

  if (!soft) {
    for (const b of c.blobs) {
      const bx = b.u * h * 0.8 + Math.sin(t * 0.5 + b.ph) * rc * 0.08;
      const by = b.v * rc * 0.35 + Math.cos(t * 0.4 + b.ph) * rc * 0.06;
      ctx.fillStyle = `rgba(120,235,80,${0.22 * a})`;
      ctx.strokeStyle = `rgba(205,255,155,${0.5 * a})`;
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

    ctx.fillStyle = `rgba(215,255,165,${0.6 * a})`;
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

  // glowing membrane rim
  capsule(ctx, h, rc);
  ctx.strokeStyle = soft
    ? `rgba(190,255,130,${0.3 * a})`
    : `rgba(190,255,130,${0.92 * a})`;
  ctx.lineWidth = soft ? rc * 0.5 : Math.max(1, rc * 0.2);
  ctx.stroke();

  if (!soft) {
    capsule(ctx, h, rc * 0.8);
    ctx.strokeStyle = `rgba(225,255,190,${0.4 * a})`;
    ctx.lineWidth = Math.max(0.6, rc * 0.06);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,235,${0.35 * a})`;
    ctx.lineWidth = Math.max(0.8, rc * 0.1);
    ctx.beginPath();
    ctx.moveTo(-h * 0.6, -rc * 0.58);
    ctx.lineTo(h * 0.6 + 0.01, -rc * 0.58);
    ctx.stroke();

    ctx.strokeStyle = `rgba(190,255,120,${0.55 * a})`;
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

function drawCellBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  f: number
) {
  ctx.globalCompositeOperation = "lighter";
  const m = Math.max(W, H);

  const x1 = W * (0.25 + 0.08 * Math.sin(t * 0.05));
  const y1 = H * (0.3 + 0.06 * Math.cos(t * 0.06));
  const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, m * 0.6);
  g1.addColorStop(0, `rgba(20,70,200,${0.2 * f})`);
  g1.addColorStop(1, "rgba(20,70,200,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const x2 = W * (0.8 + 0.06 * Math.cos(t * 0.045));
  const y2 = H * (0.7 + 0.07 * Math.sin(t * 0.055));
  const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, m * 0.55);
  g2.addColorStop(0, `rgba(0,150,160,${0.14 * f})`);
  g2.addColorStop(1, "rgba(0,150,160,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "source-over";
}

/* ========================================================================== */
/*  Component                                                                  */
/* ========================================================================== */

export default function VirusField({
  className = "",
  variant = "virus",
}: {
  className?: string;
  variant?: FieldVariant;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const variantRef = useRef<FieldVariant>(variant);
  const redrawRef = useRef<(() => void) | null>(null);

  // react to the toggle without tearing down the animation
  useEffect(() => {
    variantRef.current = variant;
    redrawRef.current?.();
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const viruses = VIRUSES.map((c, i) => buildVirus(c, i)).sort((m, n) => {
      if (m.cfg.detail !== n.cfg.detail) return m.cfg.detail ? 1 : -1;
      return m.cfg.r - n.cfg.r;
    });
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
    let mix = variantRef.current === "cells" ? 1 : 0;

    // Parallax tracking variables
    let targetScrollOffset = 0;
    let currentScrollOffset = 0;

    const updateScrollParallax = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Distance of canvas center from viewport center
      const centerDist = rect.top + rect.height / 2 - window.innerHeight / 2;
      targetScrollOffset = centerDist * 0.18; // Parallax multiplier factor
    };

    const handleScroll = () => {
      updateScrollParallax();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollParallax();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      updateScrollParallax();
    };

    const draw = (t: number, dt: number) => {
      // Smoothly interpolate scroll offset for buttery parallax
      currentScrollOffset += (targetScrollOffset - currentScrollOffset) * 0.12;

      const target = variantRef.current === "cells" ? 1 : 0;
      if (reduce) mix = target;
      else
        mix +=
          Math.sign(target - mix) * Math.min(Math.abs(target - mix), dt * 2.2);
      const vf = 1 - mix;
      const cf = mix;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const scale = Math.min(1.15, Math.max(0.55, W / 1280));

      if (cf > 0.01) drawCellBackdrop(ctx, W, H, t, cf);

      // drifting spores (with subtle parallax layer)
      ctx.globalCompositeOperation = "lighter";
      for (const d of dust) {
        const x = (((d.x + t * d.vx) % 1) + 1) % 1;
        const y = (((d.y + t * d.vy) % 1) + 1) % 1;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * d.sp + d.ph));
        ctx.fillStyle = `rgba(140,255,100,${0.45 * tw})`;
        ctx.beginPath();
        ctx.arc(x * W, (y * H + currentScrollOffset * 0.5) % H, d.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // bubbles (cells look)
      if (cf > 0.01) {
        ctx.lineWidth = 1;
        for (const b of bubbles) {
          const x = b.x + Math.sin(t * 0.4 + b.ph) * b.sway;
          const y = (((b.y + t * b.vy) % 1) + 1) % 1;
          const bubbleY = (y * H + currentScrollOffset * 0.7) % H;
          ctx.strokeStyle = `rgba(190,230,255,${0.42 * cf})`;
          ctx.beginPath();
          ctx.arc(x * W, bubbleY, b.r, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * cf})`;
          ctx.beginPath();
          ctx.arc(x * W, bubbleY, b.r * 0.62, Math.PI * 1.1, Math.PI * 1.55);
          ctx.stroke();
        }
      }

      // viruses (with parallax offset applied to cy)
      if (vf > 0.01) {
        for (const v of viruses) {
          const c = v.cfg;
          const cx =
            c.x * W +
            c.ax * scale * Math.sin(t * c.fx + c.phase) +
            c.ax * scale * 0.35 * Math.sin(t * c.fx * 2.3 + c.phase * 1.7);
          const cy =
            c.y * H +
            c.ay * scale * Math.cos(t * c.fy + c.phase * 1.3) +
            c.ay * scale * 0.35 * Math.cos(t * c.fy * 2.1 + c.phase * 0.6) +
            currentScrollOffset * (c.detail ? 1 : 0.6); // Depth-based parallax layer speed
          const R = c.r * scale * (1 + 0.025 * Math.sin(t * 0.9 + c.phase));
          const yaw = c.phase + t * c.yaw;
          const pitch = 0.25 + 0.5 * Math.sin(t * c.pitch + c.phase);

          if (c.detail) drawDetailVirus(ctx, v, cx, cy, R, yaw, pitch, vf);
          else drawBokehVirus(ctx, v, cx, cy, R, yaw, pitch, vf);
        }
      }

      // cells (with parallax offset applied to ay)
      if (cf > 0.01) {
        for (const ch of chains) {
          const c = ch.cfg;
          const cs = scale * (0.6 + 0.55 * c.depth);
          const ax =
            c.x * W +
            c.ax * scale * Math.sin(t * c.fx + c.ph) +
            c.ax * scale * 0.3 * Math.sin(t * c.fx * 2.4 + c.ph * 1.6);
          const ay =
            c.y * H +
            c.ay * scale * Math.cos(t * c.fy + c.ph * 1.2) +
            c.ay * scale * 0.3 * Math.cos(t * c.fy * 2.2 + c.ph * 0.7) +
            currentScrollOffset * c.depth; // Depth-based parallax layer speed
          const rotA = t * c.rotW;
          const cr = Math.cos(rotA);
          const sr = Math.sin(rotA);
          const soft = c.depth < 0.6;
          const a = cf * (0.3 + 0.7 * c.depth) * (soft ? 0.75 : 1);

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
      draw(t, dt);
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

    redrawRef.current = () => {
      if (reduce || !raf) draw(t, 0);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce || !raf) draw(t, 0);
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

    if (reduce) draw(0, 0);
    else start();

    return () => {
      stop();
      redrawRef.current = null;
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
