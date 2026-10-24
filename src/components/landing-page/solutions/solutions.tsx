"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useEffect, useRef, useState } from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T, useT, useLocale } from "@/i18n/provider";
import { formatStat } from "@/i18n/format";
import { productName } from "@/constants/site";

gsap.registerPlugin(ScrollTrigger);

type ArtName =
  | "hospital"
  | "clinic"
  | "emr"
  | "industry"
  | "dental"
  | "pharmacy"
  | "records"
  | "theatre"
  | "maternity"
  | "radiology"
  | "blood"
  | "ai";

/* Section ids match the navbar links (#hospital-management, #emr, ...) */
const solutions: {
  id: string;
  title: string;
  tagline: string;
  intro: string;
  features: string[];
  art: ArtName;
  beta?: boolean;
}[] = [
  {
    id: "hospital-management",
    title: "Hospital Management System",
    tagline: "Comprehensive administration & coordination",
    intro:
      "Run the whole hospital from one connected platform, from the front desk and wards to billing, labs and pharmacy, with every department working from the same live data.",
    features: [
      "Patient registration, billing and HMO claims",
      "Wards, beds and admissions in a single view",
      "Lab, pharmacy and billing connected end to end",
      "Role-based dashboards for admins and department heads",
    ],
    art: "hospital",
  },
  {
    id: "clinic-information",
    title: "Clinic Information System",
    tagline: "Scheduling, queue & practitioner tools",
    intro:
      "Keep clinics running smoothly with simple scheduling, a live patient queue and the tools practitioners need to see more patients with less friction.",
    features: [
      "Appointment booking with automatic reminders",
      "Live patient queue and triage status",
      "Practitioner schedules and availability",
      "Walk-in and follow-up visit tracking",
    ],
    art: "clinic",
  },
  {
    id: "emr",
    title: "Electronic Medical Record (EMR)",
    tagline: "Clinical notes, vitals & patient history",
    intro:
      "A complete digital chart for every patient. Clinicians capture notes and vitals quickly and always see the full history before they make a decision.",
    features: [
      "Structured clinical notes with reusable templates",
      "Vitals capture with trend charts over time",
      "Full patient history available at a glance",
      "Prescriptions, orders and results in one chart",
    ],
    art: "emr",
  },
  {
    id: "industry-clinic",
    title: "Industry Clinic System",
    tagline: "Workplace health & occupational services",
    intro:
      "Purpose-built for company and industrial clinics, covering the medicals, incident records and reporting that employers and regulators expect.",
    features: [
      "Pre-employment and periodic medical examinations",
      "Occupational injury and incident logs",
      "Fitness-to-work certificates in a few clicks",
      "Company-level health and absence reports",
    ],
    art: "industry",
  },
  {
    id: "dental-clinic",
    title: "Dental Clinic Management",
    tagline: "Specialized charts & graphical odontograms",
    intro:
      "Chart every tooth visually, plan treatment with confidence and keep patients coming back with timely recalls, all in a system designed around dentistry.",
    features: [
      "Graphical odontogram charting",
      "Treatment plans and procedure history",
      "Dental imaging and document attachments",
      "Recall lists and appointment reminders",
    ],
    art: "dental",
  },
  {
    id: "pharmacy-management",
    title: "Pharmacy Management System",
    tagline: "Dispensing, stock alerts & prescriptions",
    intro:
      "Dispense accurately, never run out of essentials and keep every prescription traceable, whether the pharmacy is inside a hospital or on its own.",
    features: [
      "Prescription-to-dispensing workflow",
      "Live stock levels with low-stock alerts",
      "Batch and expiry date tracking",
      "Supplier orders and purchase records",
    ],
    art: "pharmacy",
  },
  {
    id: "hospital-records",
    title: "Hospital Records Management",
    tagline: "Secure digital archiving & fast retrieval",
    intro:
      "Replace shelves of folders with a secure digital archive. Find any record in seconds and know exactly who has accessed it.",
    features: [
      "Secure digital archiving of patient files",
      "Fast search and instant retrieval",
      "Permissions and a full access log",
      "Scan and index legacy paper records",
    ],
    art: "records",
  },
  {
    id: "operating-theatre",
    title: "Operating Theatre Management",
    tagline: "Surgical checklists & real-time tracking",
    intro:
      "Bring order to the theatre with scheduling, safety checklists and live case tracking, so every procedure runs safely and on time.",
    features: [
      "Surgical safety checklists for every case",
      "Real-time case and patient tracking",
      "Theatre scheduling and staff allocation",
      "Instrument and consumable counts",
    ],
    art: "theatre",
  },
  {
    id: "maternity",
    title: "Maternity Management",
    tagline: "Antenatal care, delivery & postnatal follow-up",
    intro:
      "Support mothers and newborns from the first antenatal visit through delivery and postnatal care, with every step recorded in one connected chart.",
    features: [
      "Antenatal registration and visit scheduling",
      "Delivery records and labour progress notes",
      "Newborn records and immunisation tracking",
      "Postnatal follow-up with automatic reminders",
    ],
    art: "maternity",
  },
  {
    id: "radiology",
    title: "Radiology",
    tagline: "Imaging orders, reporting & results workflow",
    intro:
      "Take imaging from request to report without the paperwork. Clinicians order scans from the patient chart and radiologists return results straight into it.",
    features: [
      "Imaging requests raised from the patient chart",
      "Scheduling and worklists for each imaging room",
      "Radiologist reporting with reusable templates",
      "Reports and images delivered to the patient record",
    ],
    art: "radiology",
    beta: true,
  },
  {
    id: "blood-bank",
    title: "Blood Bank",
    tagline: "Donor records, inventory & transfusion tracking",
    intro:
      "Know exactly what is on the shelf and where every unit goes. Track donors, stock and transfusions with the traceability that safe blood handling demands.",
    features: [
      "Donor registration and screening records",
      "Blood unit inventory with expiry alerts",
      "Cross-match and issue tracking",
      "Transfusion records and reaction logging",
    ],
    art: "blood",
    beta: true,
  },
  {
    id: "ai-analysis",
    title: "AI Analysis",
    tagline: "Intelligent insights & clinical decision support",
    intro:
      "Turn the data your facility already records into insight. AI-assisted analysis helps clinicians and administrators spot patterns sooner and act with more confidence.",
    features: [
      "Trend and anomaly detection across patient data",
      "Decision-support suggestions for clinicians",
      "Operational analytics for administrators",
      "Quick summaries of long patient histories",
    ],
    art: "ai",
    beta: true,
  },
];

