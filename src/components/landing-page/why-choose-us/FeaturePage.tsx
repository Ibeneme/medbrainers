"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useEffect, useRef } from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T } from "@/i18n/provider";
import { productName } from "@/constants/site";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type ArtName =
  | "hospital"
  | "clinic"
  | "industry"
  | "dental"
  | "pharmacy"
  | "maternity"
  | "security"
  | "training"
  | "support"
  | "migration"
  | "solo"
  | "group";

export type FeatureItem = {
  id: string; // matches the navbar hash, e.g. /facility-size#clinics
  title: string;
  tagline: string;
  intro: string;
  features: string[];
  art: ArtName;
  beta?: boolean;
};

export type FeaturePageProps = {
  headline: { before: string; middle: string; accent: string };
  subtitle: string;
  browseLabel?: string;
  visionLabel: string;
  visionLead: string;
  visionMuted: string;
  items: FeatureItem[];
  closing: { title: string; text: string };
};

/* ------------------------------------------------------------------ */
/* Isometric wireframe illustrations                                    */
/* ------------------------------------------------------------------ */

type B = { cx: number; cy: number; hw: number; hh: number; h: number };
type Pt = [number, number];

const pathOf = (pts: Pt[]) =>
  "M" + pts.map((p) => `${p[0]} ${p[1]}`).join("L") + "Z";
const lineD = (a: Pt, b: Pt) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
const topPt = (b: B, s: number, t: number): Pt => [
  b.cx + (s - t) * b.hw,
  b.cy - b.hh + (s + t) * b.hh,
];
const facePt = (b: B, side: "l" | "r", u: number, v: number): Pt => {
  const sg = side === "l" ? -1 : 1;
  return [b.cx + sg * b.hw - sg * u * b.hw, b.cy + u * b.hh + v * b.h];
};
const topQuad = (b: B, s0: number, s1: number, t0: number, t1: number) =>
  pathOf([
    topPt(b, s0, t0),
    topPt(b, s1, t0),
    topPt(b, s1, t1),
    topPt(b, s0, t1),
  ]);
const faceQuad = (
  b: B,
  side: "l" | "r",
  u0: number,
  u1: number,
  v0: number,
  v1: number
) =>
  pathOf([
    facePt(b, side, u0, v0),
    facePt(b, side, u1, v0),
    facePt(b, side, u1, v1),
    facePt(b, side, u0, v1),
  ]);

const S = ({
  d,
  dim,
  sw = 1,
  fill = "none",
  color = "#fff",
}: {
  d: string;
  dim?: boolean;
  sw?: number;
  fill?: string;
  color?: string;
}) => (
  <path
    d={d}
    fill={fill}
    stroke={dim ? `${color}45` : color}
    strokeWidth={sw}
    strokeLinejoin="round"
    strokeLinecap="round"
  />
);

const Box = ({
  b,
  dim,
  sw = 1,
  color = "#fff",
}: {
  b: B;
  dim?: boolean;
  sw?: number;
  color?: string;
}) => (
  <g
    fill="none"
    stroke={dim ? `${color}45` : color}
    strokeWidth={sw}
    strokeLinejoin="round"
  >
    <path
      d={`M${b.cx - b.hw} ${b.cy}L${b.cx - b.hw} ${b.cy + b.h}L${b.cx} ${
        b.cy + b.hh + b.h
      }L${b.cx} ${b.cy + b.hh}Z`}
    />
    <path
      d={`M${b.cx + b.hw} ${b.cy}L${b.cx + b.hw} ${b.cy + b.h}L${b.cx} ${
        b.cy + b.hh + b.h
      }L${b.cx} ${b.cy + b.hh}Z`}
    />
    <path
      d={`M${b.cx - b.hw} ${b.cy}L${b.cx} ${b.cy + b.hh}L${b.cx + b.hw} ${
        b.cy
      }L${b.cx} ${b.cy - b.hh}Z`}
    />
  </g>
);

