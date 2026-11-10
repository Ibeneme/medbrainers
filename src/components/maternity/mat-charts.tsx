"use client";

import type { ReactNode } from "react";
import { PRIMARY_COLOR } from "@/constants/colors";
import type { PartographObservation } from "@/api/slices/maternitySlice";

const W = 600;
const H = 200;
const L = 46;
const R = 14;
const T = 12;
const B = 30;

const AMBER = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#10b981";

const ticks = (min: number, max: number, n: number) =>
  Array.from({ length: n + 1 }, (_, i) => min + ((max - min) * i) / n);

/** Axes + grid; children get the x / y scale functions. */
function Frame({
  xMin, xMax, yMin, yMax, xTicks, yTicks, xFmt, yFmt, xTitle, yTitle, height = H, children,
}: {
  xMin: number; xMax: number; yMin: number; yMax: number;
  xTicks: number[]; yTicks: number[];
  xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  xTitle?: string; yTitle?: string; height?: number;
  children: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode;
}) {
  const sx = (v: number) => L + ((v - xMin) / (xMax - xMin || 1)) * (W - L - R);
  const sy = (v: number) => height - B - ((v - yMin) / (yMax - yMin || 1)) * (height - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img">
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="currentColor" strokeOpacity={0.12} />
          <text x={L - 6} y={sy(t) + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.55}>
            {yFmt ? yFmt(t) : t}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={sx(t)} x2={sx(t)} y1={T} y2={height - B} stroke="currentColor" strokeOpacity={0.07} />
          <text x={sx(t)} y={height - B + 14} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.55}>
            {xFmt ? xFmt(t) : t}
          </text>
        </g>
      ))}
      {xTitle && (
        <text x={(L + W - R) / 2} y={height - 3} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.5}>
          {xTitle}
        </text>
      )}
      {yTitle && (
        <text transform={`translate(11 ${(T + height - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.5}>
          {yTitle}
        </text>
      )}
      {children(sx, sy)}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export function LineChart({
  points, xMin, xMax, yMin, yMax, band, xTitle, yTitle, xFmt, yFmt, height,
}: {
  points: { x: number; y: number }[];
  xMin: number; xMax: number; yMin: number; yMax: number;
  /** Normal range, shaded green. */
  band?: [number, number];
  xTitle?: string; yTitle?: string;
  xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  height?: number;
}) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  return (
    <Frame
      xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax}
      xTicks={ticks(xMin, xMax, 6)} yTicks={ticks(yMin, yMax, 4)}
      xFmt={xFmt ?? ((v) => String(Math.round(v * 10) / 10))}
      yFmt={yFmt ?? ((v) => String(Math.round(v * 10) / 10))}
      xTitle={xTitle} yTitle={yTitle} height={height}
    >
      {(sx, sy) => (
        <>
          {band && (
            <rect
              x={sx(xMin)} y={sy(band[1])} width={sx(xMax) - sx(xMin)} height={sy(band[0]) - sy(band[1])}
              fill={GREEN} fillOpacity={0.1}
            />
          )}
          {pts.length > 1 && (
            <polyline
              fill="none" stroke={PRIMARY_COLOR} strokeWidth={2} strokeLinejoin="round"
              points={pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
            />
          )}
          {pts.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={PRIMARY_COLOR} />
          ))}
        </>
      )}
    </Frame>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Cervicograph — dilatation plotted against hours since the active phase     */
/*  began (first reading ≥ 4 cm). Alert line = 1 cm/h from 4 cm; action line   */
/*  = alert line shifted 4 h to the right.                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

export type CervicographState = {
  /** active phase (≥ 4 cm) reached */
  active: boolean;
  /** hours since active phase began at the latest reading */
  hours?: number;
  lastDilatation?: number;
  crossedAlert: boolean;
  crossedAction: boolean;
};

const hoursBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 3600000;

export function cervicographState(obs: PartographObservation[]): CervicographState {
  const pts = obs
    .filter((o) => typeof o.cervicalDilatation === "number")
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const first = pts.find((p) => (p.cervicalDilatation as number) >= 4);
  const last = pts[pts.length - 1];
  if (!first || !last) return { active: false, crossedAlert: false, crossedAction: false, lastDilatation: last?.cervicalDilatation };
  const x = hoursBetween(first.time, last.time);
  const y = last.cervicalDilatation as number;
  return {
    active: true,
    hours: x,
    lastDilatation: y,
    crossedAlert: x > 0 && y < 4 + x,
    crossedAction: x > 0 && y < x,
  };
}

export function Cervicograph({ obs }: { obs: PartographObservation[] }) {
  const pts = obs
    .filter((o) => typeof o.cervicalDilatation === "number")
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const first = pts.find((p) => (p.cervicalDilatation as number) >= 4);
  const t0 = (first ?? pts[0])?.time;
  const data = pts.map((p) => ({ x: t0 ? hoursBetween(t0, p.time) : 0, y: p.cervicalDilatation as number }));
  const xMin = Math.min(0, Math.floor(Math.min(0, ...data.map((d) => d.x))));
  const xMax = Math.max(12, Math.ceil(Math.max(0, ...data.map((d) => d.x))) + 1);

  return (
    <Frame
      xMin={xMin} xMax={xMax} yMin={0} yMax={10}
      xTicks={ticks(xMin, xMax, xMax - xMin > 12 ? 7 : xMax - xMin)} yTicks={ticks(0, 10, 10)}
      xFmt={(v) => `${Math.round(v)}h`} yFmt={(v) => String(v)}
      xTitle={first ? "Hours since active phase (≥ 4 cm)" : "Hours since first reading"} yTitle="Cervix (cm)" height={260}
    >
      {(sx, sy) => (
        <>
          {/* active-phase start */}
          <line x1={sx(xMin)} x2={sx(xMax)} y1={sy(4)} y2={sy(4)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3 4" />
          {first && (
            <>
              <polyline fill="none" stroke={AMBER} strokeWidth={1.75} strokeDasharray="6 4" points={`${sx(0)},${sy(4)} ${sx(6)},${sy(10)}`} />
              <polyline fill="none" stroke={RED} strokeWidth={1.75} strokeDasharray="6 4" points={`${sx(4)},${sy(4)} ${sx(10)},${sy(10)}`} />
              <text x={sx(6) + 4} y={sy(10) + 10} fontSize={10} fill={AMBER}>Alert</text>
              <text x={sx(10) + 4} y={sy(10) + 10} fontSize={10} fill={RED}>Action</text>
            </>
          )}
          {data.length > 1 && (
            <polyline fill="none" stroke={PRIMARY_COLOR} strokeWidth={2.25} strokeLinejoin="round" points={data.map((d) => `${sx(d.x)},${sy(d.y)}`).join(" ")} />
          )}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={sx(d.x)} cy={sy(d.y)} r={4} fill={PRIMARY_COLOR} />
              <text x={sx(d.x)} y={sy(d.y) - 8} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.7}>
                {d.y}
              </text>
            </g>
          ))}
        </>
      )}
    </Frame>
  );
}