/* ---------- Isometric wireframe illustrations (Transparent Backgrounds) ---------- */
const DIM = "#ffffff45";
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

  emr: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const mk = (cy: number): B => ({ cx: 170, cy, hw: 96, hh: 48, h: 12 });
    const top = mk(154);
    const ecg: [number, number][] = [
      [0.08, 0],
      [0.3, 0],
      [0.37, -10],
      [0.44, 14],
      [0.52, -26],
      [0.6, 12],
      [0.68, 0],
      [0.92, 0],
    ];
    const d =
      "M" +
      ecg
        .map(([s, dy]) => {
          const p = topPt(top, s, 0.5);
          return `${p[0]} ${p[1] + dy}`;
        })
        .join("L");
    return (
      <>
        <Box b={mk(222)} dim color={col} />
        <Box b={mk(188)} dim color={col} />
        <Box b={top} color={col} />
        <S
          d={lineD(topPt(top, 0.08, 0.2), topPt(top, 0.5, 0.2))}
          dim
          color={col}
        />
        <S
          d={lineD(topPt(top, 0.08, 0.82), topPt(top, 0.42, 0.82))}
          dim
          color={col}
        />
        <S d={d} sw={1.5} color={col} />
        <Box b={{ cx: 270, cy: 84, hw: 16, hh: 8, h: 16 }} dim color={col} />
        <S d="M60 84V108M48 96H72" dim color={col} />
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

  records: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const c: B = { cx: 178, cy: 104, hw: 56, hh: 28, h: 150 };
    const sl = (cy: number): B => ({ cx: 78, cy, hw: 56, hh: 28, h: 10 });
    const lock: B = { cx: 270, cy: 226, hw: 20, hh: 10, h: 24 };
    return (
      <>
        <Box b={c} color={col} />
        {(["l", "r"] as const).map((side) => (
          <React.Fragment key={side}>
            <S
              d={lineD(facePt(c, side, 0, 0.34), facePt(c, side, 1, 0.34))}
              dim={side === "r"}
              color={col}
            />
            <S
              d={lineD(facePt(c, side, 0, 0.67), facePt(c, side, 1, 0.67))}
              dim={side === "r"}
              color={col}
            />
            {[0.14, 0.47, 0.8].map((v) => (
              <S
                key={v}
                d={faceQuad(c, side, 0.3, 0.7, v, v + 0.06)}
                dim={side === "r"}
                sw={0.9}
                color={col}
              />
            ))}
          </React.Fragment>
        ))}
        <Box b={sl(240)} dim color={col} />
        <Box b={sl(226)} color={col} />
        <S
          d={lineD(topPt(sl(226), 0.15, 0.5), topPt(sl(226), 0.6, 0.5))}
          dim
          color={col}
        />
        <Box b={lock} color={col} />
        <S d="M258 226A12 12 0 0 1 282 226" sw={1.6} color={col} />
        <S d="M270 70V94M258 82H282" dim color={col} />
      </>
    );
  },

  theatre: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const table: B = { cx: 170, cy: 238, hw: 104, hh: 48, h: 12 };
    return (
      <>
        <ellipse
          cx="170"
          cy="324"
          rx="56"
          ry="12"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <S d="M170 298V322" color={col} />
        <Box b={table} color={col} />
        <S d="M142 224L198 252M142 252L198 224" sw={1.2} color={col} />

        <path
          d="M122 102L82 236M218 102L258 236"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeDasharray="2 5"
          fill="none"
        />

        <S d="M170 54V8" sw={1.4} color={col} />
        <path
          d="M106 76V92A64 22 0 0 0 234 92V76"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="76"
          rx="64"
          ry="22"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="76"
          rx="40"
          ry="14"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        {[130, 150, 170, 190, 210].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={i % 2 === 0 ? 106 : 112}
            r="3"
            fill="none"
            stroke={`${col}45`}
          />
        ))}
      </>
    );
  },

  /* Heart above a crib, with soft pulse rings */
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

  /* CT-style scanner ring with patient table */
  radiology: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const table: B = { cx: 170, cy: 236, hw: 104, hh: 40, h: 10 };
    return (
      <>
        <Box b={table} dim color={col} />
        {/* gantry tube */}
        <path
          d="M130 82H200M130 218H200"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="130"
          cy="150"
          rx="30"
          ry="68"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <ellipse
          cx="200"
          cy="150"
          rx="30"
          ry="68"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <ellipse
          cx="200"
          cy="150"
          rx="19"
          ry="44"
          fill="none"
          stroke={col}
          strokeWidth="1"
        />
        <ellipse
          cx="200"
          cy="150"
          rx="9"
          ry="20"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        {/* patient bed passing through */}
        <S d="M90 170L180 170" sw={1.2} color={col} />
        <S d="M90 178L180 178" dim color={col} />
        {/* scan rays */}
        <path
          d="M256 96L276 76M262 150H292M256 204L276 224"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeDasharray="2 5"
        />
        <S d="M60 70V94M48 82H72" dim color={col} />
      </>
    );
  },

  /* Blood drop, blood bag and stock shelf */
  blood: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 250, hw: 110, hh: 52, h: 14 };
    return (
      <>
        <Box b={base} dim color={col} />
        {/* drop */}
        <path
          d="M130 70C130 70 82 128 82 168A48 48 0 0 0 178 168C178 128 130 70 130 70Z"
          fill="none"
          stroke={col}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M104 170C104 186 114 198 128 200"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <S d="M130 150V186M112 168H148" sw={1.4} color={col} />
        {/* blood bag */}
        <rect
          x="218"
          y="140"
          width="62"
          height="92"
          rx="14"
          fill="none"
          stroke={col}
          strokeWidth="1.1"
        />
        <rect
          x="226"
          y="180"
          width="46"
          height="44"
          rx="8"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="0.9"
        />
        <S d="M240 140V120H258V140" sw={1.1} color={col} />
        <S d="M249 120V96C249 84 262 82 270 82" dim color={col} />
        <S d="M232 160H266M232 170H258" dim color={col} />
        <S d="M290 64V88M278 76H302" dim color={col} />
      </>
    );
  },

  /* Processor chip with circuit traces and a spark */
  ai: (isLight) => {
    const col = isLight ? "#000" : "#fff";
    const base: B = { cx: 170, cy: 212, hw: 118, hh: 58, h: 12 };
    const chip: B = { cx: 170, cy: 138, hw: 66, hh: 33, h: 24 };
    const c = topPt(chip, 0.5, 0.5);
    const spark = `M${c[0]} ${c[1] - 14}L${c[0] + 3.5} ${c[1] - 3.5}L${
      c[0] + 14
    } ${c[1]}L${c[0] + 3.5} ${c[1] + 3.5}L${c[0]} ${c[1] + 14}L${c[0] - 3.5} ${
      c[1] + 3.5
    }L${c[0] - 14} ${c[1]}L${c[0] - 3.5} ${c[1] - 3.5}Z`;
    const nodes: Pt[] = [
      topPt(base, 0.08, 0.5),
      topPt(base, 0.5, 0.92),
      topPt(base, 0.92, 0.5),
      topPt(base, 0.5, 0.08),
    ];
    return (
      <>
        <Box b={base} dim color={col} />
        {/* traces from chip to the board edges */}
        <path
          d={`${lineD(topPt(base, 0.3, 0.5), nodes[0])}${lineD(
            topPt(base, 0.5, 0.7),
            nodes[1]
          )}${lineD(topPt(base, 0.7, 0.5), nodes[2])}${lineD(
            topPt(base, 0.5, 0.3),
            nodes[3]
          )}`}
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
          strokeLinecap="round"
        />
        {nodes.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="3"
            fill="none"
            stroke={`${col}45`}
          />
        ))}
        <Box b={chip} color={col} />
        <S d={topQuad(chip, 0.2, 0.8, 0.2, 0.8)} dim sw={0.9} color={col} />
        <S d={spark} sw={1.3} color={col} />
        {/* floating insight markers */}
        <S d="M270 64V88M258 76H282" dim color={col} />
        <S d="M60 90V110M50 100H70" dim color={col} />
        <circle
          cx="262"
          cy="120"
          r="5"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
        />
        <circle
          cx="78"
          cy="140"
          r="4"
          fill="none"
          stroke={`${col}45`}
          strokeWidth="1"
        />
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

