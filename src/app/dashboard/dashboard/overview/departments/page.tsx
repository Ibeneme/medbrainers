"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useAppSelector } from "@/api/hooks";
import { useTheme } from "@/contexts/theme-context";
import {
  Empty,
  ErrorNote,
  OverviewTabs,
  RefreshBar,
  label,
  nf,
} from "@/components/dashboard/overview/dash-ui";
import { useDashboard } from "@/hooks/useDashboard";

/* ------------------------------------------------------------------ */
/* Theme (same tokens as the dashboard home)                           */
/* ------------------------------------------------------------------ */

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
  return { theme, colors, pal, mix, card };
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { colors, card } = useUI();
  return (
    <section
      className={`rounded-3xl border ${className}`}
      style={{ background: card, borderColor: colors.border }}
    >
      {children}
    </section>
  );
}

function CardHead({
  title,
  sub,
  href,
  cta,
}: {
  title: string;
  sub?: string;
  href?: string;
  cta?: string;
}) {
  const { colors, mix } = useUI();
  return (
    <div
      className="flex items-start justify-between gap-3 px-5 py-4"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      <div className="min-w-0">
        <h2 className="text-base font-medium">{title}</h2>
        {sub && (
          <p className="mt-0.5 text-xs" style={{ color: mix(50) }}>
            {sub}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition hover:opacity-80"
          style={{ borderColor: colors.border, color: mix(70) }}
        >
          {cta ?? "Open"}
        </Link>
      )}
    </div>
  );
}

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