const scenes: Record<ArtName, (isLight?: boolean) => React.ReactNode> = {
  /* ---------- existing scenes (same as the Solutions page) ---------- */
  hospital: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 240, hw: 108, hh: 54, h: 18 };
    const c: B = { cx: 170, cy: 132, hw: 58, hh: 29, h: 100 };
    const wl: B = { cx: 112, cy: 196, hw: 44, hh: 22, h: 38 };
    const wr: B = { cx: 228, cy: 196, hw: 44, hh: 22, h: 38 };
    const rows = [
      [0.1, 0.24],
      [0.34, 0.48],
    ];
    const cols = [
      [0.14, 0.42],
      [0.58, 0.86],
    ];
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={c} color={col} />
        {rows.flatMap(([v0, v1]) =>
          cols.flatMap(([u0, u1]) =>
            (["l", "r"] as const).map((side) => (
              <S
                key={`${side}${v0}${u0}`}
                d={faceQuad(c, side, u0, u1, v0, v1)}
                sw={0.9}
                color={col}
              />
            ))
          )
        )}
        <Box b={wl} color={col} />
        <Box b={wr} color={col} />
        <S d={faceQuad(wl, "l", 0.2, 0.45, 0.3, 0.65)} sw={0.9} color={col} />
        <S d={faceQuad(wr, "r", 0.2, 0.45, 0.3, 0.65)} sw={0.9} color={col} />
        <S d="M146 120L194 144M146 144L194 120" sw={1.4} color={col} />
        <S d="M270 88V112M258 100H282" dim color={col} />
      </>
    );
  },

  clinic: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const lo: B = { cx: 150, cy: 170, hw: 92, hh: 46, h: 14 };
    const up: B = { cx: 150, cy: 136, hw: 92, hh: 46, h: 14 };
    const cs = [0.06, 0.28, 0.5, 0.72];
    const rs = [0.1, 0.38, 0.66];
    const hc = topPt(up, cs[1] + 0.1, rs[1] + 0.11);
    const r1 = topPt(up, 0.3, 0);
    const r2 = topPt(up, 0.7, 0);
    return (
      <>
        <Box b={lo} dim color={col} />
        <Box b={up} color={col} />
        {cs.flatMap((s, i) =>
          rs.map((t, j) => (
            <S
              key={`${i}-${j}`}
              d={topQuad(up, s, s + 0.2, t, t + 0.22)}
              dim={!(i === 1 && j === 1)}
              sw={0.9}
              color={col}
            />
          ))
        )}
        <S
          d={`M${hc[0] - 6} ${hc[1]}L${hc[0] - 2} ${hc[1] + 4}L${hc[0] + 7} ${
            hc[1] - 5
          }`}
          sw={1.3}
          color={col}
        />
        <S d={lineD(r1, [r1[0], r1[1] - 18])} sw={2} color={col} />
        <S d={lineD(r2, [r2[0], r2[1] - 18])} sw={2} color={col} />

        <path
          d="M220 240V262A42 21 0 0 0 304 262V240"
          fill="none"
          stroke={col}
          strokeWidth="1"
        />
        <ellipse
          cx="262"
          cy="240"
          rx="42"
          ry="21"
          fill="none"
          stroke={col}
          strokeWidth="1"
        />
        <ellipse
          cx="262"
          cy="240"
          rx="34"
          ry="17"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <S d="M262 240V224M262 240L277 248" sw={1.2} color={col} />
        <circle cx="262" cy="240" r="1.8" fill={col} />
      </>
    );
  },

  industry: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 238, hw: 112, hh: 56, h: 16 };
    const chim: B = { cx: 238, cy: 96, hw: 14, hh: 7, h: 86 };
    const main: B = { cx: 158, cy: 182, hw: 88, hh: 44, h: 54 };
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={chim} dim color={col} />
        <Box b={main} color={col} />
        {[0.18, 0.5, 0.82].map((s) => {
          const p = topPt(main, s, 0.5);
          return (
            <Box
              key={s}
              b={{ cx: p[0], cy: p[1] - 16, hw: 13, hh: 6.5, h: 16 }}
              color={col}
            />
          );
        })}
        <S
          d={faceQuad(main, "l", 0.08, 0.28, 0.25, 0.6)}
          sw={0.9}
          color={col}
        />
        <S
          d={faceQuad(main, "l", 0.72, 0.92, 0.25, 0.6)}
          sw={0.9}
          color={col}
        />
        <S d={faceQuad(main, "r", 0.15, 0.4, 0.25, 0.6)} sw={0.9} color={col} />
        <S d={faceQuad(main, "r", 0.6, 0.85, 0.25, 0.6)} sw={0.9} color={col} />
        <S
          d={`${lineD(
            facePt(main, "l", 0.38, 0.45),
            facePt(main, "l", 0.62, 0.45)
          )}${lineD(facePt(main, "l", 0.5, 0.2), facePt(main, "l", 0.5, 0.7))}`}
          sw={1.3}
          color={col}
        />
        <circle cx="238" cy="74" r="6" fill="none" stroke={`${col}45`} />
        <circle cx="248" cy="56" r="9" fill="none" stroke={`${col}45`} />
        <circle cx="236" cy="34" r="12" fill="none" stroke={`${col}45`} />
      </>
    );
  },

  dental: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 246, hw: 104, hh: 52, h: 16 };
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={{ cx: 92, cy: 232, hw: 16, hh: 8, h: 14 }} dim color={col} />
        <Box b={{ cx: 248, cy: 232, hw: 16, hh: 8, h: 14 }} dim color={col} />
        <ellipse
          cx="170"
          cy="226"
          rx="56"
          ry="14"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <path
          transform="translate(55.8 -5.6) scale(1.9)"
          d="M36 24C24 24 18 36 22 52c3 12 6 22 8 36 1 10 5 16 10 16 6 0 7-16 10-24 2-5 18-5 20 0 3 8 4 24 10 24 5 0 9-6 10-16 2-14 5-24 8-36 4-16-2-28-14-28-9 0-16 6-24 6s-15-6-24-6z"
          fill="none"
          stroke={col}
          strokeWidth="1.15"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          transform="translate(55.8 -5.6) scale(1.9)"
          d="M34 38c-5 2-8 7-8 14"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <S d="M268 70V94M256 82H280" dim color={col} />
      </>
    );
  },

  pharmacy: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    return (
      <>
        <ellipse
          cx="170"
          cy="238"
          rx="96"
          ry="48"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <ellipse
          cx="170"
          cy="238"
          rx="80"
          ry="40"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />

        <path
          d="M126 124V230A44 22 0 0 0 214 230V124"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="124"
          rx="44"
          ry="22"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <S d="M126 160A44 22 0 0 0 214 160" dim color={col} />
        <S d="M126 204A44 22 0 0 0 214 204" dim color={col} />
        <S d="M170 172V198M157 185H183" sw={1.3} color={col} />
        <path
          d="M132 98V122A38 19 0 0 0 208 122V98"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="98"
          rx="38"
          ry="19"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="98"
          rx="28"
          ry="14"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />

        <g transform="translate(272 262) rotate(-28)">
          <rect
            x="-42"
            y="-14"
            width="84"
            height="28"
            rx="14"
            fill="none"
            stroke={col}
            strokeWidth="1.1"
          />
          <path d="M0 -14V14" stroke={`${col}45`} strokeWidth="0.9" />
        </g>
        <path
          d="M56 268v8A22 11 0 0 0 100 276v-8"
          fill="none"
          stroke={col}
          strokeWidth="1"
        />
        <ellipse
          cx="78"
          cy="268"
          rx="22"
          ry="11"
          fill="none"
          stroke={col}
          strokeWidth="1"
        />
        <S d="M62 268H94" dim color={col} />
      </>
    );
  },

  maternity: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 244, hw: 108, hh: 54, h: 14 };
    const crib: B = { cx: 170, cy: 220, hw: 76, hh: 38, h: 22 };
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={crib} color={col} />
        {[0.2, 0.4, 0.6, 0.8].map((u) => (
          <S
            key={u}
            d={lineD(facePt(crib, "l", u, 0), facePt(crib, "l", u, 1))}
            dim
            sw={0.9}
            color={col}
          />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((u) => (
          <S
            key={`r${u}`}
            d={lineD(facePt(crib, "r", u, 0), facePt(crib, "r", u, 1))}
            dim
            sw={0.9}
            color={col}
          />
        ))}
        <ellipse
          cx="170"
          cy="150"
          rx="62"
          ry="31"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
          strokeDasharray="2 5"
        />
        <ellipse
          cx="170"
          cy="150"
          rx="82"
          ry="41"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
          strokeDasharray="2 5"
        />
        <path
          d="M170 128C170 106 138 104 138 128C138 150 170 170 170 170C170 170 202 150 202 128C202 104 170 106 170 128Z"
          fill="none"
          stroke={col}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <S d="M150 134H162L167 124L174 146L179 134H190" sw={1.2} color={col} />
        <S d="M270 70V94M258 82H282" dim color={col} />
        <S d="M60 96V116M50 106H70" dim color={col} />
      </>
    );
  },

  /* ---------- new scenes ---------- */

  /* Shield with a padlock, standing on a base plate */
  security: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 244, hw: 108, hh: 54, h: 14 };
    return (
      <>
        <Box b={base} dim color={col} />
        <ellipse
          cx="170"
          cy="236"
          rx="70"
          ry="18"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <path
          d="M170 54L242 84V148C242 198 208 230 170 246C132 230 98 198 98 148V84Z"
          fill="none"
          stroke={col}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M170 76L222 98V148C222 184 198 208 170 220C142 208 118 184 118 148V98Z"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <rect
          x="152"
          y="140"
          width="36"
          height="30"
          rx="5"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
        />
        <S d="M159 140V130A11 11 0 0 1 181 130V140" sw={1.3} color={col} />
        <S d="M170 151V160" sw={1.5} color={col} />
        <S d="M278 64V88M266 76H290" dim color={col} />
        <S d="M58 110V130M48 120H68" dim color={col} />
      </>
    );
  },

  /* Monitor with a rising bar chart, and a step-up base */
  training: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 250, hw: 104, hh: 50, h: 12 };
    return (
      <>
        <Box b={base} dim color={col} />
        <rect
          x="80"
          y="66"
          width="180"
          height="120"
          rx="10"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
        />
        <rect
          x="92"
          y="78"
          width="156"
          height="96"
          rx="5"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <S d="M170 186V222M132 226H208" sw={1.2} color={col} />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={108 + i * 30}
            y={150 - (i + 1) * 15}
            width="18"
            height={(i + 1) * 15 + 10}
            fill="none"
            stroke={i === 3 ? col : `${col}45`}
            strokeWidth="1"
          />
        ))}
        <S d="M108 112L138 98L168 104L226 84" dim color={col} />
        <S d="M214 90L226 84L222 97" sw={1.2} color={col} />
        <S d="M282 118V142M270 130H294" dim color={col} />
        <S d="M52 88V108M42 98H62" dim color={col} />
      </>
    );
  },

  /* Headset with a microphone and a speech bubble */
  support: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 252, hw: 100, hh: 48, h: 12 };
    return (
      <>
        <Box b={base} dim color={col} />
        <ellipse
          cx="170"
          cy="240"
          rx="64"
          ry="16"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <path
          d="M100 160A70 70 0 0 1 240 160"
          fill="none"
          stroke={col}
          strokeWidth="1.3"
        />
        <path
          d="M110 160A60 60 0 0 1 230 160"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <rect
          x="88"
          y="156"
          width="26"
          height="52"
          rx="11"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
        />
        <rect
          x="226"
          y="156"
          width="26"
          height="52"
          rx="11"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
        />
        <path
          d="M239 208C239 236 214 244 190 244"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle
          cx="184"
          cy="244"
          r="6"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
        />
        <path
          d="M236 54H292A8 8 0 0 1 300 62V92A8 8 0 0 1 292 100H262L250 114V100H236A8 8 0 0 1 228 92V62A8 8 0 0 1 236 54Z"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <S d="M244 70H284M244 82H268" dim color={col} />
        <S d="M54 84V106M43 95H65" dim color={col} />
      </>
    );
  },

  /* Old stack on the left, new stack on the right, records moving across */
  migration: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 250, hw: 120, hh: 56, h: 12 };
    const from: B = { cx: 90, cy: 184, hw: 44, hh: 22, h: 54 };
    const to: B = { cx: 252, cy: 150, hw: 44, hh: 22, h: 88 };
    const mid: B = { cx: 170, cy: 120, hw: 14, hh: 7, h: 14 };
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={from} dim color={col} />
        {[0.34, 0.67].map((v) => (
          <S
            key={v}
            d={lineD(facePt(from, "l", 0, v), facePt(from, "l", 1, v))}
            dim
            color={col}
          />
        ))}
        <Box b={to} color={col} />
        {[0.25, 0.5, 0.75].map((v) => (
          <S
            key={v}
            d={lineD(facePt(to, "r", 0, v), facePt(to, "r", 1, v))}
            dim
            color={col}
          />
        ))}
        <S d={faceQuad(to, "l", 0.25, 0.75, 0.15, 0.3)} sw={0.9} color={col} />
        <path
          d="M118 168C140 130 200 104 222 112"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeDasharray="2 5"
        />
        <Box b={mid} color={col} />
        <S d="M150 80H196M186 70L196 80L186 90" sw={1.3} color={col} />
        <S d="M60 112V132M50 122H70" dim color={col} />
        <S d="M296 70V92M285 81H307" dim color={col} />
      </>
    );
  },

  /* A single small practice with a cross and a door */
  solo: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 248, hw: 104, hh: 52, h: 14 };
    const house: B = { cx: 170, cy: 152, hw: 62, hh: 31, h: 74 };
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={house} color={col} />
        <S d={faceQuad(house, "r", 0.3, 0.7, 0.35, 1)} sw={1} color={col} />
        <S
          d={faceQuad(house, "l", 0.2, 0.45, 0.25, 0.5)}
          sw={0.9}
          color={col}
        />
        <S
          d={faceQuad(house, "l", 0.55, 0.8, 0.25, 0.5)}
          sw={0.9}
          color={col}
        />
        <S d="M170 100V124M158 112H182" sw={1.6} color={col} />
        <S d={topQuad(house, 0.2, 0.8, 0.2, 0.8)} dim sw={0.9} color={col} />
        <path
          d="M60 224C60 214 72 210 80 216C88 206 104 212 100 226"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <S d="M270 70V94M258 82H282" dim color={col} />
      </>
    );
  },

  /* Three connected branches sharing one network */
  group: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 252, hw: 124, hh: 58, h: 12 };
    const a: B = { cx: 82, cy: 176, hw: 36, hh: 18, h: 60 };
    const b: B = { cx: 170, cy: 128, hw: 40, hh: 20, h: 90 };
    const c: B = { cx: 258, cy: 176, hw: 36, hh: 18, h: 60 };
    return (
      <>
        <Box b={base} dim color={col} />
        <Box b={a} color={col} />
        <Box b={c} color={col} />
        <Box b={b} color={col} />
        {[a, b, c].map((bx, i) => (
          <React.Fragment key={i}>
            <S
              d={faceQuad(bx, "l", 0.2, 0.8, 0.15, 0.3)}
              sw={0.9}
              color={col}
            />
            <S
              d={faceQuad(bx, "l", 0.2, 0.8, 0.45, 0.6)}
              sw={0.9}
              color={col}
            />
            <S
              d={faceQuad(bx, "r", 0.2, 0.8, 0.15, 0.3)}
              dim
              sw={0.9}
              color={col}
            />
            <S
              d={faceQuad(bx, "r", 0.2, 0.8, 0.45, 0.6)}
              dim
              sw={0.9}
              color={col}
            />
          </React.Fragment>
        ))}
        <path
          d="M82 150C100 100 130 84 170 84C210 84 240 100 258 150"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeDasharray="2 5"
        />
        <circle
          cx="170"
          cy="84"
          r="4"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
        />
        <circle
          cx="82"
          cy="150"
          r="3"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <circle
          cx="258"
          cy="150"
          r="3"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <S d="M170 52V70M161 61H179" dim color={col} />
      </>
    );
  },
};