/* ---------- Torn paper edge component ---------- */
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

/* ---------- Edit these ---------- */
const HERO_IMAGE = "/solutions-hero.jpg";

const stats: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}[] = [
  { value: 50, suffix: "+", label: "Facilities onboarded" },
  { value: solutions.length, label: "Connected solutions" },
  { value: 99.9, suffix: "%", decimals: 1, label: "Platform uptime" },
];

const fmtStat = formatStat;

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

const HeroImage = () => {
  const t = useT();
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <>
        {/* Mobile: Show only Pharmacy SVG illustration */}
        <div className="relative h-full w-full p-6 md:hidden bg-black">
          <Art name="pharmacy" />
        </div>
        {/* Desktop and up: Show image */}
        <div className="relative hidden md:block h-full w-full">
          <Image
            src={HERO_IMAGE}
            alt={productName}
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        </div>
      </>
    );
  }

  const tiles: ArtName[] = ["hospital", "emr", "pharmacy", "theatre"];

  return (
    <>
      <div className="relative h-full w-full p-6 md:hidden bg-black">
        <Art name="pharmacy" />
      </div>
      <div className="hidden md:grid h-full w-full grid-cols-4 gap-2 bg-black p-2">
        {tiles.map((art) => (
          <div
            key={art}
            className="relative overflow-hidden rounded-2xl border border-white/10 p-4 bg-transparent"
          >
            <Art name={art} />
          </div>
        ))}
      </div>
    </>
  );
};

