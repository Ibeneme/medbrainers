"use client";

import Link from "@/components/access/guarded-link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

export type Tone = "neutral" | "critical" | "warning" | "ok" | "info";

export function useDashUI() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);
  // Status colours are tuned per theme so they stay readable on black and on white.
  const tones: Record<Tone, string> = isDark
    ? {
        neutral: colors.text,
        critical: "#fb7185",
        warning: "#fbbf24",
        ok: "#34d399",
        info: "#60a5fa",
      }
    : {
        neutral: colors.text,
        critical: "#e11d48",
        warning: "#b45309",
        ok: "#059669",
        info: "#2563eb",
      };
  const mix = (pct: number) =>
    `color-mix(in srgb, ${ui.text} ${pct}%, transparent)`;
  return {
    ui,
    isDark,
    tones,
    mix,
    primary: PRIMARY_COLOR,
    secondary: tones.info,
  };
}

export const nf = (n: number | undefined | null) =>
  new Intl.NumberFormat().format(
    Number.isFinite(n as number) ? (n as number) : 0
  );

export const label = (s: string) =>
  s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function timeAgo(iso?: string | null) {
  if (!iso) return "never";
  const secs = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const m = Math.round(secs / 60);
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

/* ------------------------------------------------------------------ */
/* Navigation between dashboard pages                                  */
/* ------------------------------------------------------------------ */

const TABS = [
  { href: "/dashboard/dashboard", text: "Overview" },
  { href: "/dashboard/dashboard/overview/capacity", text: "Capacity" },
  { href: "/dashboard/dashboard/overview/departments", text: "Departments" },
];

export function OverviewTabs() {
  const pathname = usePathname() || "";
  const { ui, mix, primary } = useDashUI();
  const { colors } = useTheme();
  const clean = pathname
    .replace(/^\/[a-z]{2}(?=\/dashboard)/i, "")
    .replace(/\/$/, "");
  return (
    <nav
      aria-label="Dashboard sections"
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border p-1 text-xs"
      style={{ borderColor: ui.border, backgroundColor: colors.shadeBg }}
    >
      {TABS.map((t) => {
        const active = clean === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className="whitespace-nowrap rounded-full px-4 py-1.5 font-semibold transition focus-visible:outline focus-visible:outline-2"
            style={{
              background: active ? ui.text : "transparent",
              color: active ? ui.page : mix(65),
              outlineColor: primary,
            }}
          >
            {t.text}
          </Link>
        );
      })}
    </nav>
  );
}