const Skeleton = ({ h = "h-32" }: { h?: string }) => {
  const { mix } = useUI();
  return (
    <div
      className={`${h} animate-pulse rounded-2xl`}
      style={{ background: mix(8) }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

type Row = { key: string; text: string; value: number; color?: string };

/** Segmented bar with a legend, for priority splits. */
function PriorityBar({
  segments,
  emptyText,
}: {
  segments: Row[];
  emptyText: string;
}) {
  const { mix } = useUI();
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total === 0)
    return (
      <p
        className="rounded-2xl py-4 text-center text-sm"
        style={{ background: mix(6), color: mix(55) }}
      >
        {emptyText}
      </p>
    );
  return (
    <div>
      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
        style={{ background: mix(10) }}
        role="img"
        aria-label={segments.map((s) => `${s.text} ${s.value}`).join(", ")}
      >
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.color,
              }}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {segments.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-1.5"
            style={{ color: mix(70) }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />
            {s.text}{" "}
            <span
              className="font-medium tabular-nums"
              style={{ color: mix(90) }}
            >
              {s.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Queue-style list: count badge, label, proportional bar, percent. */
function Rows({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  const { colors, mix } = useUI();
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (rows.length === 0 || total === 0)
    return (
      <p
        className="rounded-2xl py-6 text-center text-sm"
        style={{ background: mix(6), color: mix(55) }}
      >
        {emptyText}
      </p>
    );
  return (
    <ul>
      {rows.map((r, i) => {
        const c = r.color ?? colors.primary;
        return (
          <li
            key={r.key}
            className="flex items-center gap-4 py-3"
            style={{ borderTop: i ? `1px solid ${colors.border}` : "none" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
              style={{
                background: `color-mix(in srgb, ${c} 16%, transparent)`,
                color: c,
              }}
            >
              {r.value}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.text}</p>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                style={{ background: mix(10) }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(r.value / total) * 100}%`,
                    background: c,
                  }}
                />
              </div>
            </div>
            <p
              className="w-10 text-right text-xs tabular-nums"
              style={{ color: mix(45) }}
            >
              {Math.round((r.value / total) * 100)}%
            </p>
          </li>
        );
      })}
    </ul>
  );
}

const SubTitle = ({ children }: { children: ReactNode }) => {
  const { mix } = useUI();
  return (
    <p className="mb-3 text-xs font-medium" style={{ color: mix(60) }}>
      {children}
    </p>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardDepartmentsPage() {
  const { colors, pal, mix, card } = useUI();
  const activeFacilityId = useAppSelector((s) => s.facilities.activeFacilityId);
  const activeFacility = useAppSelector((s) => s.facilities.activeFacility) as {
    name?: string;
  } | null;
  const d = useDashboard(["departments"]);
  const x = d.departments;
  const loadingFirst = d.loading.departments && !x;

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

  const priority = (m?: Record<string, number>): Row[] => [
    { key: "stat", text: "STAT", value: m?.stat ?? 0, color: pal.critical },
    { key: "urgent", text: "Urgent", value: m?.urgent ?? 0, color: pal.urgent },
    {
      key: "routine",
      text: "Routine",
      value: m?.routine ?? 0,
      color: pal.info,
    },
  ];

  const sorted = (o?: Record<string, number>, desc = false): Row[] => {
    const e = Object.entries(o ?? {});
    if (desc) e.sort((a, b) => b[1] - a[1]);
    return e.map(([k, v]) => ({ key: k, text: label(k), value: v }));
  };

  const labStages = sorted(x?.labs.byStatus);
  const modality = sorted(x?.radiology.byModality, true);
  const rx = sorted(x?.pharmacy.prescriptionsByStatus);
  const bloodStages = sorted(x?.bloodBank.requestsByStatus);
  const blood = Object.entries(x?.bloodBank.availableByGroup ?? {}) as [
    string,
    number
  ][];
  const rxWaiting = Object.values(
    x?.pharmacy.prescriptionsByStatus ?? {}
  ).reduce((a, b) => a + b, 0);

  const stats = [
    {
      value: nf(x?.labs.open),
      label: "Open lab requests",
      sub: `${nf(x?.labs.completedToday)} resulted today`,
      href: "/dashboard/labs/requests",
    },
    {
      value: nf(x?.radiology.open),
      label: "Open imaging",
      sub: `${nf(x?.radiology.reportedToday)} reported today`,
      href: "/dashboard/radiology/worklist",
    },
    {
      value: nf(rxWaiting),
      label: "Prescriptions waiting",
      sub: `${nf(x?.pharmacy.lowStock.length)} drugs low on stock`,
      href: "/dashboard/pharmacy/dispense",
    },
    {
      value: nf(x?.bloodBank.unitsAvailable),
      label: "Blood units available",
      sub: `${nf(x?.bloodBank.emergencyRequests)} emergency request(s)`,
      href: "/dashboard/blood-bank",
    },
  ];

  const expiry = [
    {
      text: "Expired",
      sub: "batches",
      value: x?.pharmacy.batchesExpired ?? 0,
      color: pal.critical,
    },
    {
      text: "Expire ≤ 30 days",
      sub: "batches",
      value: x?.pharmacy.batchesExpiring30Days ?? 0,
      color: pal.urgent,
    },
    {
      text: "Expire ≤ 90 days",
      sub: "batches",
      value: x?.pharmacy.batchesExpiring90Days ?? 0,
      color: pal.info,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ color: colors.text }}>
      <style>{`
        @keyframes ecg-sweep { from { stroke-dashoffset: 0.18; } to { stroke-dashoffset: -1.2; } }
        .ecg-sweep { animation: ecg-sweep 3.2s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .ecg-sweep { animation: none; stroke-dasharray: 1 0 !important; } }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm" style={{ color: mix(50) }}>
              {activeFacility?.name}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
              Departments
            </h1>
            <p className="mt-3 max-w-md text-sm" style={{ color: mix(60) }}>
              Laboratory, radiology, pharmacy and blood bank at a glance.
            </p>
          </div>
          <RefreshBar
            lastUpdated={d.lastUpdated}
            loading={d.anyLoading}
            onRefresh={d.refresh}
          />
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
          aria-label="Departments at a glance"
          className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border md:grid-cols-4"
          style={{ background: colors.border, borderColor: colors.border }}
        >
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="transition hover:opacity-90"
            >
              <div className="h-full p-5 md:p-6" style={{ background: card }}>
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
            </Link>
          ))}
        </section>

        {/* Laboratory + radiology */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead
              title="Laboratory"
              sub={
                x
                  ? `${nf(x.labs.open)} open · ${nf(
                      x.labs.completedToday
                    )} resulted today`
                  : undefined
              }
              href="/dashboard/labs/requests"
              cta="Open lab"
            />
            <div className="p-5">
              {!x ? (
                <Skeleton h="h-48" />
              ) : (
                <>
                  <SubTitle>Open by priority</SubTitle>
                  <PriorityBar
                    segments={priority(x.labs.byPriority)}
                    emptyText="No open lab requests"
                  />
                  <div className="mt-6">
                    <SubTitle>Open by stage</SubTitle>
                    <Rows
                      rows={labStages}
                      emptyText="Nothing in the pipeline"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              title="Radiology"
              sub={
                x
                  ? `${nf(x.radiology.open)} open · ${nf(
                      x.radiology.reportedToday
                    )} reported today`
                  : undefined
              }
              href="/dashboard/radiology/worklist"
              cta="Open worklist"
            />
            <div className="p-5">
              {!x ? (
                <Skeleton h="h-48" />
              ) : (
                <>
                  <SubTitle>Open by priority</SubTitle>
                  <PriorityBar
                    segments={priority(x.radiology.byPriority)}
                    emptyText="No open imaging requests"
                  />
                  <div className="mt-6">
                    <SubTitle>Open by modality</SubTitle>
                    <Rows rows={modality} emptyText="No open studies" />
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Pharmacy + low stock */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead
              title="Pharmacy"
              sub="Prescriptions awaiting action"
              href="/dashboard/pharmacy/dispense"
              cta="Dispense"
            />
            <div className="p-5">
              {!x ? (
                <Skeleton h="h-48" />
              ) : (
                <Rows rows={rx} emptyText="No prescriptions waiting" />
              )}
              <div
                className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border"
                style={{
                  background: colors.border,
                  borderColor: colors.border,
                }}
              >
                {expiry.map((e) => (
                  <Link
                    key={e.text}
                    href="/dashboard/pharmacy/expiry"
                    className="p-4 transition hover:opacity-90"
                    style={{ background: colors.bg }}
                  >
                    <p
                      className="text-2xl font-semibold tabular-nums tracking-tight"
                      style={{ color: e.value ? e.color : undefined }}
                    >
                      {loadingFirst ? "—" : nf(e.value)}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: mix(70) }}>
                      {e.text}
                    </p>
                    <p className="text-[11px]" style={{ color: mix(45) }}>
                      {e.sub}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHead
              title="Low stock"
              sub="Drugs at or below their reorder level"
              href="/dashboard/pharmacy/low-stock"
              cta="View all"
            />
            <div className="px-5 py-2">
              {!x ? (
                <div className="py-3">
                  <Skeleton h="h-40" />
                </div>
              ) : x.pharmacy.lowStock.length === 0 ? (
                <div className="py-4">
                  <Empty text="Every drug is above its reorder level" />
                </div>
              ) : (
                <ul>
                  {x.pharmacy.lowStock.map((m, i) => {
                    const empty = m.onHand === 0;
                    const c = empty ? pal.critical : pal.urgent;
                    const pct = m.reorderLevel
                      ? Math.min(100, (m.onHand / m.reorderLevel) * 100)
                      : 0;
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-4 py-3.5"
                        style={{
                          borderTop: i ? `1px solid ${colors.border}` : "none",
                        }}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                          style={{ background: mix(10) }}
                        >
                          {(m.name?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {m.name}
                          </p>
                          <div
                            className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                            style={{ background: mix(10) }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: c }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="flex items-center justify-end gap-1.5 text-sm tabular-nums"
                            style={{ color: c }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: c }}
                            />
                            {nf(m.onHand)} / {nf(m.reorderLevel)}
                          </p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: mix(45) }}
                          >
                            {empty ? "Out of stock" : m.unit}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Blood bank */}
        <Card className="mt-6">
          <CardHead
            title="Blood bank"
            sub={
              x
                ? `${nf(x.bloodBank.unitsAvailable)} units available · ${nf(
                    x.bloodBank.emergencyRequests
                  )} emergency request(s)`
                : undefined
            }
            href="/dashboard/blood-bank"
            cta="Open blood bank"
          />
          <div className="grid gap-8 p-5 lg:grid-cols-2">
            <div>
              <SubTitle>Available units by group</SubTitle>
              {!x ? (
                <Skeleton h="h-40" />
              ) : blood.length === 0 ? (
                <p
                  className="rounded-2xl py-6 text-center text-sm"
                  style={{ background: mix(6), color: mix(55) }}
                >
                  No units in stock
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {blood.map(([g, v]) => {
                    // Low stock of a blood group is the thing worth noticing.
                    const c =
                      v === 0
                        ? pal.critical
                        : v < 3
                        ? pal.urgent
                        : colors.primary;
                    return (
                      <Link
                        key={g}
                        href={`/dashboard/blood-bank/inventory?bloodGroup=${encodeURIComponent(
                          g
                        )}`}
                        className="flex h-20 flex-col items-center justify-center rounded-2xl border transition hover:-translate-y-0.5"
                        style={{
                          borderColor:
                            v < 3
                              ? `color-mix(in srgb, ${c} 40%, transparent)`
                              : colors.border,
                          background:
                            v < 3
                              ? `color-mix(in srgb, ${c} 8%, ${colors.bg})`
                              : colors.bg,
                        }}
                      >
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: c }}
                        >
                          {g}
                        </span>
                        <span className="text-xl font-semibold leading-none tabular-nums">
                          {v}
                        </span>
                        <span
                          className="mt-1 text-[10px]"
                          style={{ color: mix(45) }}
                        >
                          {v === 0 ? "none" : v < 3 ? "low" : "units"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <SubTitle>Open requests by stage</SubTitle>
              {!x ? (
                <Skeleton h="h-40" />
              ) : (
                <Rows rows={bloodStages} emptyText="No open blood requests" />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