export default function SolutionsPage() {
  const t = useT();
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1);
      setTimeout(() => {
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }

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

      gsap.utils.toArray<HTMLElement>("[data-stat]").forEach((el) => {
        const value = parseFloat(el.dataset.value || "0");
        const cfg = {
          decimals: parseInt(el.dataset.decimals || "0", 10),
          prefix: el.dataset.prefix || "",
          suffix: el.dataset.suffix || "",
        };
        el.textContent = fmtStat(0, cfg, locale);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: value,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => {
            el.textContent = fmtStat(obj.v, cfg, locale);
          },
        });
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
            <T>We build software</T>{" "}
            <span
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="mx-1 inline-flex h-9 w-9 items-center justify-center rounded-full align-middle md:h-12 md:w-12"
            >
              <Sparkle />
            </span>{" "}
            <T>that powers</T>{" "}
            <span
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="inline-block px-2 md:px-3"
            >
              <T>better care.</T>
            </span>
          </h1>

          <div className="flex flex-col items-start gap-5 md:pb-2">
            <p className="max-w-sm text-sm leading-relaxed text-white/60 md:text-base">
              <T>
                At {productName}, we help hospitals, clinics and HMOs run
                smarter with connected, reliable medical software that actually
                performs.
              </T>
            </p>
            <a
              href="#hospital-management"
              onClick={(e) => jump(e, "hospital-management")}
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
              <T>Browse our solutions</T>
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

      {/* ---------- Big image ---------- */}
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div
          data-image-wrap
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] bg-[#111] md:aspect-[16/7]"
        >
          <div data-image className="absolute inset-0 will-change-transform">
            <HeroImage />
          </div>
        </div>
      </div>

      {/* ---------- Vision + stats (Redesigned Balanced Layout with White Background & Torn Edges) ---------- */}
      <section className="relative w-full overflow-hidden bg-white py-16 text-black md:py-24 my-16">
        <RoughEdge position="top" />
        <RoughEdge position="bottom" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-12">
          <div data-vision className="grid items-center gap-12  lg:gap-20">
            {/* Left Column: Vision details, intro statement, tags, and stats */}
            <div className="flex flex-col justify-center">
              <span className="text-xs mb-4 font-semibold uppercase tracking-widest text-black/50">
                <T>/Our vision/</T>
              </span>

              {/* Main Statement */}
              <div data-vision className="max-w-4xl mb-16">
                <h2 className="text-3xl font-normal leading-[1.25] tracking-tight md:text-5xl text-black">
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
                  <T>
                    Whether it&apos;s a hospital, a clinic, or a full HMO
                    network, we build software that works.
                  </T>
                  <span className="text-black/40 ml-1">
                    <T>
                      Good software isn&apos;t just about features. It&apos;s
                      about solving real clinical problems and getting results.
                      Here&apos;s ours.
                    </T>
                  </span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- One section per solution ---------- */}
      {solutions.map((s, i) => {
        const flip = i % 2 === 1;
        // Every 3rd solution (3, 6, 9, 12) uses white background and torn paper edges
        const isWhiteSection = (i + 1) % 3 === 0;

        return (
          <section
            key={s.id}
            id={s.id}
            data-solution
            className={`relative scroll-mt-24 ${
              isWhiteSection ? "bg-white text-black py-24 md:py-36 my-12" : ""
            }`}
          >
            {isWhiteSection && <RoughEdge position="top" />}
            {isWhiteSection && <RoughEdge position="bottom" />}

            <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:gap-20 lg:px-12 relative z-10">
              {/* text */}
              <div data-text className={flip ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      isWhiteSection ? "text-black/40" : "text-white/40"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(solutions.length).padStart(2, "0")}
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

              {/* panel illustration */}
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
    </div>
  );
}