export function RefreshBar({
  lastUpdated,
  loading,
  onRefresh,
}: {
  lastUpdated: string | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { ui, mix } = useDashUI();
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: mix(60) }}>
      <span aria-live="polite">Updated {timeAgo(lastUpdated)}</span>
      <button
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh dashboard"
        className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:opacity-80 disabled:opacity-50"
        style={{ borderColor: ui.border, background: ui.card, color: ui.text }}
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { ui, mix } = useDashUI();
  return (
    <section
      className={`rounded-[28px] border p-5 ${className}`}
      style={{ background: ui.card, borderColor: ui.border }}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && (
              <p className="mt-0.5 text-xs" style={{ color: mix(55) }}>
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label: text,
  value,
  hint,
  tone = "neutral",
  icon,
  href,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
  href?: string;
  loading?: boolean;
}) {
  const { ui, tones, mix } = useDashUI();
  const accent = tone === "neutral" ? ui.text : tones[tone];
  const body = (
    <div
      className="flex h-full flex-col justify-between gap-3 rounded-[24px] border p-4 transition"
      style={{ background: ui.card, borderColor: ui.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium" style={{ color: mix(60) }}>
          {text}
        </span>
        {icon && (
          <span style={{ color: tone === "neutral" ? mix(50) : accent }}>
            {icon}
          </span>
        )}
      </div>
      <div>
        {loading ? (
          <div
            className="h-8 w-16 animate-pulse rounded-lg"
            style={{ background: mix(10) }}
          />
        ) : (
          <div
            className="text-3xl font-normal tabular-nums tracking-tight"
            style={{ color: accent }}
          >
            {value}
          </div>
        )}
        {hint && (
          <p className="mt-1 text-[11px]" style={{ color: mix(55) }}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="block h-full focus-visible:outline focus-visible:outline-2 rounded-[24px] hover:opacity-90"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

export function ErrorNote({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry?: () => void;
}) {
  const { tones } = useDashUI();
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
      style={{ borderColor: tones.critical, color: tones.critical }}
    >
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  const { mix } = useDashUI();
  return (
    <p className="py-6 text-center text-sm" style={{ color: mix(50) }}>
      {text}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export function AlertRow({
  severity,
  module,
  title,
  detail,
  count,
  href,
}: {
  severity: "critical" | "warning" | "info";
  module: string;
  title: string;
  detail: string;
  count?: number;
  href: string;
}) {
  const { tones, mix, ui } = useDashUI();
  const color = tones[severity];
  const Icon = severity === "info" ? Info : AlertTriangle;
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition hover:opacity-85 focus-visible:outline focus-visible:outline-2"
      style={{ borderColor: ui.border, background: ui.inner }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs" style={{ color: mix(60) }}>
          {module} · {detail}
        </span>
      </span>
      {count !== undefined && (
        <span className="text-lg tabular-nums" style={{ color }}>
          {nf(count)}
        </span>
      )}
      <ArrowUpRight size={14} style={{ color: mix(40) }} />
    </Link>
  );
}

export function AllClear({
  text = "Nothing needs attention right now.",
}: {
  text?: string;
}) {
  const { tones, mix } = useDashUI();
  return (
    <div
      className="flex items-center gap-2 py-6 text-sm"
      style={{ color: mix(65) }}
    >
      <CheckCircle2 size={18} style={{ color: tones.ok }} />
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Charts (inline SVG — no chart library needed)                       */
/* ------------------------------------------------------------------ */

export interface Segment {
  key: string;
  text: string;
  value: number;
  color: string;
}

/** One horizontal bar split into labelled parts, with a legend underneath. */
export function StackedBar({
  segments,
  emptyText = "No data yet",
}: {
  segments: Segment[];
  emptyText?: string;
}) {
  const { mix, ui } = useDashUI();
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <Empty text={emptyText} />;
  return (
    <div>
      <div
        role="img"
        aria-label={segments.map((s) => `${s.text} ${s.value}`).join(", ")}
        className="flex h-3 w-full overflow-hidden rounded-full"
        style={{ background: ui.inner }}
      >
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              title={`${s.text}: ${s.value}`}
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.color,
              }}
            />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {segments.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2"
            style={{ color: mix(75) }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="truncate">{s.text}</span>
            <span
              className="ml-auto tabular-nums font-semibold"
              style={{ color: ui.text }}
            >
              {nf(s.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranked horizontal bars: label, track, value. */
export function BarList({
  rows,
  color,
  emptyText = "No data yet",
}: {
  rows: Array<{
    key: string;
    text: string;
    value: number;
    color?: string;
    suffix?: string;
  }>;
  color?: string;
  emptyText?: string;
}) {
  const { ui, mix, primary } = useDashUI();
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (rows.length === 0 || max === 0) return <Empty text={emptyText} />;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span style={{ color: mix(75) }}>{r.text}</span>
            <span className="tabular-nums font-semibold">
              {nf(r.value)}
              {r.suffix || ""}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: ui.inner }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: r.color || color || primary,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Percentage gauge (occupancy etc.). Colour shifts as it fills. */
export function Gauge({
  value,
  size = 120,
  caption,
}: {
  value: number;
  size?: number;
  caption?: string;
}) {
  const { ui, tones, mix } = useDashUI();
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 90 ? tones.critical : pct >= 75 ? tones.warning : tones.ok;
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`${pct}% ${caption || ""}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ui.inner}
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl tabular-nums">{pct}%</span>
        {caption && (
          <span className="text-[10px]" style={{ color: mix(55) }}>
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}

export interface LineSeries {
  key: string;
  text: string;
  values: number[];
  color: string;
}

/** Multi-series line chart with gridlines and a hover read-out. */
export function LineChart({
  labels,
  series,
  height = 220,
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
}) {
  const { ui, mix } = useDashUI();
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 12, t: 12, b: 24 };
  const n = labels.length;

  const { max, ticks } = useMemo(() => {
    const raw = Math.max(1, ...series.flatMap((s) => s.values));
    const step = Math.max(1, Math.ceil(raw / 4));
    const top = step * 4;
    return { max: top, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
  }, [series]);

  const x = (i: number) =>
    pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const fmtDay = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const every = Math.ceil(n / 7);

  if (n === 0 || series.every((s) => s.values.every((v) => v === 0))) {
    return <Empty text="No activity recorded in this period" />;
  }

  return (
    <div>
      <ul
        className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"
        style={{ color: mix(70) }}
      >
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-4 rounded-full"
              style={{ background: s.color }}
            />
            {s.text}
          </li>
        ))}
      </ul>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Line chart: ${series
            .map((s) => s.text)
            .join(", ")} over ${n} days`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = (
              e.currentTarget as SVGSVGElement
            ).getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            const i = Math.round(
              ((px - pad.l) / (W - pad.l - pad.r)) * (n - 1)
            );
            setHover(Math.max(0, Math.min(n - 1, i)));
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y(t)}
                y2={y(t)}
                stroke={mix(10)}
              />
              <text
                x={pad.l - 6}
                y={y(t) + 3}
                textAnchor="end"
                fontSize={10}
                fill={mix(50)}
              >
                {t}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % every === 0 || i === n - 1 ? (
              <text
                key={l}
                x={x(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fill={mix(50)}
              >
                {fmtDay(l)}
              </text>
            ) : null
          )}
          {series.map((s) => (
            <g key={s.key}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              />
              {hover !== null && (
                <circle
                  cx={x(hover)}
                  cy={y(s.values[hover] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke={ui.card}
                  strokeWidth={2}
                />
              )}
            </g>
          ))}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.t}
              y2={H - pad.b}
              stroke={mix(25)}
              strokeDasharray="3 3"
            />
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border px-3 py-2 text-xs shadow-lg"
            style={{
              background: ui.page,
              borderColor: ui.border,
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover > n / 2 ? "-105%" : "5%"})`,
            }}
          >
            <div className="mb-1 font-semibold">{labels[hover]}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span style={{ color: mix(70) }}>{s.text}</span>
                <span className="ml-auto pl-3 tabular-nums font-semibold">
                  {nf(s.values[hover] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  labelText,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelText: string;
  render?: (o: T) => string;
}) {
  const { ui, mix, primary } = useDashUI();
  return (
    <div
      role="tablist"
      aria-label={labelText}
      className="flex gap-1 rounded-full border p-1 text-xs"
      style={{ borderColor: ui.border }}
    >
      {options.map((o) => (
        <button
          key={String(o)}
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className="rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2"
          style={{
            background: value === o ? ui.text : "transparent",
            color: value === o ? ui.page : mix(60),
            outlineColor: primary,
          }}
        >
          {render ? render(o) : String(o)}
        </button>
      ))}
    </div>
  );
}