const Art = ({ name, isLight }: { name: ArtName; isLight?: boolean }) => (
  <svg
    viewBox="0 0 340 340"
    preserveAspectRatio="xMidYMid meet"
    className="h-full w-full"
    fill="none"
    aria-hidden="true"
  >
    {scenes[name](isLight)}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

const Check = ({ isLight }: { isLight?: boolean }) => (
  <svg
    style={{ color: PRIMARY_COLOR }}
    className="mt-0.5 h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      strokeWidth="2"
      opacity="0.35"
      stroke={isLight ? PRIMARY_COLOR : undefined}
    />
    <path d="M7.5 12.5l3 3 6-7" />
  </svg>
);

const BetaBadge = () => (
  <span
    className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white"
    style={{ backgroundColor: PRIMARY_COLOR }}
  >
    <T>Beta</T>
  </span>
);

const Sparkle = () => (
  <svg
    className="h-5 w-5 text-white md:h-7 md:w-7"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
  </svg>
);

/* Torn paper edge */
const EDGE_PATH =
  "M0 395V180L18 180L32 175L40 178L75 200L110 211L150 198L165 185L175 177L185 181L220 157L255 146L270 150L290 165L310 175L335 177L350 168L365 157L395 152L410 149L458 150L470 153L530 166L560 170L605 178L630 170L670 176L725 173L735 166L765 170L825 170L840 160L870 138L885 129L920 122L925 120L1400 120L1410 123L1430 121L1605 121L1620 125L1650 127L1665 127L1690 120L1710 120L1722 133L1740 130L1750 120L1915 120L1930 121L2335 121L2342 121L2323 172L2303 187L2320 196L2392 200L2430 193L2462 189L2485 197L2545 210L2576 206V395Z";

function RoughEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 2576 395"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-20 block h-14 w-full md:h-24 lg:h-32 ${
        position === "top" ? "-top-px rotate-180" : "-bottom-px"
      }`}
    >
      <path d={EDGE_PATH} fill="#000" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                             */
/* ------------------------------------------------------------------ */

export default function FeaturePage({
  headline,
  subtitle,
  browseLabel = "Explore",
  visionLabel,
  visionLead,
  visionMuted,
  items,
  closing,
}: FeaturePageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstId = items[0]?.id ?? "";
  const heroTiles = items.slice(0, 4);

  // Scroll to #hash on load and when the hash changes (navbar links)
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const id = hash.slice(1);
      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  // Animations
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-hero] > *", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.fromTo(
        "[data-image-wrap]",
        { clipPath: "inset(18% 4% 0% 4% round 28px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          ease: "none",
          scrollTrigger: {
            trigger: "[data-image-wrap]",
            start: "top 95%",
            end: "top 40%",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        "[data-image]",
        { scale: 1.18, yPercent: -4 },
        {
          scale: 1,
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-image-wrap]",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      gsap.from("[data-vision] > *", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-vision]", start: "top 85%" },
      });

      gsap.from("[data-closing] > *", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-closing]", start: "top 88%" },
      });

      gsap.utils.toArray<HTMLElement>("[data-solution]").forEach((section) => {
        const textElements = section.querySelectorAll(
          "[data-text] > *:not(ul)"
        );
        const featureItems = section.querySelectorAll("[data-feature-item]");
        const actions = section.querySelector("[data-actions]");
        const panel = section.querySelector("[data-panel]");
        const art = section.querySelector("[data-art]");

        gsap.from(textElements, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 75%" },
        });

        gsap.from(featureItems, {
          opacity: 0,
          x: -20,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 70%" },
        });

        gsap.from(actions, {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 68%" },
        });

        gsap.fromTo(
          panel,
          { opacity: 0, y: 50, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 75%" },
          }
        );

        gsap.to(art, {
          y: -10,
          duration: 3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={rootRef} className="w-full bg-black font-lufga text-white">
      {/* ---------- Page hero ---------- */}
      <header className="mx-auto max-w-7xl px-6 pb-12 pt-32 md:pb-16 md:pt-44 lg:px-12">
        <div
          data-hero
          className="grid items-end gap-10 md:grid-cols-[1.7fr_1fr] md:gap-16"
        >
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            <T>{headline.before}</T>{" "}
            <span
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="mx-1 inline-flex h-9 w-9 items-center justify-center rounded-full align-middle md:h-12 md:w-12"
            >
              <Sparkle />
            </span>{" "}
            <T>{headline.middle}</T>{" "}
            <span
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="inline-block px-2 md:px-3"
            >
              <T>{headline.accent}</T>
            </span>
          </h1>

          <div className="flex flex-col items-start gap-5 md:pb-2">
            <p className="max-w-sm text-sm leading-relaxed text-white/60 md:text-base">
              <T>{subtitle}</T>
            </p>
            <a
              href={`#${firstId}`}
              onClick={(e) => jump(e, firstId)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = PRIMARY_COLOR;
                e.currentTarget.style.color = PRIMARY_COLOR;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                e.currentTarget.style.color = "#ffffff";
              }}
              className="group inline-flex items-center gap-1.5 border-b border-white/40 pb-0.5 text-sm font-medium text-white transition-colors"
            >
              <T>{browseLabel}</T>
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              >
                ↗
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* ---------- Big illustration band ---------- */}
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div
          data-image-wrap
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] bg-[#111] md:aspect-[16/7]"
        >
          <div data-image className="absolute inset-0 will-change-transform">
            {/* Mobile: one illustration */}
            <div className="relative h-full w-full bg-black p-6 md:hidden">
              <Art name={heroTiles[0]?.art ?? "hospital"} />
            </div>
            {/* Desktop: up to four illustrations */}
            <div className="hidden h-full w-full grid-cols-4 gap-2 bg-black p-2 md:grid">
              {heroTiles.map((it) => (
                <div
                  key={it.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-transparent p-4"
                >
                  <Art name={it.art} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Vision (white section with torn edges) ---------- */}
      <section className="relative my-16 w-full overflow-hidden bg-white py-16 text-black md:py-24">
        <RoughEdge position="top" />
        <RoughEdge position="bottom" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-12">
          <div data-vision className="flex flex-col justify-center">
            <span className="mb-4 text-xs font-semibold uppercase tracking-widest text-black/50">
              <T>{visionLabel}</T>
            </span>

            <h2 className="max-w-4xl text-3xl font-normal leading-[1.25] tracking-tight text-black md:text-5xl">
              <T>{productName}</T>{" "}
              <span className="mx-1 inline-flex h-8 w-auto items-center justify-center align-middle md:h-10">
                <Image
                  src="/medbrainers-logo.svg"
                  alt={productName}
                  width={120}
                  height={32}
                  className="h-full w-auto object-contain"
                />
              </span>{" "}
              <T>{visionLead}</T>
              <span className="ml-1 text-black/40">
                <T>{visionMuted}</T>
              </span>
            </h2>
          </div>
        </div>
      </section>

      {/* ---------- One section per item ---------- */}
      {items.map((s, i) => {
        const flip = i % 2 === 1;
        // every 3rd section uses the white background and torn edges
        const isWhiteSection = (i + 1) % 3 === 0;

        return (
          <section
            key={s.id}
            id={s.id}
            data-solution
            className={`relative scroll-mt-24 ${
              isWhiteSection ? "my-12 bg-white py-24 text-black md:py-36" : ""
            }`}
          >
            {isWhiteSection && <RoughEdge position="top" />}
            {isWhiteSection && <RoughEdge position="bottom" />}

            <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:gap-20 lg:px-12">
              {/* text */}
              <div data-text className={flip ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      isWhiteSection ? "text-black/40" : "text-white/40"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(items.length).padStart(2, "0")}
                  </span>
                  {s.beta && <BetaBadge />}
                </div>
                <h2
                  className={`mt-4 text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl ${
                    isWhiteSection ? "text-black" : "text-white"
                  }`}
                >
                  <T>{s.title}</T>
                </h2>
                <p
                  style={{ color: PRIMARY_COLOR }}
                  className="mt-3 text-base font-medium md:text-lg"
                >
                  <T>{s.tagline}</T>
                </p>
                <p
                  className={`mt-6 max-w-lg text-base leading-relaxed ${
                    isWhiteSection ? "text-black/70" : "text-white/60"
                  }`}
                >
                  <T>{s.intro}</T>
                </p>

                <ul className="mt-8 flex max-w-lg flex-col gap-3.5">
                  {s.features.map((f) => (
                    <li
                      key={f}
                      data-feature-item
                      className={`flex gap-3 text-[15px] ${
                        isWhiteSection ? "text-black/85" : "text-white/85"
                      }`}
                    >
                      <Check isLight={isWhiteSection} />
                      <T>{f}</T>
                    </li>
                  ))}
                </ul>

                <div
                  data-actions
                  className="mt-10 flex flex-wrap items-center gap-3"
                >
                  <Link
                    href="/get-started"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                    className="group inline-flex items-center gap-3 rounded-full py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105"
                  >
                    <T>Get started</T>
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
                    >
                      →
                    </span>
                  </Link>

                  <Link
                    href="/pricing"
                    className={`group inline-flex items-center gap-3 rounded-full py-2 pl-8 pr-2 text-base font-semibold transition-transform hover:scale-105 ${
                      isWhiteSection
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    <T>View pricing</T>
                    <span
                      aria-hidden="true"
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-transform duration-200 group-hover:rotate-45 ${
                        isWhiteSection
                          ? "bg-white text-black"
                          : "bg-black text-white"
                      }`}
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>

              {/* illustration panel */}
              <div
                data-panel
                className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[28px] border p-8 ${
                  isWhiteSection
                    ? "border-black/10 bg-black text-white"
                    : "border-white/10"
                } ${flip ? "lg:order-1" : ""}`}
              >
                <div data-art className="relative h-full w-full">
                  <Art name={s.art} isLight={false} />
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ---------- Closing call to action ---------- */}
      <section className="mx-auto max-w-7xl px-6 pb-28 pt-12 lg:px-12">
        <div
          data-closing
          className="flex flex-col items-start gap-6 rounded-[28px] border border-white/10 bg-[#0d0d0f] p-8 md:p-14"
        >
          <h2 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            <T>{closing.title}</T>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-white/60">
            <T>{closing.text}</T>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/get-started"
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="group inline-flex items-center gap-3 rounded-full py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105"
            >
              <T>Get started</T>
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
              >
                →
              </span>
            </Link>
            {/* <Link
              href="/demo"
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105"
            >
              <T>Book a demo</T>
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
              >
                →
              </span>
            </Link> */}
          </div>
        </div>
      </section>
    </div>
  );
}
