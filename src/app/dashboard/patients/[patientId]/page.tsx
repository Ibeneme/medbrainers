"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  FileText,
  Heart,
  LineChart as LineChartIcon,
  Minus,
  Plus,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Trash2,
  Wind,
  X,
  History,
  Clock,
  UserCheck,
  ArrowRight,
  User,
  Phone,
  Mail,
  Fingerprint,
  Droplet,
  Cake,
  BadgeInfo,
  Search,
  Info,
  HelpCircle,
  Receipt,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchPatients,
  fetchPatient,
  fetchPatientFamily,
  addPatientAllergy,
  updatePatientAllergy,
  removePatientAllergy,
  addPatientVital,
  updatePatientVital,
  removePatientVital,
  addPatientHistory,
  addPatientFamily,
  linkFamily,
  removeFromFamilyGroup,
  fetchPatientConsultations as fetchConsultations,
  removeConsultation,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import {
  CustomDropdown,
  CustomSearchableMultiSelect,
  personLabel,
  UserAvatar,
} from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { ConfirmModal, ConfirmState, Modal } from "@/components/ui/items";

import { Can } from "@/components/access/can";
import { useAccess } from "@/hooks/useAccess";
/* -------------------------------------------------------------------------- */
/*  Design tokens                                                             */
/* -------------------------------------------------------------------------- */

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

type Metric = {
  key: string;
  label: string;
  unit: string;
  icon: any;
  color: string;
  domain: [number, number];
  normal: [number, number];
  decimals: number;
};

const METRICS: Metric[] = [
  {
    key: "temperatureC",
    label: "Temperature",
    unit: "°C",
    icon: Thermometer,
    color: "#f97316",
    domain: [34, 41],
    normal: [36.1, 37.5],
    decimals: 1,
  },
  {
    key: "spo2",
    label: "Blood Oxygen (SpO2)",
    unit: "%",
    icon: Wind,
    color: "#3b82f6",
    domain: [80, 100],
    normal: [95, 100],
    decimals: 0,
  },
  {
    key: "pulseBpm",
    label: "Pulse Rate",
    unit: " bpm",
    icon: Heart,
    color: "#ec4899",
    domain: [40, 140],
    normal: [60, 100],
    decimals: 0,
  },
  {
    key: "bpSystolic",
    label: "Systolic Pressure",
    unit: " mmHg",
    icon: Activity,
    color: "#10b981",
    domain: [70, 180],
    normal: [90, 120],
    decimals: 0,
  },
  {
    key: "bpDiastolic",
    label: "Diastolic Pressure",
    unit: " mmHg",
    icon: Activity,
    color: "#8b5cf6",
    domain: [40, 120],
    normal: [60, 80],
    decimals: 0,
  },
];

const SEVERITY_STYLE: Record<string, { color: string; label: string }> = {
  mild: { color: "#10b981", label: "Mild" },
  moderate: { color: "#f59e0b", label: "Moderate" },
  severe: { color: "#f97316", label: "Severe" },
  life_threatening: { color: "#ef4444", label: "Life-threatening" },
};

const fmt = (v: any, unit: string) => (v != null ? `${v}${unit}` : "—");

const rangeStatus = (m: Metric, v: number | null) => {
  if (v == null) return null;
  if (v < m.normal[0]) return { text: "Low", tone: "warn" as const };
  if (v > m.normal[1]) return { text: "High", tone: "warn" as const };
  return { text: "Good", tone: "ok" as const };
};

/* -------------------------------------------------------------------------- */
/*  Overview widgets & Insights helper                                        */
/* -------------------------------------------------------------------------- */

