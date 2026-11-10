"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useAppSelector } from "@/api/hooks";
import { useTheme } from "@/contexts/theme-context";
import {
  AlertRow,
  AllClear,
  ErrorNote,
  OverviewTabs,
  RefreshBar,
  label,
  nf,
} from "@/components/dashboard/overview/dash-ui";
import { useDashboard } from "@/hooks/useDashboard";

/* ------------------------------------------------------------------ */
/* Theme (same tokens and tuning as the original design)               */
/* ------------------------------------------------------------------ */

type Level = "critical" | "urgent" | "stable";

function useUI() {
  const { theme, colors } = useTheme();
  const pal =
    theme === "dark"
      ? {
          critical: "#fb7185",
          urgent: "#fbbf24",
          stable: "#34d399",
          info: "#60a5fa",
        }
      : {
          critical: "#e11d48",
          urgent: "#b45309",
          stable: "#059669",
          info: "#2563eb",
        };
  const mix = (pct: number) =>
    `color-mix(in srgb, ${colors.text} ${pct}%, transparent)`;
  const card = colors.shadeBg;
  return { theme, colors, pal, level: (l: Level) => pal[l], mix, card };
}

function Card({
  children,
  className = "",
  background,
  borderColor,
}: {
  children: ReactNode;
  className?: string;
  background?: string;
  borderColor?: string;
}) {
  const { colors, card } = useUI();
  return (
    <section
      className={`rounded-3xl border ${className}`}
      style={{
        background: background ?? card,
        borderColor: borderColor ?? colors.border,
      }}
    >
      {children}
    </section>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  aria,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  aria: string;
  render?: (o: T) => string;
}) {
  const { colors, mix } = useUI();
  return (
    <div
      role="tablist"
      aria-label={aria}
      className="flex flex-wrap gap-1 rounded-full border p-1 text-xs"
      style={{ borderColor: colors.border }}
    >
      {options.map((o) => (
        <button
          key={String(o)}
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className="rounded-full px-3 py-1.5 transition focus-visible:outline focus-visible:outline-2"
          style={{
            background: value === o ? colors.text : "transparent",
            color: value === o ? colors.bg : mix(60),
            outlineColor: colors.primary,
          }}
        >
          {render ? render(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart helpers                                                       */
/* ------------------------------------------------------------------ */

function smooth(points: [number, number][]) {
  if (points.length < 2)
    return points.length ? `M${points[0][0]} ${points[0][1]}` : "";
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${
      p2[0] - (p3[0] - p1[0]) / 6
    } ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const sum = (a?: number[]) => (a ?? []).reduce((x, y) => x + y, 0);

function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

const shortLabel = (l: string) => {
  const d = new Date(l);
  return Number.isNaN(d.getTime())
    ? String(l).slice(0, 5)
    : String(d.getDate());
};

// One heartbeat, repeated across the trace.
const beat = "h120 l8 4 l10 -34 l12 52 l8 -22 h30 l12 -10 l12 10";
const ecgPath = `M0 40 ${Array(5).fill(beat).join(" ")} h40`;

function EcgLine({ className = "h-16 w-full" }: { className?: string }) {
  const { colors, mix } = useUI();
  return (
    <svg
      viewBox="0 0 1100 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d={ecgPath}
        fill="none"
        stroke={mix(12)}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={ecgPath}
        pathLength={1}
        fill="none"
        stroke={colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="ecg-sweep"
        style={{ strokeDasharray: "0.18 1.2" }}
      />
    </svg>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 120;
  const h = 36;
  if (!values || values.length < 2) return <div className="h-9" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map(
    (v, i) =>
      [
        (i / (values.length - 1)) * w,
        h - 3 - ((v - min) / (max - min || 1)) * (h - 6),
      ] as [number, number]
  );
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-9 w-full"
      aria-hidden="true"
    >
      <path
        d={smooth(pts)}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={pts[pts.length - 1][0] - 2}
        cy={pts[pts.length - 1][1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function HeartIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="heart-beat h-6 w-6" aria-hidden="true">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
      />
    </svg>
  );
}

const Skeleton = ({ h = "h-44" }: { h?: string }) => {
  const { mix } = useUI();
  return (
    <div
      className={`${h} animate-pulse rounded-2xl`}
      style={{ background: mix(8) }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Activity trend: smooth lines with a hover crosshair                 */
/* ------------------------------------------------------------------ */

type Series = { key: string; text: string; values: number[]; color: string };

function TrendChart({
  labels,
  series,
}: {
  labels: string[];
  series: Series[];
}) {
  const { colors, mix } = useUI();
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const W = 640;
  const H = 280;
  const L = 40;
  const R = 630;
  const T = 18;
  const B = 244;

  if (n < 1) return <Skeleton h="h-[240px]" />;

  const top = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const x = (i: number) =>
    n === 1 ? (L + R) / 2 : L + (i / (n - 1)) * (R - L);
  const y = (v: number) => B - (clamp(v, 0, top) / top) * (B - T);
  const idx = hover ?? n - 1;
  const first = series[0];
  const fillId = `trendfill-${first?.key ?? "a"}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(top * p));
  const xTicks = Array.from(
    new Set([
      0,
      Math.round((n - 1) / 4),
      Math.round((n - 1) / 2),
      Math.round(((n - 1) * 3) / 4),
      n - 1,
    ])
  );

  const pts = (s: Series) =>
    s.values.map((v, i) => [x(i), y(v)] as [number, number]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <p className="text-xs" style={{ color: mix(50) }}>
            {hover === null ? "Latest" : "On"}
          </p>
          <p className="text-lg font-medium tabular-nums">{labels[idx]}</p>
        </div>
        {series.map((s) => (
          <div key={s.key}>
            <p
              className="flex items-center gap-1.5 text-xs"
              style={{ color: mix(50) }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              {s.text}
            </p>
            <p className="text-lg font-medium tabular-nums">
              {nf(s.values[idx])}
            </p>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 h-auto w-full touch-none"
        role="img"
        aria-label={`Trend of ${series
          .map((s) => s.text)
          .join(", ")} over the last ${n} days`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(
            n === 1
              ? 0
              : clamp(Math.round(((px - L) / (R - L)) * (n - 1)), 0, n - 1)
          );
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={first?.color ?? colors.primary}
              stopOpacity="0.4"
            />
            <stop
              offset="100%"
              stopColor={first?.color ?? colors.primary}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={L}
              x2={R}
              y1={y(t)}
              y2={y(t)}
              stroke={mix(14)}
              strokeDasharray="4 5"
            />
            <text
              x={L - 10}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill={mix(45)}
            >
              {t}
            </text>
          </g>
        ))}

        {first && n > 1 && (
          <path
            d={`${smooth(pts(first))} L${x(n - 1)} ${B} L${x(0)} ${B} Z`}
            fill={`url(#${fillId})`}
          />
        )}
        {series.map((s) => (
          <path
            key={s.key}
            d={smooth(pts(s))}
            fill="none"
            stroke={s.color}
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        ))}

        {xTicks.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={270}
            textAnchor="middle"
            fontSize="11"
            fill={mix(45)}
          >
            {labels[i]}
          </text>
        ))}

        <line x1={x(idx)} x2={x(idx)} y1={T} y2={B} stroke={mix(28)} />
        {series.map((s) => (
          <circle
            key={s.key}
            cx={x(idx)}
            cy={y(s.values[idx] ?? 0)}
            r="4.5"
            fill={s.color}
            stroke={colors.bg}
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type Group = "flow" | "inpatient" | "orders";
const GROUPS: readonly Group[] = ["flow", "inpatient", "orders"];
const GROUP_TEXT: Record<Group, string> = {
  flow: "Patient flow",
  inpatient: "Inpatients",
  orders: "Orders",
};

const TRIAGE = [
  { key: "red", text: "Red · immediate", color: "#dc2626" },
  { key: "orange", text: "Orange · very urgent", color: "#ea580c" },
  { key: "yellow", text: "Yellow · urgent", color: "#ca8a04" },
  { key: "green", text: "Green · standard", color: "#16a34a" },
  { key: "blue", text: "Blue · non-urgent", color: "#2563eb" },
];

export default function DashboardHomePage() {
  const { colors, pal, level, mix, card } = useUI();
  const activeFacilityId = useAppSelector((s) => s.facilities.activeFacilityId);
  const user = useAppSelector((s) => s.auth.user) as {
    firstName?: string;
  } | null;

  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [group, setGroup] = useState<Group>("flow");
  const [flowTab, setFlowTab] = useState<"Admissions" | "Discharges">(
    "Admissions"
  );
  const [flowActive, setFlowActive] = useState<number | null>(null);
  const [today, setToday] = useState("");

  const d = useDashboard(["overview", "trends", "alerts"], { days });
  const o = d.overview;
  const t = d.trends;
  const loadingFirst = d.loading.overview && !o;

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  if (!activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-20 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto mb-3 opacity-30" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const rule = `1px solid ${colors.border}`;
  const occ = o?.beds.occupancyRate ?? 0;
  const occLevel: Level =
    occ >= 90 ? "critical" : occ >= 75 ? "urgent" : "stable";
  const critical = d.alerts?.counts.critical ?? 0;
  const warnings = d.alerts?.counts.warning ?? 0;
  const openTasks = (o?.tasks.open ?? 0) + (o?.tasks.inProgress ?? 0);

  /* ---- activity chart ---- */
  const chartSeries: Series[] = !t?.series
    ? []
    : group === "flow"
    ? [
        {
          key: "reg",
          text: "New patients",
          values: t.series.registrations ?? [],
          color: colors.primary,
        },
        {
          key: "er",
          text: "ER arrivals",
          values: t.series.emergencyArrivals ?? [],
          color: pal.critical,
        },
      ]
    : group === "inpatient"
    ? [
        {
          key: "adm",
          text: "Admissions",
          values: t.series.admissions ?? [],
          color: colors.primary,
        },
        {
          key: "dis",
          text: "Discharges",
          values: t.series.discharges ?? [],
          color: pal.info,
        },
      ]
    : [
        {
          key: "lab",
          text: "Lab orders",
          values: t.series.labOrders ?? [],
          color: colors.primary,
        },
        {
          key: "img",
          text: "Imaging orders",
          values: t.series.imagingOrders ?? [],
          color: pal.info,
        },
      ];

  /* ---- bars ---- */
  const flowVals: number[] = t?.series
    ? flowTab === "Admissions"
      ? t.series.admissions ?? []
      : t.series.discharges ?? []
    : [];
  const flowMax = Math.max(1, ...flowVals);
  const flowPeak = flowVals.indexOf(Math.max(0, ...flowVals));
  const flowShown = flowActive ?? (flowPeak >= 0 ? flowPeak : 0);
  const step = Math.max(1, Math.ceil(flowVals.length / 8));

  /* ---- right-now list ---- */
  const triage = TRIAGE.map((s) => ({
    ...s,
    value: o?.emergency?.byTriage?.[s.key] ?? 0,
  }));
  const rowTotal = triage.reduce((a, r) => a + r.value, 0);

  /* ---- operations timeline ---- */
  const ops: {
    title: string;
    value: string;
    sub: string;
    color: string;
    href?: string;
  }[] = [
    {
      title: "Admitted today",
      value: nf(o?.beds?.admittedToday),
      sub: `${nf(o?.beds?.admittedNow)} inpatients now`,
      color: colors.primary,
      href: "/dashboard/wards/admissions",
    },
    {
      title: "Discharged today",
      value: nf(o?.beds?.dischargedToday),
      sub: "Wards",
      color: pal.info,
      href: "/dashboard/wards/discharges",
    },
    {
      title: "Open lab requests",
      value: nf(o?.labs?.open),
      sub: `${nf(o?.labs?.urgentOpen)} urgent / STAT`,
      color: o?.labs?.urgentOpen ? pal.urgent : mix(35),
      href: "/dashboard/labs/requests",
    },
    {
      title: "Open imaging",
      value: nf(o?.radiology?.open),
      sub: `${nf(o?.radiology?.urgentOpen)} urgent / STAT`,
      color: o?.radiology?.urgentOpen ? pal.urgent : mix(35),
      href: "/dashboard/radiology/worklist",
    },
    {
      title: "Prescriptions to fill",
      value: nf(o?.pharmacy?.prescriptionsPending),
      sub: "Pharmacy",
      color: colors.primary,
      href: "/dashboard/pharmacy/dispense",
    },
    {
      title: "Open tasks",
      value: nf(openTasks),
      sub: `${nf(o?.tasks?.overdue)} overdue · ${nf(o?.tasks?.mineOpen)} yours`,
      color: o?.tasks?.overdue ? pal.urgent : mix(35),
      href: "/dashboard/tasks",
    },
    {
      title: "Staff on shift",
      value: nf(o?.staff?.onShiftToday),
      sub: `${nf(o?.staff?.active)} active staff`,
      color: mix(35),
      href: "/dashboard/staff/roster",
    },
  ];

  const bedStatus = Object.entries(
    (o?.beds?.byStatus ?? {}) as Record<string, number>
  );
  const bedTotal = o?.beds?.total ?? 0;

  /* ---- monitor tiles ---- */
  const tiles: {
    label: string;
    value: string;
    unit: string;
    values: number[];
    lvl: Level;
    note: string;
    href: string;
  }[] = [
    {
      label: "Emergency, active",
      value: nf(o?.emergency?.activeNow),
      unit: "now",
      values: t?.series?.emergencyArrivals ?? [],
      lvl: o?.emergency?.waiting ? "critical" : "stable",
      note: `${nf(o?.emergency?.waiting)} red/orange waiting`,
      href: "/dashboard/emergency/tracker",
    },
    {
      label: "Open lab requests",
      value: nf(o?.labs?.open),
      unit: "open",
      values: t?.series?.labOrders ?? [],
      lvl: o?.labs?.urgentOpen ? "urgent" : "stable",
      note: `${nf(o?.labs?.urgentOpen)} urgent / STAT`,
      href: "/dashboard/labs/requests",
    },
    {
      label: "Open imaging",
      value: nf(o?.radiology?.open),
      unit: "open",
      values: t?.series?.imagingOrders ?? [],
      lvl: o?.radiology?.urgentOpen ? "urgent" : "stable",
      note: `${nf(o?.radiology?.urgentOpen)} urgent / STAT`,
      href: "/dashboard/radiology/worklist",
    },
    {
      label: "Active Admissions",
      value: nf(o?.beds?.admittedNow),
      unit: "inpatients",
      values: t?.series?.admissions ?? [],
      lvl: "stable",
      note: `${occ}% occupancy`,
      href: "/dashboard/wards/admissions",
    },
  ];

  const stats = [
    {
      value: nf(o?.beds?.admittedNow),
      label: "Current inpatients",
      sub: `${nf(o?.beds?.admittedToday)} admitted today`,
      href: "/dashboard/wards/admissions",
    },
    {
      value: nf(o?.emergency?.activeNow),
      label: "Active emergency",
      sub: `${nf(o?.emergency?.waiting)} waiting triage`,
      href: "/dashboard/emergency/tracker",
    },
    {
      value: nf(critical),
      label: "Critical alerts",
      sub: `${warnings} warning${warnings === 1 ? "" : "s"}`,
      href: undefined,
    },
    {
      value: nf(openTasks),
      label: "Open tasks",
      sub: `${nf(o?.tasks?.overdue)} overdue`,
      href: "/dashboard/tasks",
    },
  ];

  const headline = !o
    ? "Loading the latest numbers for your facility…"
    : `${nf(o?.emergency?.activeNow)} active emergency cases and ${critical} ${
        critical === 1 ? "alert needs" : "alerts need"
      } attention.`;

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ color: colors.text }}>
      <style>{`
        @keyframes ecg-sweep { from { stroke-dashoffset: 0.18; } to { stroke-dashoffset: -1.2; } }
        .ecg-sweep { animation: ecg-sweep 3.2s linear infinite; }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.2); } 30% { transform: scale(1); } 45% { transform: scale(1.1); } }
        .heart-beat { animation: heartbeat 1.1s ease-in-out infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) {
          .ecg-sweep { animation: none; stroke-dasharray: 1 0 !important; }
          .heart-beat { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-10">
        {/* Greeting */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="min-h-5 text-sm" style={{ color: mix(50) }}>
              {today}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="mt-3 max-w-md text-sm" style={{ color: mix(60) }}>
              {headline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RefreshBar
              lastUpdated={d.lastUpdated}
              loading={d.anyLoading}
              onRefresh={d.refresh}
            />
            <Link
              href="/dashboard/patients"
              className="rounded-full border px-5 py-2.5 text-sm transition hover:opacity-80 focus-visible:outline focus-visible:outline-2"
              style={{
                borderColor: colors.border,
                color: mix(80),
                outlineColor: colors.primary,
              }}
            >
              Find patient
            </Link>
            <Link
              href="/dashboard/wards/admissions"
              className="rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: colors.text,
                color: colors.bg,
                outlineColor: colors.primary,
              }}
            >
              Admissions
            </Link>
          </div>
        </header>

        <div className="mt-6">
          <OverviewTabs />
        </div>
        <div className="mt-4">
          <ErrorNote message={d.error} onRetry={d.refresh} />
        </div>

        <div className="-mx-2 mt-6">
          <EcgLine />
        </div>

        {/* Stats strip */}
        <section
          aria-label="Today at a glance"
          className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border md:grid-cols-4"
          style={{
            backgroundColor: colors.shadeBg,
            borderColor: colors.border,
          }}
        >
          {stats.map((s) => {
            const inner = (
              <div
                className="h-full p-5 md:p-6"
                style={{ background: colors.shadeBg }}
              >
                {loadingFirst ? (
                  <div
                    className="h-10 w-16 animate-pulse rounded-lg"
                    style={{ background: mix(10) }}
                  />
                ) : (
                  <p className="text-4xl font-semibold tabular-nums tracking-tight">
                    {s.value}
                  </p>
                )}
                <p className="mt-2 text-sm" style={{ color: mix(80) }}>
                  {s.label}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: mix(45) }}>
                  {s.sub}
                </p>
              </div>
            );
            return s.href ? (
              <Link
                key={s.label}
                href={s.href}
                className="transition hover:opacity-90"
              >
                {inner}
              </Link>
            ) : (
              <div key={s.label}>{inner}</div>
            );
          })}
        </section>

        {/* Pulse monitor + activity trend */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-medium">Facility pulse</h2>
              <Link
                href="/dashboard/wards/beds"
                className="text-xs underline"
                style={{ color: mix(55) }}
              >
                Beds
              </Link>
            </div>
            <p className="mt-1 text-sm" style={{ color: mix(50) }}>
              {nf(o?.beds?.byStatus?.available)} of {nf(o?.beds?.total)} beds
              free
            </p>

            <div className="mt-5 flex items-center gap-4">
              <HeartIcon color={level(occLevel)} />
              <p className="text-6xl font-semibold leading-none tabular-nums tracking-tight">
                {loadingFirst ? "—" : occ}
                <span className="text-3xl">%</span>
              </p>
              <div>
                <p className="text-sm" style={{ color: mix(70) }}>
                  occupied
                </p>
                <p
                  className="text-xs capitalize"
                  style={{ color: level(occLevel) }}
                >
                  Bed occupancy, {occLevel === "stable" ? "healthy" : occLevel}
                </p>
              </div>
            </div>

            <div className="-mx-1 mt-2">
              <EcgLine className="h-14 w-full" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {tiles.map((x) => (
                <Link
                  key={x.label}
                  href={x.href}
                  className="rounded-2xl border p-3.5 transition hover:opacity-90"
                  style={{ borderColor: colors.border, background: colors.bg }}
                >
                  <div
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: mix(55) }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: level(x.lvl) }}
                    />
                    {x.label}
                  </div>
                  <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
                    {x.value}{" "}
                    <span
                      className="text-xs font-normal"
                      style={{ color: mix(45) }}
                    >
                      {x.unit}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: level(x.lvl) }}>
                    {x.note}
                  </p>
                  <div className="mt-2">
                    <Sparkline values={x.values} color={level(x.lvl)} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-medium">Activity</h2>
                <p className="mt-0.5 text-sm" style={{ color: mix(55) }}>
                  {t?.days ? `Last ${t.days} days` : "\u00a0"}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Segmented
                  aria="Chart group"
                  options={GROUPS}
                  value={group}
                  onChange={setGroup}
                  render={(g) => GROUP_TEXT[g]}
                />
                <Segmented
                  aria="Period"
                  options={[7, 14, 30] as const}
                  value={days}
                  onChange={setDays}
                  render={(n) => `${n}d`}
                />
              </div>
            </div>
            <div className="mt-5">
              {t?.labels ? (
                <TrendChart
                  key={group}
                  labels={t.labels}
                  series={chartSeries}
                />
              ) : (
                <Skeleton h="h-[280px]" />
              )}
            </div>
          </Card>
        </div>

        {/* Bars */}
        <div className="mt-6 grid gap-6">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-medium">Inpatient movement</h2>
                <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight">
                  {t?.series ? nf(sum(flowVals)) : "—"}
                </p>
                <p className="mt-1 text-sm" style={{ color: mix(55) }}>
                  {flowTab.toLowerCase()} in the last {days} days
                  {t?.labels && flowVals.length && flowPeak >= 0
                    ? `, busiest on ${t.labels[flowPeak]}`
                    : ""}
                </p>
              </div>
              <Segmented
                aria="Movement type"
                options={["Admissions", "Discharges"] as const}
                value={flowTab}
                onChange={(v) => {
                  setFlowTab(v);
                  setFlowActive(null);
                }}
              />
            </div>

            {!t?.labels ? (
              <div className="mt-6">
                <Skeleton />
              </div>
            ) : (
              <>
                <div className="relative mt-6">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-t border-dashed"
                      style={{ top: `${i * 42 + 22}px`, borderColor: mix(10) }}
                    />
                  ))}
                  <div
                    className="relative flex h-44 items-end gap-1 sm:gap-1.5"
                    onMouseLeave={() => setFlowActive(null)}
                  >
                    {flowVals.map((v, i) => {
                      const on = i === flowShown;
                      return (
                        <button
                          key={`${flowTab}-${i}`}
                          onMouseEnter={() => setFlowActive(i)}
                          onFocus={() => setFlowActive(i)}
                          aria-label={`${
                            t.labels[i] ?? i
                          }, ${v} ${flowTab.toLowerCase()}`}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-1.5 focus-visible:outline-none"
                        >
                          <span
                            aria-hidden="true"
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
                            style={{
                              background: on ? colors.primary : "transparent",
                              color: on ? colors.invertedText : "transparent",
                            }}
                          >
                            {v}
                          </span>
                          <span
                            className="w-full rounded-full transition-all duration-300"
                            style={{
                              height: Math.max(8, (v / flowMax) * 128),
                              background: on ? colors.primary : mix(16),
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 flex gap-1 sm:gap-1.5">
                  {t.labels.map((l: string, i: number) => (
                    <span
                      key={`${l}-${i}`}
                      className="flex-1 text-center text-[11px] tabular-nums"
                      style={{ color: i === flowShown ? colors.text : mix(40) }}
                    >
                      {i % step === 0 || i === flowShown ? shortLabel(l) : ""}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right-now list + alerts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              style={{ borderBottom: rule }}
            >
              <div>
                <h2 className="text-base font-medium">Right now</h2>
                <p className="text-xs" style={{ color: mix(50) }}>
                  Patients currently in the ER, by triage
                </p>
              </div>
            </div>
            <ul>
              {triage.map((r, i) => (
                <li
                  key={r.key}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderTop: i ? rule : "none" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
                    style={{
                      background: `color-mix(in srgb, ${r.color} 16%, transparent)`,
                      color: r.color,
                    }}
                  >
                    {r.value}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.text}</p>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full"
                      style={{ background: mix(10) }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            rowTotal ? (r.value / rowTotal) * 100 : 0
                          }%`,
                          background: r.color,
                        }}
                      />
                    </div>
                  </div>
                  <p
                    className="w-12 text-right text-xs tabular-nums"
                    style={{ color: mix(45) }}
                  >
                    {rowTotal ? Math.round((r.value / rowTotal) * 100) : 0}%
                  </p>
                </li>
              ))}
              {rowTotal === 0 && (
                <li
                  className="px-5 py-8 text-center text-sm"
                  style={{ color: mix(55) }}
                >
                  No active ER patients.
                </li>
              )}
            </ul>
          </Card>

          <Card
            className="lg:col-span-2"
            background={`color-mix(in srgb, ${pal.critical} 6%, ${card})`}
            borderColor={`color-mix(in srgb, ${pal.critical} 35%, transparent)`}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                borderBottom: `1px solid color-mix(in srgb, ${pal.critical} 25%, transparent)`,
              }}
            >
              <h2 className="text-base font-medium">Needs attention</h2>
              {d.alerts && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: critical ? pal.critical : mix(40),
                    color: colors.bg,
                  }}
                >
                  {critical} critical · {warnings} warnings
                </span>
              )}
            </div>
            <div className="p-4">
              {!d.alerts ? (
                <Skeleton h="h-32" />
              ) : d.alerts.alerts.length === 0 ? (
                <AllClear />
              ) : (
                <div className="space-y-2">
                  {d.alerts.alerts.slice(0, 6).map((a) => (
                    <AlertRow key={a.id} {...a} />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Operations + beds */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <h2 className="text-base font-medium">Today&apos;s operations</h2>
            <ol
              className="mt-5 space-y-5 border-l pl-6"
              style={{ borderColor: colors.border }}
            >
              {ops.map((s) => {
                const body = (
                  <>
                    <span
                      className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{
                        background: s.color,
                        boxShadow: `0 0 0 4px ${card}`,
                      }}
                    />
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm">{s.title}</p>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {s.value}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: mix(45) }}>
                      {s.sub}
                    </p>
                  </>
                );
                return (
                  <li key={s.title} className="relative">
                    {s.href ? (
                      <Link
                        href={s.href}
                        className="block transition hover:opacity-80"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h2 className="text-base font-medium">Bed status</h2>
            <ul className="mt-5 space-y-5">
              <li>
                <div className="flex items-baseline justify-between text-sm">
                  <span style={{ color: mix(80) }}>Overall occupancy</span>
                  <span className="tabular-nums" style={{ color: mix(55) }}>
                    {occ}%
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full"
                  style={{ background: mix(10) }}
                  role="progressbar"
                  aria-valuenow={occ}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall bed occupancy"
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${occ}%`, background: level(occLevel) }}
                  />
                </div>
              </li>
              {bedStatus.map(([k, v]) => {
                const pct = bedTotal ? Math.round((v / bedTotal) * 100) : 0;
                const color =
                  k === "available"
                    ? pal.stable
                    : k === "occupied"
                    ? pal.info
                    : k === "maintenance" || k === "cleaning"
                    ? pal.urgent
                    : mix(40);
                return (
                  <li key={k}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="capitalize" style={{ color: mix(80) }}>
                        {label(k)}
                      </span>
                      <span className="tabular-nums" style={{ color: mix(55) }}>
                        {v} of {bedTotal} beds
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full"
                      style={{ background: mix(10) }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label(k)} beds`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </li>
                );
              })}
              {bedStatus.length === 0 && !loadingFirst && (
                <li className="text-sm" style={{ color: mix(55) }}>
                  No bed data yet.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