const getTrendInsight = (
  id: string,
  series: Series[],
  normal: [number, number]
) => {
  const pts = series[0]?.data.filter((v): v is number => v != null) || [];
  if (pts.length === 0) {
    return {
      text: "No sufficient data points to evaluate trend yet.",
      tone: "neutral" as const,
    };
  }

  const latest = pts[pts.length - 1];
  const prev = pts.length > 1 ? pts[pts.length - 2] : latest;
  const diff = Number((latest - prev).toFixed(1));

  if (id === "temperatureC") {
    if (latest > normal[1]) {
      return {
        text: `Latest reading (${latest}°C) is above normal range (${normal[0]}–${normal[1]}°C). Elevated temperature detected.`,
        tone: "warn" as const,
      };
    }
    if (latest < normal[0]) {
      return {
        text: `Latest reading (${latest}°C) is below normal range. Monitor for hypothermia.`,
        tone: "warn" as const,
      };
    }
    return {
      text: `Stable within normal thermal bounds (${normal[0]}–${
        normal[1]
      }°C). ${
        diff > 0
          ? `Slight rise (+${diff}°C)`
          : diff < 0
          ? `Slight dip (${diff}°C)`
          : "Consistent"
      } compared to previous reading.`,
      tone: "ok" as const,
    };
  }

  if (id === "spo2") {
    if (latest < 95) {
      return {
        text: `Low blood oxygen saturation (${latest}%) detected. Below recommended normal threshold (95%–100%).`,
        tone: "warn" as const,
      };
    }
    return {
      text: `Optimal oxygenation levels (${latest}%). Stable tissue perfusion across recorded intervals.`,
      tone: "ok" as const,
    };
  }

  if (id === "pulseBpm") {
    if (latest > 100) {
      return {
        text: `Elevated heart rate (${latest} bpm) - Tachycardia range (>100 bpm).`,
        tone: "warn" as const,
      };
    }
    if (latest < 60) {
      return {
        text: `Low heart rate (${latest} bpm) - Bradycardia range (<60 bpm).`,
        tone: "warn" as const,
      };
    }
    return {
      text: `Normal resting heart rate (${latest} bpm). Rhythm readings are within healthy parameters (60–100 bpm).`,
      tone: "ok" as const,
    };
  }

  if (id === "bp") {
    const sysPts = series[0]?.data.filter((v): v is number => v != null) || [];
    const diaPts = series[1]?.data.filter((v): v is number => v != null) || [];
    const lSys = sysPts[sysPts.length - 1] ?? 0;
    const lDia = diaPts[diaPts.length - 1] ?? 0;
    if (lSys > 140 || lDia > 90) {
      return {
        text: `Elevated blood pressure (${lSys}/${lDia} mmHg) indicating Stage 2 Hypertension range. Clinical review recommended.`,
        tone: "warn" as const,
      };
    }
    if (lSys > 120 || lDia > 80) {
      return {
        text: `Elevated blood pressure (${lSys}/${lDia} mmHg) in prehypertension range.`,
        tone: "warn" as const,
      };
    }
    return {
      text: `Blood pressure readings (${lSys}/${lDia} mmHg) remain well-balanced within optimal physiological ranges.`,
      tone: "ok" as const,
    };
  }

  return {
    text: "Readings remain consistent with baseline measurements.",
    tone: "neutral" as const,
  };
};

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  status,
  ui,
  children,
}: {
  icon: any;
  label: string;
  value: string;
  unit?: string;
  color: string;
  status?: { text: string; tone: "ok" | "warn" } | null;
  ui: UI;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[28px] p-5 space-y-4"
      style={{ backgroundColor: ui.card }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: ui.inner, color }}
          >
            <Icon size={18} />
          </span>
          <div>
            <p className="text-xs opacity-60">{label}</p>
            <p className="text-2xl font-medium leading-tight tracking-tight">
              {value}
              {unit && (
                <span className="ml-1 text-sm font-normal opacity-50">
                  {unit}
                </span>
              )}
            </p>
          </div>
        </div>
        {status && (
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{
              color: status.tone === "ok" ? "#059669" : "#d97706",
              backgroundColor:
                status.tone === "ok"
                  ? "rgba(16,185,129,0.16)"
                  : "rgba(245,158,11,0.18)",
            }}
          >
            {status.text}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Sparkline({
  id,
  values,
  color,
  unit,
}: {
  id: string;
  values: (number | null)[];
  color: string;
  unit: string;
}) {
  const pts = values.filter((v): v is number => v != null);
  const W = 300;
  const H = 92;
  const pad = 8;
  if (pts.length === 0) {
    return (
      <div className="flex h-[92px] items-center justify-center text-[11px] opacity-40">
        No readings yet
      </div>
    );
  }
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || Math.max(Math.abs(hi) * 0.1, 1);
  const min = lo - span * 0.3;
  const max = hi + span * 0.3;
  const y = (v: number) => 24 + (1 - (v - min) / (max - min)) * (H - 24 - 8);
  const n = pts.length;
  const coords: [number, number][] =
    n === 1
      ? [
          [pad, y(pts[0])],
          [W - pad, y(pts[0])],
        ]
      : pts.map((v, i) => [pad + (i * (W - 2 * pad)) / (n - 1), y(v)]);

  let d = `M${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = `${d} L${last[0]} ${H} L${first[0]} ${H} Z`;
  const gid = `spark-${id}`;
  const lastVal = pts[pts.length - 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={last[0]}
          cy={last[1]}
          r="4.5"
          fill="#fff"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
      <span
        className="absolute rounded-full px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap"
        style={{
          backgroundColor: color,
          left: `${(last[0] / W) * 100}%`,
          top: `${(last[1] / H) * 100}%`,
          transform: "translate(-100%, -150%)",
        }}
      >
        {lastVal}
        {unit.trim()}
      </span>
    </div>
  );
}

function TickBars({
  values,
  color,
  ui,
}: {
  values: (number | null)[];
  color: string;
  ui: UI;
}) {
  const N = 18;
  const vals = values.filter((v): v is number => v != null).slice(-N);
  if (vals.length === 0) {
    return (
      <div className="flex h-[92px] items-center justify-center text-[11px] opacity-40">
        No readings yet
      </div>
    );
  }
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const slots: (number | null)[] = [
    ...Array.from({ length: N - vals.length }, () => null),
    ...vals,
  ];
  return (
    <div className="flex h-[92px] items-end justify-between gap-1.5">
      {slots.map((v, i) => {
        const isLast = i === slots.length - 1;
        const h = v == null ? 22 : 34 + ((v - lo) / (hi - lo || 1)) * 66;
        if (isLast) {
          return (
            <div
              key={i}
              className="flex h-full items-end justify-center rounded-full px-1.5"
              style={{ backgroundColor: `${color}22` }}
            >
              <div
                className="w-[3px] rounded-full"
                style={{ height: `${h}%`, backgroundColor: color }}
              />
            </div>
          );
        }
        return (
          <div
            key={i}
            className="w-0 border-l-2 border-dashed"
            style={{
              height: `${h}%`,
              borderColor: v == null ? ui.border : `${color}66`,
              opacity: v == null ? 0.6 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

type Series = { name: string; color: string; data: (number | null)[] };

function TrendChart({
  id,
  labels,
  fullLabels,
  series,
  domain,
  bands,
  mode,
  alerts,
  unit,
  grid,
}: {
  id: string;
  labels: string[];
  fullLabels: string[];
  series: Series[];
  domain: [number, number];
  bands?: [number, number][];
  mode: "line" | "bar";
  alerts: boolean[];
  unit: string;
  grid: string;
}) {
  const W = 440;
  const H = 190;
  const pL = 40;
  const pR = 12;
  const pT = 14;
  const pB = 28;
  const iw = W - pL - pR;
  const ih = H - pT - pB;
  const [min, max] = domain;
  const n = labels.length;
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const y = (v: number) => pT + ih * (1 - (clamp(v) - min) / (max - min));
  const slot = iw / Math.max(n, 1);
  const xLine = (i: number) =>
    n === 1 ? pL + iw / 2 : pL + (i * iw) / (n - 1);
  const xBar = (i: number) => pL + slot * (i + 0.5);
  const ticks = [0, 1, 2, 3, 4].map((t) => min + ((max - min) * t) / 4);
  const step = Math.ceil(n / 6);
  const gid = `grad-${id}`;

  const pathOf = (data: (number | null)[]) => {
    let d = "";
    let prev: [number, number] | null = null;
    data.forEach((v, i) => {
      if (v == null) {
        prev = null;
        return;
      }
      const p: [number, number] = [xLine(i), y(v)];
      if (!prev) d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
      else {
        const mx = (prev[0] + p[0]) / 2;
        d += `C${mx.toFixed(1)} ${prev[1].toFixed(1)} ${mx.toFixed(
          1
        )} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
      }
      prev = p;
    });
    return d;
  };

  const single = series.length === 1;
  const barW = Math.min(26, (slot * 0.72) / series.length);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Vitals chart"
    >
      {single && (
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={series[0].color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={series[0].color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      {(bands || []).map(([lo, hi], bi) => (
        <g key={bi}>
          <rect
            x={pL}
            y={y(hi)}
            width={iw}
            height={Math.max(y(lo) - y(hi), 1)}
            rx="6"
            fill="#10b981"
            opacity="0.1"
          />
          {bi === 0 && (
            <text
              x={W - pR - 6}
              y={y(hi) + 11}
              textAnchor="end"
              fontSize="8"
              fill="#10b981"
            >
              Normal
            </text>
          )}
        </g>
      ))}

      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={pL}
            x2={W - pR}
            y1={y(t)}
            y2={y(t)}
            stroke={grid}
            strokeDasharray="3 5"
          />
          <text
            x={pL - 6}
            y={y(t) + 3}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            opacity="0.5"
          >
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}

      {labels.map((l, i) =>
        i % step === 0 || i === n - 1 ? (
          <text
            key={i}
            x={mode === "bar" ? xBar(i) : xLine(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            opacity="0.5"
          >
            {l}
          </text>
        ) : null
      )}

      {mode === "line" &&
        series.map((s, si) => {
          const allPresent = s.data.every((v) => v != null) && n > 1;
          return (
            <g key={si}>
              {single && allPresent && (
                <path
                  d={`${pathOf(s.data)} L${xLine(n - 1)} ${y(min)} L${xLine(
                    0
                  )} ${y(min)} Z`}
                  fill={`url(#${gid})`}
                />
              )}
              <path
                d={pathOf(s.data)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.data.map((v, i) =>
                v == null ? null : (
                  <circle
                    key={i}
                    cx={xLine(i)}
                    cy={y(v)}
                    r={alerts[i] ? 4.5 : 3.5}
                    fill={alerts[i] ? "#ef4444" : "#fff"}
                    stroke={alerts[i] ? "#ef4444" : s.color}
                    strokeWidth="2"
                  >
                    <title>{`${fullLabels[i]}\n${s.name}: ${v}${unit}`}</title>
                  </circle>
                )
              )}
            </g>
          );
        })}

      {mode === "bar" &&
        series.map((s, si) =>
          s.data.map((v, i) => {
            if (v == null) return null;
            const x =
              xBar(i) -
              (series.length * barW) / 2 +
              si * barW +
              (single ? 0 : 1);
            const top = y(v);
            const base = y(min);
            const w = Math.max(barW - (single ? 0 : 2), 2);
            return (
              <g key={`${si}-${i}`}>
                <rect
                  x={x}
                  y={top}
                  width={w}
                  height={Math.max(base - top, 2)}
                  rx={Math.min(8, w / 2)}
                  fill={single && alerts[i] ? "#ef4444" : s.color}
                  opacity={single && alerts[i] ? 1 : 0.9}
                >
                  <title>{`${fullLabels[i]}\n${s.name}: ${v}${unit}`}</title>
                </rect>
                {n <= 8 && (
                  <text
                    x={x + w / 2}
                    y={top - 4}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="currentColor"
                    opacity="0.65"
                  >
                    {v}
                  </text>
                )}
              </g>
            );
          })
        )}
    </svg>
  );
}

function RangeGauge({
  metric,
  latest,
  previous,
  ui,
  large = false,
}: {
  metric: Metric;
  latest: number | null;
  previous: number | null;
  ui: UI;
  large?: boolean;
}) {
  const [min, max] = metric.domain;
  const [lo, hi] = metric.normal;
  const pct = (v: number) =>
    `${Math.min(Math.max((v - min) / (max - min), 0), 1) * 100}%`;
  return (
    <div
      className={`relative rounded-full ${large ? "h-4" : "h-3"}`}
      style={{ backgroundColor: ui.inner }}
    >
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: pct(lo),
          width: `${((hi - lo) / (max - min)) * 100}%`,
          background: "linear-gradient(90deg,#fde68a,#34d399)",
        }}
      />
      {previous != null && (
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            left: pct(previous),
            borderColor: metric.color,
            backgroundColor: ui.card,
            opacity: 0.8,
          }}
          title={`Previous: ${previous}${metric.unit}`}
        />
      )}
      {latest != null && (
        <span
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]"
          style={{
            left: pct(latest),
            backgroundColor: metric.color,
            borderColor: ui.card,
          }}
          title={`Latest: ${latest}${metric.unit}`}
        />
      )}
    </div>
  );
}

function MetricSnapshot({
  metric,
  latest,
  previous,
  ui,
}: {
  metric: Metric;
  latest: number | null;
  previous: number | null;
  ui: UI;
}) {
  const [lo, hi] = metric.normal;
  const delta =
    latest != null && previous != null
      ? Number((latest - previous).toFixed(metric.decimals))
      : null;
  return (
    <StatCard
      icon={metric.icon}
      label={metric.label}
      value={latest != null ? String(latest) : "—"}
      unit={metric.unit.trim()}
      color={metric.color}
      status={rangeStatus(metric, latest)}
      ui={ui}
    >
      <div className="space-y-2.5">
        {delta != null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: ui.inner }}
          >
            {delta > 0 ? (
              <ArrowUp size={12} />
            ) : delta < 0 ? (
              <ArrowDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            {Math.abs(delta)} vs previous
          </span>
        )}
        <RangeGauge
          metric={metric}
          latest={latest}
          previous={previous}
          ui={ui}
        />
        <div className="flex justify-between text-[10px] opacity-50">
          <span>
            {metric.domain[0]}
            {metric.unit.trim()}
          </span>
          <span>
            Normal {lo}–{hi}
            {metric.unit.trim()}
          </span>
          <span>
            {metric.domain[1]}
            {metric.unit.trim()}
          </span>
        </div>
      </div>
    </StatCard>
  );
}

function AllergyCard({
  a,
  canManage,
  onEdit,
  onDelete,
  bg,
}: {
  a: any;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  bg: string;
}) {
  const sev =
    SEVERITY_STYLE[a.severity || "moderate"] || SEVERITY_STYLE.moderate;
  return (
    <div
      className="rounded-2xl p-4 flex items-start justify-between gap-3"
      style={{ backgroundColor: bg }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${sev.color}1f`, color: sev.color }}
        >
          <ShieldAlert size={18} />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{a.substance}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ color: sev.color, backgroundColor: `${sev.color}1f` }}
            >
              {sev.label}
            </span>
          </div>
          {a.reaction && (
            <p className="text-xs opacity-65">Reaction: {a.reaction}</p>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          <Can perm="patients.write"><button
            type="button"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition outline-none focus:outline-none"
            title="Edit allergy"
            aria-label="Edit allergy"
          >
            <Edit3 size={15} />
          </button></Can>
          <Can perm="patients.write"><button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition outline-none focus:outline-none"
            title="Remove allergy"
            aria-label="Remove allergy"
          >
            <Trash2 size={15} />
          </button></Can>
        </div>
      )}
    </div>
  );
}

function VitalTile({
  label,
  value,
  icon: Icon,
  color,
  ui,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  ui: UI;
}) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: ui.inner }}>
      <span
        className="flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color }}
      >
        <Icon size={13} /> {label}
      </span>
      <span className="mt-1.5 block text-base font-medium tracking-tight">
        {value}
      </span>
    </div>
  );
}

function PillButton({
  onClick,
  children,
  disabled,
  type = "button",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none"
      style={{ backgroundColor: PRIMARY_COLOR }}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = String(params.patientId || "");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const {
    list,
    current,
    familyView: familyOf,
    detailLoading,
    consultationsMeta,
  } = useAppSelector((s) => s.patients);

  const currentUser = useAppSelector((s: any) => s.auth?.user);

  // permission-based (was: guessed from the role name)
  const canManageAllergies = useAccess().can("patients.write");

  const [tab, setTab] = useState<
    | "overview"
    | "consultations"
    | "chart"
    | "vitals"
    | "allergies"
    | "family"
    | "audit"
  >("overview");
  const [chartView, setChartView] = useState<"line" | "bar">("line");
  const [chartRange, setChartRange] = useState<6 | 12 | 24>(12);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Per-tab search states
  const [consultationsSearch, setConsultationsSearch] = useState("");
  const [vitalsSearch, setVitalsSearch] = useState("");
  const [allergiesSearch, setAllergiesSearch] = useState("");
  const [familySearch, setFamilySearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Consultation Drafts state
  const [drafts, setDrafts] = useState<
    Array<{ id: string; title: string; updatedAt: string; data: any }>
  >([]);
  const STORAGE_KEY = `consultation_drafts_${patientId}`;

  useEffect(() => {
    const savedDrafts = localStorage.getItem(STORAGE_KEY);
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error("Failed to parse consultation drafts", e);
      }
    }
  }, [STORAGE_KEY]);

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = drafts.filter((d) => d.id !== id);
    setDrafts(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  };

  // Consultation Pagination state
  const [conPage, setConPage] = useState(1);
  const conLimit = 10;

  // Confirmation modal
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirming, setConfirming] = useState(false);

  // Modals state
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null);
  const [vitalModalOpen, setVitalModalOpen] = useState(false);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Allergy form
  const [substance, setSubstance] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [reaction, setReaction] = useState("");

  // Vital form
  const [temperature, setTemperature] = useState("");
  const [bloodOxygenSaturation, setBloodOxygenSaturation] = useState("");
  const [pulseRate, setPulseRate] = useState("");
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState("");
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState("");

  // Chart
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDetail, setNoteDetail] = useState("");

  // Family contact
  const [famName, setFamName] = useState("");
  const [famRel, setFamRel] = useState("");
  const [famPhone, setFamPhone] = useState("");
  const [famLinkIds, setFamLinkIds] = useState<string[]>([]);
  const [familyName, setFamilyName] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId || !patientId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchPatient({ facilityId: activeFacilityId, patientId }));
    dispatch(fetchPatientFamily({ facilityId: activeFacilityId, patientId }));
  }, [dispatch, activeFacilityId, patientId]);

  // Fetch consultations whenever page changes
  useEffect(() => {
    if (!activeFacilityId || !patientId) return;
    dispatch(
      fetchConsultations({
        facilityId: activeFacilityId,
        patientId,
        page: conPage,
        limit: conLimit,
      })
    );
  }, [dispatch, activeFacilityId, patientId, conPage]);

  const vitalAlerts = useMemo(() => {
    return (current?.vitals || []).filter((v) => v.alert);
  }, [current]);

  const otherPatients = useMemo(
    () => list.filter((p) => p._id !== patientId),
    [list, patientId]
  );

  // Sorted latest-first for vitals: Newest/Last Day comes first
  const validVitals = useMemo(() => {
    return (current?.vitals || [])
      .filter((v) => v.recordedAt)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.recordedAt as any).getTime() -
          new Date(a.recordedAt as any).getTime()
      );
  }, [current]);

  const sparkVitals = useMemo(() => validVitals.slice(-14), [validVitals]);
  const chartVitals = useMemo(
    () => validVitals.slice(-chartRange),
    [validVitals, chartRange]
  );
  const chartLabels = useMemo(
    () =>
      chartVitals.map((v) =>
        new Date(v.recordedAt as any).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      ),
    [chartVitals]
  );
  const chartFullLabels = useMemo(
    () =>
      chartVitals.map((v) => new Date(v.recordedAt as any).toLocaleString()),
    [chartVitals]
  );
  const chartAlerts = useMemo(
    () => chartVitals.map((v) => !!v.alert),
    [chartVitals]
  );

  // Sorted and filtered activity audit logs (Latest first) with search filter support
  const auditLogs = useMemo(() => {
    if (!current?.activityLogs) return [];
    const sorted = [...current.activityLogs].sort((a: any, b: any) => {
      const timeA = new Date(a.at || 0).getTime();
      const timeB = new Date(b.at || 0).getTime();
      return timeB - timeA;
    });

    if (!auditSearch.trim()) return sorted;
    const q = auditSearch.toLowerCase();
    return sorted.filter((log: any) => {
      const action = String(log.action || "").toLowerCase();
      const detail = String(
        log.detail || log.details || log.description || ""
      ).toLowerCase();
      const author = (
        typeof log.by === "object" && log.by !== null
          ? `${log.by.firstName || ""} ${log.by.lastName || ""}`.trim() ||
            log.by.email
          : "System User"
      ).toLowerCase();
      const dateStr = log.at
        ? new Date(log.at).toLocaleString().toLowerCase()
        : "";
      return (
        action.includes(q) ||
        detail.includes(q) ||
        author.includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [current?.activityLogs, auditSearch]);

  // Sorted latest-first for consultations: Newest/Last Day comes first
  const filteredConsultations = useMemo(() => {
    const list = (current?.consultations || [])
      .slice()
      .sort((a: any, b: any) => {
        const timeA = new Date(a.consultedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.consultedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    if (!consultationsSearch.trim()) return list;
    const q = consultationsSearch.toLowerCase();
    return list.filter((c: any) => {
      const title = String(c.title || "").toLowerCase();
      const complaint = String(c.complaint || "").toLowerCase();
      const diagnosis = String(c.diagnosis || "").toLowerCase();
      const summary = String(c.summary || "").toLowerCase();
      const doctor = c.doctor
        ? `${c.doctor.firstName || ""} ${c.doctor.lastName || ""}`.toLowerCase()
        : "";
      return (
        title.includes(q) ||
        complaint.includes(q) ||
        diagnosis.includes(q) ||
        summary.includes(q) ||
        doctor.includes(q)
      );
    });
  }, [current?.consultations, consultationsSearch]);

  // Sorted latest-first for vitals table/list
  const filteredVitalsList = useMemo(() => {
    const list = validVitals;
    if (!vitalsSearch.trim()) return list;
    const q = vitalsSearch.toLowerCase();
    return list.filter((v: any) => {
      const reason = String(v.alertReason || "").toLowerCase();
      const dateStr = v.recordedAt
        ? new Date(v.recordedAt).toLocaleString().toLowerCase()
        : "";
      const temp = String(v.temperatureC ?? "").toLowerCase();
      const spo2 = String(v.spo2 ?? "").toLowerCase();
      const pulse = String(v.pulseBpm ?? "").toLowerCase();
      const bp = `${v.bpSystolic ?? ""}/${v.bpDiastolic ?? ""}`.toLowerCase();
      return (
        reason.includes(q) ||
        dateStr.includes(q) ||
        temp.includes(q) ||
        spo2.includes(q) ||
        pulse.includes(q) ||
        bp.includes(q)
      );
    });
  }, [validVitals, vitalsSearch]);

  const filteredAllergies = useMemo(() => {
    const list = current?.allergies || [];
    if (!allergiesSearch.trim()) return list;
    const q = allergiesSearch.toLowerCase();
    return list.filter((a: any) => {
      const substance = String(a.substance || "").toLowerCase();
      const severity = String(a.severity || "").toLowerCase();
      const reaction = String(a.reaction || "").toLowerCase();
      return (
        substance.includes(q) || severity.includes(q) || reaction.includes(q)
      );
    });
  }, [current?.allergies, allergiesSearch]);

  const contacts = (familyOf as any)?.contacts || current?.family || [];
  const filteredContacts = useMemo(() => {
    const list = contacts as any[];
    if (!familySearch.trim()) return list;
    const q = familySearch.toLowerCase();
    return list.filter((c: any) => {
      const name = String(c.name || "").toLowerCase();
      const rel = String(c.relationship || "").toLowerCase();
      const phone = String(c.phone || "").toLowerCase();
      return name.includes(q) || rel.includes(q) || phone.includes(q);
    });
  }, [contacts, familySearch]);

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  const notify = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 3000);
  };

  const reload = () => {
    if (!activeFacilityId) return;
    dispatch(fetchPatient({ facilityId: activeFacilityId, patientId }));
    dispatch(fetchPatientFamily({ facilityId: activeFacilityId, patientId }));
    dispatch(
      fetchConsultations({
        facilityId: activeFacilityId,
        patientId,
        page: conPage,
        limit: conLimit,
      })
    );
  };

  if (!activeFacilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const facilityId = activeFacilityId;

  const askConfirm = (c: NonNullable<ConfirmState>) => setConfirm(c);

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirming(true);
    try {
      await confirm.onConfirm();
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  };

  const errText = (e: unknown, fallback: string) =>
    typeof e === "string" ? e : fallback;

  const resetAllergyForm = () => {
    setEditingAllergyId(null);
    setSubstance("");
    setSeverity("moderate");
    setReaction("");
  };

  const openAddAllergy = () => {
    resetAllergyForm();
    setAllergyModalOpen(true);
  };

  const openEditAllergy = (a: any) => {
    setEditingAllergyId(a._id);
    setSubstance(a.substance || "");
    setSeverity(a.severity || "moderate");
    setReaction(a.reaction || "");
    setAllergyModalOpen(true);
  };

  const closeAllergyModal = () => {
    setAllergyModalOpen(false);
    resetAllergyForm();
  };

  const resetVitalForm = () => {
    setEditingVitalId(null);
    setTemperature("");
    setBloodOxygenSaturation("");
    setPulseRate("");
    setBloodPressureSystolic("");
    setBloodPressureDiastolic("");
  };

  const openAddVital = () => {
    resetVitalForm();
    setVitalModalOpen(true);
  };

  const openEditVital = (v: any) => {
    setEditingVitalId(v._id);
    setTemperature(v.temperatureC != null ? String(v.temperatureC) : "");
    setBloodOxygenSaturation(v.spo2 != null ? String(v.spo2) : "");
    setPulseRate(v.pulseBpm != null ? String(v.pulseBpm) : "");
    setBloodPressureSystolic(v.bpSystolic != null ? String(v.bpSystolic) : "");
    setBloodPressureDiastolic(
      v.bpDiastolic != null ? String(v.bpDiastolic) : ""
    );
    setVitalModalOpen(true);
  };

  const closeVitalModal = () => {
    setVitalModalOpen(false);
    resetVitalForm();
  };

  const group = (familyOf as any)?.familyGroup;

  const confirmRemoveAllergy = (a: any) =>
    askConfirm({
      title: "Remove allergy?",
      message: `"${a.substance}" will be permanently removed from this patient's record.`,
      confirmLabel: "Remove allergy",
      tone: "danger",
      onConfirm: async () => {
        try {
          await dispatch(
            removePatientAllergy({
              facilityId,
              patientId,
              allergyId: a._id,
            })
          ).unwrap();
          notify("Allergy removed");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed to remove"), true);
        }
      },
    });

  const confirmRemoveVital = (v: any) =>
    askConfirm({
      title: "Remove vital record?",
      message: `The vitals recorded on ${
        v.recordedAt ? new Date(v.recordedAt).toLocaleString() : "this date"
      } will be permanently deleted.`,
      confirmLabel: "Remove record",
      tone: "danger",
      onConfirm: async () => {
        try {
          await dispatch(
            removePatientVital({ facilityId, patientId, vitalId: v._id })
          ).unwrap();
          notify("Vital record removed");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed to remove"), true);
        }
      },
    });

  const confirmRemoveConsultation = (c: any) =>
    askConfirm({
      title: "Delete consultation?",
      message: `The consultation session "${c.title}" will be permanently deleted.`,
      confirmLabel: "Delete session",
      tone: "danger",
      onConfirm: async () => {
        try {
          await dispatch(
            removeConsultation({
              facilityId,
              patientId,
              consultationId: c._id,
            })
          ).unwrap();
          notify("Consultation removed");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed to remove"), true);
        }
      },
    });

  const confirmRemoveFromGroup = () =>
    askConfirm({
      title: "Remove from family group?",
      message: `${
        current?.firstName || "This patient"
      } will no longer be linked to ${group?.name || "this family group"}.`,
      confirmLabel: "Remove from group",
      tone: "danger",
      onConfirm: async () => {
        try {
          await dispatch(
            removeFromFamilyGroup({ facilityId, patientId })
          ).unwrap();
          notify("Removed from family group");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed to remove"), true);
        }
      },
    });

  const submitAllergy = () => {
    const editing = !!editingAllergyId;
    askConfirm({
      title: editing ? "Update allergy?" : "Save allergy?",
      message: editing
        ? `Save your changes to the "${substance}" allergy record?`
        : `Add "${substance}" to this patient's allergies?`,
      confirmLabel: editing ? "Update allergy" : "Save allergy",
      tone: "primary",
      onConfirm: async () => {
        try {
          const payload = {
            substance,
            severity,
            reaction: reaction || undefined,
          };
          if (editingAllergyId) {
            await dispatch(
              updatePatientAllergy({
                facilityId,
                patientId,
                allergyId: editingAllergyId,
                payload,
              })
            ).unwrap();
            notify("Allergy updated");
          } else {
            await dispatch(
              addPatientAllergy({ facilityId, patientId, payload })
            ).unwrap();
            notify("Allergy recorded");
          }
          closeAllergyModal();
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed"), true);
        }
      },
    });
  };

  const submitVital = () => {
    const editing = !!editingVitalId;
    const payload: Record<string, number> = {};
    if (temperature) payload.temperatureC = Number(temperature);
    if (bloodOxygenSaturation) payload.spo2 = Number(bloodOxygenSaturation);
    if (pulseRate) payload.pulseBpm = Number(pulseRate);
    if (bloodPressureSystolic)
      payload.bpSystolic = Number(bloodPressureSystolic);
    if (bloodPressureDiastolic)
      payload.bpDiastolic = Number(bloodPressureDiastolic);
    askConfirm({
      title: editing ? "Update vitals?" : "Record vitals?",
      message: editing
        ? "Save your changes to this vital record?"
        : "Add these readings to the patient's record?",
      confirmLabel: editing ? "Update vitals" : "Record vitals",
      tone: "primary",
      onConfirm: async () => {
        try {
          if (editingVitalId) {
            const res: any = await dispatch(
              updatePatientVital({
                facilityId,
                patientId,
                vitalId: editingVitalId,
                payload,
              })
            ).unwrap();
            notify(res?.message || "Vital updated");
          } else {
            const res: any = await dispatch(
              addPatientVital({ facilityId, patientId, payload })
            ).unwrap();
            notify(res?.message || "Vital recorded");
          }
          closeVitalModal();
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed"), true);
        }
      },
    });
  };

  const submitLinkFamily = () =>
    askConfirm({
      title: "Group as family?",
      message: `Link ${famLinkIds.length} selected patient${
        famLinkIds.length > 1 ? "s" : ""
      } with ${current?.firstName || "this patient"} as one family group?`,
      confirmLabel: "Group as family",
      tone: "primary",
      onConfirm: async () => {
        try {
          await dispatch(
            linkFamily({
              facilityId,
              payload: {
                patientIds: [patientId, ...famLinkIds],
                name: familyName || undefined,
                headPatientId: patientId,
              },
            })
          ).unwrap();
          setFamLinkIds([]);
          setFamilyModalOpen(false);
          notify("Family grouped");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Link failed"), true);
        }
      },
    });

  const submitContact = () =>
    askConfirm({
      title: "Save emergency contact?",
      message: `Add ${famName} (${famRel}) as an emergency contact for this patient?`,
      confirmLabel: "Save contact",
      tone: "primary",
      onConfirm: async () => {
        try {
          await dispatch(
            addPatientFamily({
              facilityId,
              patientId,
              payload: {
                name: famName,
                relationship: famRel,
                phone: famPhone || undefined,
                isEmergencyContact: true,
                patientRef: famLinkIds[0],
              },
            })
          ).unwrap();
          setFamName("");
          setFamRel("");
          setFamPhone("");
          setFamilyModalOpen(false);
          notify("Family contact added");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed"), true);
        }
      },
    });

  const submitNote = () =>
    askConfirm({
      title: "Add chart note?",
      message: `"${noteTitle}" will be added to this patient's chart.`,
      confirmLabel: "Add note",
      tone: "primary",
      onConfirm: async () => {
        try {
          await dispatch(
            addPatientHistory({
              facilityId,
              patientId,
              payload: { title: noteTitle, detail: noteDetail, type: "note" },
            })
          ).unwrap();
          setNoteTitle("");
          setNoteDetail("");
          setChartModalOpen(false);
          notify("Chart entry added");
          reload();
        } catch (e: unknown) {
          notify(errText(e, "Failed"), true);
        }
      },
    });

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "consultations" as const, label: "Consultations" },
    { id: "chart" as const, label: "Chart & trends" },
    { id: "vitals" as const, label: "Vitals & alerts" },
    // { id: "allergies" as const, label: "Allergies" },
    { id: "family" as const, label: "Family" },
    { id: "audit" as const, label: "Audit Trail" },
  ];

  const titles: Record<typeof tab, string> = {
    overview: "Health overview",
    consultations: "Consultation days",
    chart: "Trends & comparisons",
    vitals: "Vitals & alerts",
    allergies: "Allergies",
    family: "Family & contacts",
    audit: "Patient Audit Trail & Activity Logs",
  };

  const tabAction =
    tab === "overview" || tab === "vitals"
      ? { label: "Record vitals", onClick: openAddVital }
      // : tab === "allergies" && canManageAllergies
      // ? { label: "Add allergy", onClick: openAddAllergy }
      // : tab === "consultations"
      // ? {
      //     label: "New consultation",
      //     onClick: () =>
      //       router.push(`/dashboard/patients/${patientId}/consultations/new`),
      //   }
      : tab === "family"
      ? { label: "Manage family", onClick: () => setFamilyModalOpen(true) }
      : tab === "chart"
      ? { label: "Add chart note", onClick: () => setChartModalOpen(true) }
      : null;

  const latestVital: any = validVitals[0];

  const sparkSeries = (key: string): (number | null)[] =>
    sparkVitals.map((v) => {
      const x = (v as any)[key];
      return x != null ? Number(x) : null;
    });

  const seriesOf = (key: string): (number | null)[] =>
    chartVitals.map((v) => {
      const x = (v as any)[key];
      return x != null ? Number(x) : null;
    });

  const latestPrev = (key: string) => {
    const vals = validVitals
      .map((v) => (v as any)[key])
      .filter((x) => x != null)
      .map(Number);
    return {
      latest: vals.length ? vals[0] : null,
      previous: vals.length > 1 ? vals[1] : null,
    };
  };

  const byKey = (k: string) => METRICS.find((m) => m.key === k)!;

  const trendCards = [
    ...(["temperatureC", "spo2", "pulseBpm"] as const).map((k) => {
      const m = byKey(k);
      const { latest } = latestPrev(k);
      const seriesData = [{ name: m.label, color: m.color, data: seriesOf(k) }];
      return {
        id: k,
        title: `${m.label} trend`,
        icon: m.icon,
        color: m.color,
        unit: m.unit,
        domain: m.domain,
        bands: [m.normal],
        series: seriesData,
        latestText: `Latest ${fmt(latest, m.unit)}`,
        insight: getTrendInsight(k, seriesData, m.normal),
      };
    }),
    (() => {
      const s = byKey("bpSystolic");
      const d = byKey("bpDiastolic");
      const ls = latestPrev("bpSystolic").latest;
      const ld = latestPrev("bpDiastolic").latest;
      const bpSeries = [
        { name: "Systolic", color: s.color, data: seriesOf("bpSystolic") },
        { name: "Diastolic", color: d.color, data: seriesOf("bpDiastolic") },
      ];
      return {
        id: "bp",
        title: "Blood pressure trend",
        icon: Activity,
        color: s.color,
        unit: " mmHg",
        domain: [40, 180] as [number, number],
        bands: [d.normal, s.normal],
        series: bpSeries,
        latestText: `Latest ${ls ?? "—"}/${ld ?? "—"} mmHg`,
        insight: getTrendInsight("bp", bpSeries, s.normal),
      };
    })(),
  ];

  const pulse = latestPrev("pulseBpm");
  const sys = latestPrev("bpSystolic");
  const dia = latestPrev("bpDiastolic");

  const pillTab = (active: boolean) => ({
    backgroundColor: active ? PRIMARY_COLOR : ui.card,
    color: active ? "#fff" : ui.text,
  });

  const renderFormattedDetail = (detailText: string) => {
    if (!detailText) return null;

    if (detailText.includes("Changes: [") && detailText.includes("]")) {
      const introPart = detailText.split("Changes: [")[0];
      const changesBlock = detailText.split("Changes: [")[1]?.replace("]", "");
      const rawChanges = changesBlock
        ? changesBlock.split(/,\s*(?=[a-zA-Z]+:\s*")/g)
        : [];

      return (
        <div className="space-y-2">
          <p className="font-medium opacity-90">{introPart}</p>
          <div
            className="mt-2 space-y-1.5 pl-2 border-l-2"
            style={{ borderColor: PRIMARY_COLOR }}
          >
            <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider block mb-1">
              Modified Fields:
            </span>
            {rawChanges.map((changeStr, idx) => {
              const parts = changeStr.split(/:\s*/);
              const fieldName = parts[0]?.trim();
              const transitionPart = parts.slice(1).join(": ");
              const values = transitionPart.split(" → ");
              const oldValue = values[0]?.trim();
              const newValue = values[1]?.trim();

              return (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-1.5 text-[12px]"
                >
                  <span
                    className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
                  >
                    {fieldName}
                  </span>
                  <span
                    className="line-through opacity-50 px-1 py-0.5 rounded"
                    style={{ backgroundColor: ui.inner }}
                  >
                    {oldValue || "—"}
                  </span>
                  <ArrowRight size={12} className="opacity-60 shrink-0" />
                  <span
                    className="font-semibold px-1 py-0.5 rounded"
                    style={{ backgroundColor: ui.inner, color: ui.text }}
                  >
                    {newValue || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <span>
        {detailText.split(/(".*?")/).map((segment, idx) => {
          if (segment.startsWith('"') && segment.endsWith('"')) {
            return (
              <strong
                key={idx}
                className="font-semibold"
                style={{ color: ui.text }}
              >
                {segment}
              </strong>
            );
          }
          return <span key={idx}>{segment}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] sm:p-4 space-y-5"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {detailLoading && !current && (
          <DarkBlurOverlayLoader text="Loading patient details..." />
        )}

        {(msg || err) && (
          <div
            className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              zIndex: 80,
              backgroundColor: ui.card,
              color: err ? "#ef4444" : "#059669",
            }}
            role="status"
          >
            {msg || err}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard/patients"
              className="opacity-60 hover:opacity-100"
            >
              Patients
            </Link>
            <ChevronRight size={12} className="opacity-40" />
            <span className="font-semibold">
              {current ? `${current.firstName} ${current.lastName}` : "Patient"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* opens a new bill already linked to this patient; hidden unless the role may use the POS (billing.write) */}
            <Can path="/dashboard/billing/pos"><button
              type="button"
              onClick={() =>
                router.push(`/dashboard/billing/pos?patientId=${encodeURIComponent(patientId)}`)
              }
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition hover:opacity-90 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card }}
            >
              <Receipt size={13} /> Bill Patient
            </button></Can>
            <Can path={`/dashboard/patients/${patientId}/edit`}><button
              type="button"
              onClick={() =>
                router.push(`/dashboard/patients/${patientId}/edit`)
              }
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 outline-none focus:outline-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Edit3 size={13} /> Edit Patient
            </button></Can>
            <span
              className="rounded-full px-3 py-1.5 text-[11px] font-medium"
              style={{ backgroundColor: ui.card }}
            >
              {activeFacility?.name}
            </span>
          </div>
        </div>

        {!current ? (
          <div className="py-16 text-center text-sm opacity-60">
            Patient not found
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div
              className="rounded-[28px] p-5 flex flex-wrap items-center gap-5"
              style={{ backgroundColor: ui.card }}
            >
              <UserAvatar user={current} size="md" />
              <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 min-w-[240px]">
                {[
                  {
                    k: "Name",
                    v: `${current.firstName} ${current.lastName}`,
                  },
                  { k: "MRN", v: current.mrn },
                  {
                    k: "Date of birth",
                    v: current.dateOfBirth
                      ? new Date(current.dateOfBirth).toLocaleDateString()
                      : "—",
                  },
                  { k: "Sex", v: current.gender || "—" },
                  {
                    k: "Contact",
                    v:
                      [current.countryCode, current.phone]
                        .filter(Boolean)
                        .join(" ") ||
                      current.email ||
                      "No contact",
                  },
                ].map((f) => (
                  <div key={f.k} className="min-w-0">
                    <p className="text-[11px] opacity-50">{f.k}</p>
                    <p className="truncate text-sm font-medium capitalize">
                      {f.v}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {vitalAlerts.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500">
                    <AlertTriangle size={12} /> {vitalAlerts.length} vital alert
                    {vitalAlerts.length > 1 ? "s" : ""}
                  </span>
                )}
                {(current.allergies || []).length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-600">
                    <ShieldAlert size={12} /> {(current.allergies || []).length}{" "}
                    allerg
                    {(current.allergies || []).length > 1 ? "ies" : "y"}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold transition outline-none focus:outline-none"
                  style={pillTab(tab === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Title row */}
            <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                {titles[tab]}
              </h1>
              {tabAction && (
                <PillButton onClick={tabAction.onClick}>
                  <Plus size={14} /> {tabAction.label}
                </PillButton>
              )}
            </div>

            {/* ------------------------------ OVERVIEW ------------------------------ */}
            {tab === "overview" && (
              <div className="space-y-4">
                <div
                  className="rounded-[28px] p-6 space-y-4"
                  style={{ backgroundColor: ui.card }}
                >
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <BadgeInfo size={16} style={{ color: PRIMARY_COLOR }} />{" "}
                      Patient Detailed Information
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor:
                          current.status === "active"
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          current.status === "active" ? "#059669" : "#ef4444",
                      }}
                    >
                      Status: {current.status || "active"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div
                      className="rounded-2xl p-3.5 space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 flex items-center gap-1.5 font-medium">
                        <User size={13} className="text-blue-500" /> Full Name
                      </span>
                      <p className="font-semibold text-sm">
                        {current.firstName}{" "}
                        {current.middleName ? `${current.middleName} ` : ""}
                        {current.lastName}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl p-3.5 space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 flex items-center gap-1.5 font-medium">
                        <Fingerprint size={13} className="text-purple-500" />{" "}
                        MRN & National ID
                      </span>
                      <p className="font-semibold text-sm">
                        {current.mrn}{" "}
                        {current.nationalId
                          ? `(ID: ${current.nationalId})`
                          : ""}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl p-3.5 space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 flex items-center gap-1.5 font-medium">
                        <Cake size={13} className="text-pink-500" /> Date of
                        Birth & Age
                      </span>
                      <p className="font-semibold text-sm">
                        {current.dateOfBirth
                          ? new Date(current.dateOfBirth).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl p-3.5 space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 flex items-center gap-1.5 font-medium">
                        <Droplet size={13} className="text-red-500" /> Blood
                        Group
                      </span>
                      <p className="font-semibold text-sm uppercase">
                        {current.bloodGroup || "—"}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl p-3.5 space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 flex items-center gap-1.5 font-medium">
                        <Phone size={13} className="text-emerald-500" /> Phone
                        Number
                      </span>
                      <p className="font-semibold text-sm">
                        {[current.countryCode, current.phone]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl p-3.5 space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 flex items-center gap-1.5 font-medium">
                        <Mail size={13} className="text-amber-500" /> Email
                        Address
                      </span>
                      <p className="font-semibold text-sm truncate">
                        {current.email || "—"}
                      </p>
                    </div>
                  </div>

                  {current.notes && (
                    <div
                      className="rounded-2xl p-4 text-xs space-y-1"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="font-semibold opacity-60">
                        Clinical Notes / Remarks:
                      </span>
                      <p className="opacity-90">{current.notes}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatCard
                    icon={Heart}
                    label="Heartbeat"
                    value={pulse.latest != null ? String(pulse.latest) : "—"}
                    unit="bpm"
                    color={byKey("pulseBpm").color}
                    status={rangeStatus(byKey("pulseBpm"), pulse.latest)}
                    ui={ui}
                  >
                    <Sparkline
                      id="pulse"
                      values={sparkSeries("pulseBpm")}
                      color={byKey("pulseBpm").color}
                      unit=" bpm"
                    />
                  </StatCard>

                  <StatCard
                    icon={Activity}
                    label="Blood pressure"
                    value={
                      sys.latest != null
                        ? `${sys.latest}/${dia.latest ?? "—"}`
                        : "—"
                    }
                    unit="mmHg"
                    color={byKey("bpSystolic").color}
                    status={rangeStatus(byKey("bpSystolic"), sys.latest)}
                    ui={ui}
                  >
                    <TickBars
                      values={sparkSeries("bpSystolic")}
                      color={byKey("bpSystolic").color}
                      ui={ui}
                    />
                  </StatCard>

                  <StatCard
                    icon={Thermometer}
                    label="Temperature"
                    value={
                      latestPrev("temperatureC").latest != null
                        ? String(latestPrev("temperatureC").latest)
                        : "—"
                    }
                    unit="°C"
                    color={byKey("temperatureC").color}
                    status={rangeStatus(
                      byKey("temperatureC"),
                      latestPrev("temperatureC").latest
                    )}
                    ui={ui}
                  >
                    <Sparkline
                      id="temp"
                      values={sparkSeries("temperatureC")}
                      color={byKey("temperatureC").color}
                      unit="°C"
                    />
                  </StatCard>

                  <StatCard
                    icon={Wind}
                    label="Blood oxygen (SpO2)"
                    value={
                      latestPrev("spo2").latest != null
                        ? String(latestPrev("spo2").latest)
                        : "—"
                    }
                    unit="%"
                    color={byKey("spo2").color}
                    status={rangeStatus(
                      byKey("spo2"),
                      latestPrev("spo2").latest
                    )}
                    ui={ui}
                  >
                    <Sparkline
                      id="spo2"
                      values={sparkSeries("spo2")}
                      color={byKey("spo2").color}
                      unit="%"
                    />
                  </StatCard>

                  <div
                    className="relative overflow-hidden rounded-[28px] p-6 space-y-4"
                    style={{ backgroundColor: ui.card }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium tracking-tight">
                        Heart-rate activity
                      </h3>
                      {latestVital?.recordedAt && (
                        <span className="text-[11px] opacity-50">
                          {new Date(latestVital.recordedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="max-w-[16rem] text-xs opacity-60">
                      A normal adult resting heart rate is 60–100 beats per
                      minute.
                    </p>
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-5xl font-medium tracking-tight">
                        {pulse.latest ?? "—"}
                        <span className="ml-1.5 text-base font-normal opacity-50">
                          bpm
                        </span>
                      </p>
                      <Heart
                        size={64}
                        fill="#ef4444"
                        color="#ef4444"
                        className="shrink-0 opacity-90"
                      />
                    </div>
                    <RangeGauge
                      metric={byKey("pulseBpm")}
                      latest={pulse.latest}
                      previous={pulse.previous}
                      ui={ui}
                      large
                    />
                    <div className="flex justify-between text-[10px] opacity-50">
                      <span>40 bpm</span>
                      <span>Normal 60–100 bpm</span>
                      <span>140 bpm</span>
                    </div>
                  </div>

                  <div
                    className="rounded-[28px] p-6 space-y-3"
                    style={{ backgroundColor: ui.card }}
                  >
                    <h3 className="text-lg font-medium tracking-tight">
                      Latest vital alerts
                    </h3>
                    {vitalAlerts.length === 0 ? (
                      <div
                        className="flex items-center gap-3 rounded-2xl p-4 text-xs"
                        style={{ backgroundColor: ui.inner }}
                      >
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <span className="opacity-70">
                          No alerts. All recorded vitals are within range.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vitalAlerts.slice(0, 4).map((v, i) => (
                          <div
                            key={v._id || i}
                            className="flex items-start gap-3 rounded-2xl p-3.5"
                            style={{
                              backgroundColor: "rgba(239,68,68,0.08)",
                            }}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
                              <AlertTriangle size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-red-500">
                                {v.alertReason}
                              </p>
                              <p className="text-[10px] opacity-50 mt-0.5">
                                {v.recordedAt
                                  ? new Date(v.recordedAt).toLocaleString()
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------- CONSULTATIONS --------------------------- */}
            {tab === "consultations" && (
              <div className="space-y-4">
                <div
                  className="rounded-[22px] px-4 py-2 flex items-center gap-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <Search size={16} className="opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={consultationsSearch}
                    onChange={(e) => setConsultationsSearch(e.target.value)}
                    placeholder="Search consultations by title, complaint, diagnosis, or doctor..."
                    className="w-full bg-transparent text-xs outline-none focus:outline-none"
                    style={{ color: ui.text }}
                  />
                  {consultationsSearch && (
                    <button
                      type="button"
                      onClick={() => setConsultationsSearch("")}
                      className="opacity-40 hover:opacity-100 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {drafts.length > 0 && (
                  <div
                    className="rounded-[28px] p-5 space-y-3 border border-dashed"
                    style={{ backgroundColor: ui.card, borderColor: ui.border }}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold opacity-75">
                      <FileText size={15} />
                      <span>My Consultation Drafts ({drafts.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {drafts.map((draft) => (
                        <div
                          key={draft.id}
                          onClick={() =>
                            router.push(
                              `/dashboard/patients/${patientId}/consultations/new`
                            )
                          }
                          className="group flex items-center justify-between rounded-2xl p-3 text-xs cursor-pointer border transition hover:opacity-90"
                          style={{
                            backgroundColor: ui.inner,
                            borderColor: ui.border,
                          }}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold truncate">
                              {draft.title}
                            </p>
                            <p className="text-[10px] opacity-50">
                              {draft.updatedAt}
                            </p>
                          </div>
                          <Can perm="consultations.delete"><button
                            type="button"
                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                            className="opacity-40 group-hover:opacity-100 text-red-500 p-1 rounded-lg hover:bg-red-500/10"
                            title="Delete draft"
                          >
                            <X size={14} />
                          </button></Can>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredConsultations.length === 0 ? (
                  <div
                    className="rounded-[28px] p-8 text-center text-xs opacity-60"
                    style={{ backgroundColor: ui.card }}
                  >
                    {consultationsSearch
                      ? "No consultation sessions match your search."
                      : "No consultation sessions recorded yet."}
                  </div>
                ) : (
                  filteredConsultations.map((c: any) => (
                    <div
                      key={c._id}
                      className="rounded-[28px] p-6 space-y-4"
                      style={{ backgroundColor: ui.card }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: ui.inner,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            <Stethoscope size={20} />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/patients/${patientId}/consultations/${c._id}`}
                                className="text-base font-semibold hover:underline"
                              >
                                {c.title}
                              </Link>
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                                style={{
                                  backgroundColor:
                                    c.status === "completed"
                                      ? "rgba(16,185,129,0.15)"
                                      : "rgba(59,130,246,0.15)",
                                  color:
                                    c.status === "completed"
                                      ? "#059669"
                                      : "#2563eb",
                                }}
                              >
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs opacity-60 flex items-center gap-2 mt-0.5">
                              <Calendar size={12} />
                              {c.consultedAt
                                ? new Date(c.consultedAt).toLocaleString()
                                : "—"}
                              {c.doctor && (
                                <>
                                  <span>·</span>
                                  <span>
                                    Dr. {c.doctor.firstName || ""}{" "}
                                    {c.doctor.lastName || ""}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/patients/${patientId}/consultations/${c._id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition outline-none focus:outline-none"
                            title="View/Edit consultation"
                            aria-label="View/Edit consultation"
                          >
                            <Edit3 size={15} />
                          </Link>
                          <Can perm="consultations.delete"><button
                            type="button"
                            onClick={() => confirmRemoveConsultation(c)}
                            className="flex h-9 w-9 items-center justify-center rounded-full opacity-70 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition outline-none focus:outline-none"
                            title="Delete consultation"
                            aria-label="Delete consultation"
                          >
                            <Trash2 size={15} />
                          </button></Can>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl p-4 space-y-2 text-xs"
                        style={{ backgroundColor: ui.inner }}
                      >
                        <div>
                          <span className="font-semibold opacity-60">
                            Complaint:
                          </span>{" "}
                          <span>{c.complaint}</span>
                        </div>
                        {c.diagnosis && (
                          <div>
                            <span className="font-semibold opacity-60">
                              Diagnosis:
                            </span>{" "}
                            <span>
                              {c.diagnosis} {c.icdCode && `(ICD: ${c.icdCode})`}
                            </span>
                          </div>
                        )}
                        {c.summary && (
                          <div>
                            <span className="font-semibold opacity-60">
                              Summary:
                            </span>{" "}
                            <span>{c.summary}</span>
                          </div>
                        )}
                      </div>

                      {c.vitals && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {c.vitals.temperatureC != null && (
                            <div
                              className="rounded-xl p-2.5 text-xs"
                              style={{ backgroundColor: ui.inner }}
                            >
                              <span className="opacity-60 block text-[10px]">
                                Temperature
                              </span>
                              <span className="font-medium">
                                {c.vitals.temperatureC}°C
                              </span>
                            </div>
                          )}
                          {c.vitals.spo2 != null && (
                            <div
                              className="rounded-xl p-2.5 text-xs"
                              style={{ backgroundColor: ui.inner }}
                            >
                              <span className="opacity-60 block text-[10px]">
                                SpO2
                              </span>
                              <span className="font-medium">
                                {c.vitals.spo2}%
                              </span>
                            </div>
                          )}
                          {c.vitals.pulse != null && (
                            <div
                              className="rounded-xl p-2.5 text-xs"
                              style={{ backgroundColor: ui.inner }}
                            >
                              <span className="opacity-60 block text-[10px]">
                                Pulse
                              </span>
                              <span className="font-medium">
                                {c.vitals.pulse} bpm
                              </span>
                            </div>
                          )}
                          {c.vitals.bpSystolic != null && (
                            <div
                              className="rounded-xl p-2.5 text-xs"
                              style={{ backgroundColor: ui.inner }}
                            >
                              <span className="opacity-60 block text-[10px]">
                                BP
                              </span>
                              <span className="font-medium">
                                {c.vitals.bpSystolic}/
                                {c.vitals.bpDiastolic ?? "—"} mmHg
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {c.recommendedTests &&
                          c.recommendedTests.length > 0 && (
                            <div
                              className="rounded-2xl p-4 space-y-2"
                              style={{ backgroundColor: ui.inner }}
                            >
                              <p className="text-xs font-semibold flex items-center gap-1.5 opacity-80">
                                <ClipboardList size={14} /> Recommended Tests
                              </p>
                              <ul className="space-y-1.5 text-xs">
                                {c.recommendedTests.map(
                                  (t: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className="flex justify-between"
                                    >
                                      <span>• {t.name}</span>
                                      {t.urgency && (
                                        <span className="text-[10px] font-bold uppercase opacity-60">
                                          {t.urgency}
                                        </span>
                                      )}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {c.recommendedDrugs &&
                          c.recommendedDrugs.length > 0 && (
                            <div
                              className="rounded-2xl p-4 space-y-2"
                              style={{ backgroundColor: ui.inner }}
                            >
                              <p className="text-xs font-semibold flex items-center gap-1.5 opacity-80">
                                <Pill size={14} /> Recommended Drugs /
                                Prescriptions
                              </p>
                              <ul className="space-y-1.5 text-xs">
                                {c.recommendedDrugs.map(
                                  (d: any, idx: number) => (
                                    <li key={idx} className="space-y-0.5">
                                      <div className="font-semibold">
                                        {d.name} {d.dosage && `(${d.dosage})`}
                                      </div>
                                      {(d.frequency || d.duration) && (
                                        <div className="text-[11px] opacity-65">
                                          {d.frequency || ""}{" "}
                                          {d.duration
                                            ? `for ${d.duration}`
                                            : ""}
                                        </div>
                                      )}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>

                      {c.notes && (
                        <p className="text-xs opacity-70 italic pt-1">
                          Note: {c.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}

                <div
                  className="flex items-center justify-between rounded-[28px] p-4 text-xs"
                  style={{ backgroundColor: ui.card }}
                >
                  <span className="opacity-60">
                    Page {conPage}{" "}
                    {consultationsMeta?.total
                      ? `of ${Math.ceil(consultationsMeta.total / conLimit)}`
                      : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={conPage <= 1}
                      onClick={() => setConPage((p) => Math.max(p - 1, 1))}
                      className="inline-flex items-center gap-1 rounded-full px-4 py-2 font-semibold disabled:opacity-40"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      type="button"
                      disabled={
                        consultationsMeta?.total
                          ? conPage * conLimit >= consultationsMeta.total
                          : (current?.consultations || []).length < conLimit
                      }
                      onClick={() => setConPage((p) => p + 1)}
                      className="inline-flex items-center gap-1 rounded-full px-4 py-2 font-semibold disabled:opacity-40"
                      style={{ backgroundColor: ui.inner }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------- CHART & TRENDS --------------------------- */}
            {tab === "chart" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {([6, 12, 24] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setChartRange(r)}
                        className="rounded-full px-4 py-2 text-xs font-semibold outline-none focus:outline-none"
                        style={pillTab(chartRange === r)}
                      >
                        Last {r}
                      </button>
                    ))}
                    <span className="mx-1 h-5 w-px bg-current opacity-15" />
                    {(
                      [
                        { id: "line", label: "Line", icon: LineChartIcon },
                        { id: "bar", label: "Bars", icon: BarChart3 },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setChartView(o.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold outline-none focus:outline-none"
                        style={pillTab(chartView === o.id)}
                      >
                        <o.icon size={13} /> {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {validVitals.length === 0 ? (
                  <div
                    className="rounded-[28px] p-8 text-center text-xs opacity-60"
                    style={{ backgroundColor: ui.card }}
                  >
                    No vital records yet. Record vitals to see trends.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {METRICS.map((m) => {
                        const { latest, previous } = latestPrev(m.key);
                        return (
                          <MetricSnapshot
                            key={m.key}
                            metric={m}
                            latest={latest}
                            previous={previous}
                            ui={ui}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trendCards.map((c) => {
                        const Icon = c.icon;
                        const insight = c.insight;
                        const isWarn = insight.tone === "warn";
                        return (
                          <div
                            key={c.id}
                            className="rounded-[28px] p-6 space-y-4"
                            style={{ backgroundColor: ui.card }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <span
                                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                  style={{
                                    backgroundColor: ui.inner,
                                    color: c.color,
                                  }}
                                >
                                  <Icon size={18} />
                                </span>
                                <div>
                                  <p className="text-sm font-semibold">
                                    {c.title}
                                  </p>
                                  <p className="text-[11px] opacity-55">
                                    {c.latestText}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <TrendChart
                              id={c.id}
                              labels={chartLabels}
                              fullLabels={chartFullLabels}
                              series={c.series}
                              domain={c.domain}
                              bands={c.bands}
                              mode={chartView}
                              alerts={chartAlerts}
                              unit={c.unit}
                              grid={ui.border}
                            />

                            <div
                              className="rounded-2xl p-3.5 flex items-start gap-2.5 text-xs"
                              style={{
                                backgroundColor: isWarn
                                  ? "rgba(239,68,68,0.08)"
                                  : ui.inner,
                                color: isWarn ? "#ef4444" : ui.text,
                              }}
                            >
                              <span className="shrink-0 mt-0.5">
                                {isWarn ? (
                                  <AlertTriangle
                                    size={15}
                                    className="text-red-500"
                                  />
                                ) : (
                                  <Info size={15} style={{ color: c.color }} />
                                )}
                              </span>
                              <div className="space-y-0.5">
                                <span className="font-semibold block text-[11px] uppercase tracking-wider opacity-60">
                                  Clinical Analysis & Trend Explanation
                                </span>
                                <p className="leading-relaxed opacity-90">
                                  {insight.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div
                  className="rounded-[24px] p-5 space-y-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <HelpCircle size={15} style={{ color: PRIMARY_COLOR }} />
                    <span>Chart & Trend Color Legend Guide</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#f97316" }}
                      />
                      <div>
                        <span className="font-semibold block">
                          Orange (#f97316)
                        </span>
                        <span className="opacity-60 text-[11px]">
                          Temperature (°C) trends
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#3b82f6" }}
                      />
                      <div>
                        <span className="font-semibold block">
                          Blue (#3b82f6)
                        </span>
                        <span className="opacity-60 text-[11px]">
                          Blood Oxygen / SpO2 (%)
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#ec4899" }}
                      />
                      <div>
                        <span className="font-semibold block">
                          Pink (#ec4899)
                        </span>
                        <span className="opacity-60 text-[11px]">
                          Pulse / Heart Rate (bpm)
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#10b981" }}
                      />
                      <div>
                        <span className="font-semibold block">
                          Emerald Green (#10b981)
                        </span>
                        <span className="opacity-60 text-[11px]">
                          Systolic BP & Normal Target Zone
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#8b5cf6" }}
                      />
                      <div>
                        <span className="font-semibold block">
                          Purple (#8b5cf6)
                        </span>
                        <span className="opacity-60 text-[11px]">
                          Diastolic Blood Pressure
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#ef4444" }}
                      />
                      <div>
                        <span className="font-semibold block">
                          Red (#ef4444)
                        </span>
                        <span className="opacity-60 text-[11px]">
                          Out-of-range critical vital alerts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------- VITALS ------------------------------- */}
            {tab === "vitals" && (
              <div className="space-y-4">
                <div
                  className="rounded-[22px] px-4 py-2 flex items-center gap-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <Search size={16} className="opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={vitalsSearch}
                    onChange={(e) => setVitalsSearch(e.target.value)}
                    placeholder="Search vitals by date, alert reason, or values..."
                    className="w-full bg-transparent text-xs outline-none focus:outline-none"
                    style={{ color: ui.text }}
                  />
                  {vitalsSearch && (
                    <button
                      type="button"
                      onClick={() => setVitalsSearch("")}
                      className="opacity-40 hover:opacity-100 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredVitalsList.length === 0 ? (
                    <div
                      className="rounded-[28px] p-8 text-center text-xs opacity-60 lg:col-span-2"
                      style={{ backgroundColor: ui.card }}
                    >
                      {vitalsSearch
                        ? "No vital records match your search."
                        : "No vitals recorded."}
                    </div>
                  ) : (
                    filteredVitalsList.map((v, i) => (
                      <div
                        key={v._id || i}
                        className="rounded-[28px] p-5 space-y-3"
                        style={{ backgroundColor: ui.card }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium opacity-60">
                            {v.recordedAt
                              ? new Date(v.recordedAt).toLocaleString()
                              : "—"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {v.alert && (
                              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-500">
                                Alert
                              </span>
                            )}
                            <Can perm="vitals.write"><button
                              type="button"
                              onClick={() => openEditVital(v)}
                              className="flex h-8 w-8 items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition outline-none focus:outline-none"
                              title="Edit vitals"
                              aria-label="Edit vitals"
                            >
                              <Edit3 size={14} />
                            </button></Can>
                            <Can perm="vitals.delete"><button
                              type="button"
                              onClick={() => confirmRemoveVital(v)}
                              className="flex h-8 w-8 items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition outline-none focus:outline-none"
                              title="Remove vitals"
                              aria-label="Remove vitals"
                            >
                              <Trash2 size={14} />
                            </button></Can>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <VitalTile
                            label="Temperature"
                            value={fmt(v.temperatureC, "°C")}
                            icon={Thermometer}
                            color="#f97316"
                            ui={ui}
                          />
                          <VitalTile
                            label="Blood oxygen"
                            value={fmt(v.spo2, "%")}
                            icon={Wind}
                            color="#3b82f6"
                            ui={ui}
                          />
                          <VitalTile
                            label="Pulse rate"
                            value={fmt(v.pulseBpm, " bpm")}
                            icon={Heart}
                            color="#ec4899"
                            ui={ui}
                          />
                          <VitalTile
                            label="Blood pressure"
                            value={
                              v.bpSystolic != null
                                ? `${v.bpSystolic}/${v.bpDiastolic ?? "—"}`
                                : "—"
                            }
                            icon={Activity}
                            color="#10b981"
                            ui={ui}
                          />
                        </div>
                        {v.alertReason && (
                          <p className="text-[11px] font-semibold text-red-500">
                            Reason: {v.alertReason}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------ ALLERGIES ----------------------------- */}
            {tab === "allergies" && (
              <div className="space-y-4">
                <div
                  className="rounded-[22px] px-4 py-2 flex items-center gap-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <Search size={16} className="opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={allergiesSearch}
                    onChange={(e) => setAllergiesSearch(e.target.value)}
                    placeholder="Search allergies by substance, severity, or reaction..."
                    className="w-full bg-transparent text-xs outline-none focus:outline-none"
                    style={{ color: ui.text }}
                  />
                  {allergiesSearch && (
                    <button
                      type="button"
                      onClick={() => setAllergiesSearch("")}
                      className="opacity-40 hover:opacity-100 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredAllergies.length === 0 ? (
                    <div
                      className="rounded-[28px] p-8 text-center text-xs opacity-60 sm:col-span-2"
                      style={{ backgroundColor: ui.card }}
                    >
                      {allergiesSearch
                        ? "No allergies match your search."
                        : "No allergies recorded."}
                    </div>
                  ) : (
                    filteredAllergies.map((a: any, i: number) => (
                      <AllergyCard
                        key={a._id || i}
                        a={a}
                        canManage={canManageAllergies}
                        onEdit={() => openEditAllergy(a)}
                        onDelete={() => confirmRemoveAllergy(a)}
                        bg={ui.card}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------- FAMILY ------------------------------- */}
            {tab === "family" && (
              <div className="space-y-4">
                <div
                  className="rounded-[22px] px-4 py-2 flex items-center gap-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <Search size={16} className="opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    placeholder="Search family or contacts by name, relationship, or phone..."
                    className="w-full bg-transparent text-xs outline-none focus:outline-none"
                    style={{ color: ui.text }}
                  />
                  {familySearch && (
                    <button
                      type="button"
                      onClick={() => setFamilySearch("")}
                      className="opacity-40 hover:opacity-100 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {group && (
                  <div
                    className="rounded-[28px] p-5 space-y-3"
                    style={{ backgroundColor: ui.card }}
                  >
                    <p className="text-sm font-semibold">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {(group.members || []).map((m: any) => (
                        <Link
                          key={m._id}
                          href={`/dashboard/patients/${m._id}`}
                          className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <UserAvatar user={m} size="sm" />
                          {personLabel(m)} · {m.mrn}
                        </Link>
                      ))}
                    </div>
                    <Can perm="patients.write"><button
                      type="button"
                      onClick={confirmRemoveFromGroup}
                      className="text-xs font-semibold text-red-500 outline-none focus:outline-none"
                    >
                      Remove this patient from group
                    </button></Can>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredContacts.length === 0 ? (
                    <div
                      className="rounded-[28px] p-8 text-center text-xs opacity-60 sm:col-span-2"
                      style={{ backgroundColor: ui.card }}
                    >
                      {familySearch
                        ? "No contacts match your search."
                        : "No family or emergency contacts recorded."}
                    </div>
                  ) : (
                    filteredContacts.map((c, i) => (
                      <div
                        key={c._id || i}
                        className="rounded-[28px] p-5 space-y-2"
                        style={{ backgroundColor: ui.card }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {c.name}
                          </span>
                          {c.isEmergencyContact && (
                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-500">
                              Emergency
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-70 capitalize">
                          Relationship: {c.relationship}
                        </p>
                        {c.phone && (
                          <p className="text-xs opacity-70">
                            Phone: {c.countryCode || ""} {c.phone}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ----------------------------- AUDIT TRAIL ---------------------------- */}
            {tab === "audit" && (
              <div
                className="rounded-[28px] p-6 space-y-4 shadow-none"
                style={{}}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <History size={16} style={{ color: PRIMARY_COLOR }} />{" "}
                    Patient Activity Audit Trail
                  </h3>
                  <span className="text-[11px] opacity-50">
                    {auditLogs.length} event{auditLogs.length === 1 ? "" : "s"}{" "}
                    recorded
                  </span>
                </div>

                <div
                  className="rounded-[22px] px-4 py-2 flex items-center gap-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <Search size={16} className="opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search audit trail by action, details, user, or date..."
                    className="w-full bg-transparent text-xs outline-none focus:outline-none"
                    style={{ color: ui.text }}
                  />
                  {auditSearch && (
                    <button
                      type="button"
                      onClick={() => setAuditSearch("")}
                      className="opacity-40 hover:opacity-100 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {auditLogs.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-current before:opacity-15">
                    {auditLogs.map((log: any, i: number) => {
                      const author =
                        typeof log.by === "object" && log.by !== null
                          ? `${log.by.firstName || ""} ${
                              log.by.lastName || ""
                            }`.trim() || log.by.email
                          : "System User";

                      const formattedTimestamp = log.at
                        ? new Date(log.at).toLocaleString("en-US", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";

                      return (
                        <div key={i} className="relative group">
                          <span
                            className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                            style={{
                              backgroundColor: colors.bg,
                              color: PRIMARY_COLOR,
                              border: `1px solid ${border}`,
                            }}
                          >
                            <Clock size={10} />
                          </span>

                          <div
                            className="rounded-2xl p-4 text-xs space-y-2 transition hover:border-current/25"
                            style={{
                              backgroundColor: colors.shadeBg,
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${PRIMARY_COLOR}18`,
                                  color: PRIMARY_COLOR,
                                }}
                              >
                                {log.action || "Update"}
                              </span>
                              <span className="text-[11px] opacity-50 flex items-center gap-1">
                                <Calendar size={11} />
                                {formattedTimestamp}
                              </span>
                            </div>

                            <div className="opacity-95 leading-relaxed font-normal text-[13px]">
                              {renderFormattedDetail(
                                log.detail || log.details || log.description
                              )}
                            </div>

                            {author && (
                              <div className="flex items-center gap-1.5 pt-1 text-[11px] opacity-60">
                                <UserCheck size={12} />
                                <span>
                                  By{" "}
                                  <strong className="font-semibold">
                                    {author}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl p-8 text-center text-xs opacity-50 italic border border-dashed"
                    style={{ borderColor: border }}
                  >
                    {auditSearch
                      ? "No audit logs match your search."
                      : "No activity logs or audit events recorded for this patient yet."}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ----------------------------- Modal: Allergy ---------------------------- */}
      <Modal
        open={allergyModalOpen}
        title={editingAllergyId ? "Edit allergy" : "Add allergy"}
        onClose={closeAllergyModal}
        escape={!confirm}
        ui={ui}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submitAllergy();
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium opacity-60">
              Substance *
            </label>
            <input
              required
              value={substance}
              onChange={(e) => setSubstance(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <CustomDropdown
            label="Severity"
            value={severity}
            options={[
              { value: "mild", label: "Mild" },
              { value: "moderate", label: "Moderate" },
              { value: "severe", label: "Severe" },
              { value: "life_threatening", label: "Life-threatening" },
            ]}
            onChange={setSeverity}
            isDark={isDark}
            colors={colors}
            border={border}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium opacity-60">
              Reaction
            </label>
            <input
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="e.g. Hives, Anaphylaxis"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeAllergyModal}
              className="rounded-full px-5 py-2.5 text-xs font-semibold outline-none focus:outline-none"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </button>
            <PillButton type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingAllergyId
                ? "Update allergy"
                : "Save allergy"}
            </PillButton>
          </div>
        </form>
      </Modal>

      {/* ------------------------------ Modal: Vitals ---------------------------- */}
      <Modal
        open={vitalModalOpen}
        title={editingVitalId ? "Edit vitals" : "Record vitals"}
        onClose={closeVitalModal}
        escape={!confirm}
        ui={ui}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitVital();
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium opacity-80">
                Temperature (°C)
              </label>
              <input
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 36.6"
                inputMode="decimal"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium opacity-80">
                Blood Oxygen Saturation (%)
              </label>
              <input
                value={bloodOxygenSaturation}
                onChange={(e) => setBloodOxygenSaturation(e.target.value)}
                placeholder="e.g. 98"
                inputMode="decimal"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium opacity-80">
                Pulse Rate (Beats Per Minute)
              </label>
              <input
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value)}
                placeholder="e.g. 75"
                inputMode="numeric"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Systolic (mmHg)
                </label>
                <input
                  value={bloodPressureSystolic}
                  onChange={(e) => setBloodPressureSystolic(e.target.value)}
                  placeholder="e.g. 120"
                  inputMode="numeric"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Diastolic (mmHg)
                </label>
                <input
                  value={bloodPressureDiastolic}
                  onChange={(e) => setBloodPressureDiastolic(e.target.value)}
                  placeholder="e.g. 80"
                  inputMode="numeric"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeVitalModal}
              className="rounded-full px-5 py-2.5 text-xs font-semibold outline-none focus:outline-none"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </button>
            <PillButton type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingVitalId
                ? "Update vitals"
                : "Record vitals"}
            </PillButton>
          </div>
        </form>
      </Modal>

      {/* ------------------------------ Modal: Family ---------------------------- */}
      <Modal
        open={familyModalOpen}
        title="Manage family & contacts"
        onClose={() => setFamilyModalOpen(false)}
        escape={!confirm}
        ui={ui}
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold opacity-70">
              Link registered patients as a family group
            </p>
            <CustomSearchableMultiSelect
              label="Select relatives"
              value={famLinkIds}
              items={otherPatients}
              onChange={setFamLinkIds}
              placeholder="Search patients…"
              searchPlaceholder="Search by name or MRN…"
              isDark={isDark}
              colors={colors}
              border={border}
            />
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Family group name (optional)"
              className={inputCls}
              style={inputStyle}
            />
            <button
              type="button"
              disabled={saving || famLinkIds.length < 1}
              onClick={submitLinkFamily}
              className="w-full rounded-full px-5 py-3 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Group as family
            </button>
          </div>

          <div
            className="border-t pt-4 space-y-3"
            style={{ borderColor: ui.border }}
          >
            <p className="text-xs font-semibold opacity-70">
              Add emergency / custom contact
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submitContact();
              }}
            >
              <input
                required
                value={famName}
                onChange={(e) => setFamName(e.target.value)}
                placeholder="Contact name *"
                className={inputCls}
                style={inputStyle}
              />
              <input
                required
                value={famRel}
                onChange={(e) => setFamRel(e.target.value)}
                placeholder="Relationship (e.g. Spouse) *"
                className={inputCls}
                style={inputStyle}
              />
              <input
                value={famPhone}
                onChange={(e) => setFamPhone(e.target.value)}
                placeholder="Phone number"
                className={inputCls}
                style={inputStyle}
              />
              <button
                type="submit"
                className="w-full rounded-full px-5 py-3 text-xs font-semibold text-white outline-none focus:outline-none"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Save contact
              </button>
            </form>
          </div>
        </div>
      </Modal>

      {/* ---------------------------- Modal: Chart note -------------------------- */}
      <Modal
        open={chartModalOpen}
        title="Add chart note"
        onClose={() => setChartModalOpen(false)}
        escape={!confirm}
        ui={ui}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submitNote();
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium opacity-60">
              Title *
            </label>
            <input
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium opacity-60">
              Detail
            </label>
            <textarea
              value={noteDetail}
              onChange={(e) => setNoteDetail(e.target.value)}
              rows={3}
              placeholder="Detailed medical observations..."
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setChartModalOpen(false)}
              className="rounded-full px-5 py-2.5 text-xs font-semibold outline-none focus:outline-none"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </button>
            <PillButton type="submit">Save note</PillButton>
          </div>
        </form>
      </Modal>

      {/* --------------------------- Confirmation modal -------------------------- */}
      <ConfirmModal
        state={confirm}
        busy={confirming}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
        ui={ui}
      />
    </div>
  );
}
