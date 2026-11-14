"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import {
  AlertTriangle,
  BedDouble,
  Building2,
  Loader2,
  Plus,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchAdmissionRequests,
  fetchMyFacilities,
  fetchWards,
} from "@/api/slices";
import type { Ward, WardBed } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { getUI, PRIMARY_COLOR } from "@/constants/colors";
import { occupantOf, wardStats } from "@/components/wards/bed-ui";

const typeLabel = (t?: string) =>
  t === "icu" || t === "nicu" ? t.toUpperCase() : t || "general";

type BedKind = "available" | "occupied" | "cleaning" | "out";

const bedKind = (b: WardBed): BedKind => {
  if (occupantOf(b)) return "occupied";
  const status = String((b as any).status || "").toLowerCase();
  if (status.includes("clean")) return "cleaning";
  if (status.includes("out") || status.includes("service")) return "out";
  return "available";
};

const KIND_LABEL: Record<BedKind, string> = {
  available: "Available",
  occupied: "Occupied",
  cleaning: "Cleaning",
  out: "Out of service",
};

/* ─── Circular Progress (matches the 8% ring style) ─────── */
function CircularProgress({
  pct,
  size = 64,
  stroke = 5,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="opacity-15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={PRIMARY_COLOR}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: PRIMARY_COLOR }}
        >
          {pct}
          <span className="text-xs opacity-70">%</span>
        </span>
      </div>
    </div>
  );
}

function Bar({ pct, track }: { pct: number; track: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: track }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          backgroundColor: PRIMARY_COLOR,
        }}
      />
    </div>
  );
}

function BedChip({
  wardId,
  bed,
  dimmed,
  ui,
}: {
  wardId: string;
  bed: WardBed;
  dimmed: boolean;
  ui: { inner: string; text: string; card: string };
}) {
  const kind = bedKind(bed);
  const occ = occupantOf(bed);

  const base =
    kind === "occupied"
      ? {
          backgroundColor: PRIMARY_COLOR,
          color: "#FFFFFF",
          boxShadow: `0 4px 14px ${PRIMARY_COLOR}40`,
        }
      : kind === "cleaning"
      ? { backgroundColor: ui.inner, color: ui.text }
      : kind === "out"
      ? {
          backgroundColor: ui.inner,
          color: ui.text,
          opacity: 0.45,
        }
      : {
          backgroundColor: ui.card,
          color: ui.text,
          border: `1px solid ${ui.inner}`,
        };

  return (
    <Link
      href={`/dashboard/wards/${wardId}/beds/${encodeURIComponent(bed.code)}`}
      title={`${bed.code} · ${KIND_LABEL[kind]}${occ ? ` · ${occ.name}` : ""}`}
      className="group relative flex h-16 w-[72px] flex-col items-center justify-center rounded-2xl px-1 transition-all hover:-translate-y-0.5 hover:opacity-100"
      style={{
        ...base,
        opacity: dimmed ? 0.25 : base.opacity ?? 1,
      }}
    >
      <span
        className={`font-mono text-[12px] font-semibold tracking-tight ${
          kind === "out" ? "line-through" : ""
        }`}
      >
        {bed.code}
      </span>
      {occ && (
        <span className="mt-0.5 max-w-full truncate px-1 text-[10px] opacity-90">
          {occ.name.split(" ")[0]}
        </span>
      )}
      {kind === "occupied" && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-blue-600 shadow-sm">
          ●
        </span>
      )}
    </Link>
  );
}

function Legend({ ui }: { ui: { inner: string; card: string } }) {
  const items: { kind: BedKind; label: string; style: React.CSSProperties }[] =
    [
      {
        kind: "available",
        label: "Available",
        style: { backgroundColor: ui.card, border: `1px solid ${ui.inner}` },
      },
      {
        kind: "occupied",
        label: "Occupied",
        style: { backgroundColor: PRIMARY_COLOR },
      },
      {
        kind: "cleaning",
        label: "Cleaning",
        style: { backgroundColor: ui.inner },
      },
      {
        kind: "out",
        label: "Out of service",
        style: { backgroundColor: ui.inner, opacity: 0.5 },
      },
    ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] opacity-70">
      {items.map((i) => (
        <span key={i.kind} className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-md" style={i.style} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export default function WardsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { wards, requests, pendingRequests, loading } = useAppSelector(
    (s) => s.wards
  );

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const refresh = useCallback(() => {
    if (!activeFacilityId) return;
    dispatch(fetchWards(activeFacilityId));
    dispatch(
      fetchAdmissionRequests({
        facilityId: activeFacilityId,
        status: "pending",
      })
    );
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeFacilityId) return;
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [activeFacilityId, refresh]);

  const totals = useMemo(() => {
    const t = {
      total: 0,
      occupied: 0,
      available: 0,
      cleaning: 0,
      outOfService: 0,
      usable: 0,
    };
    wards.forEach((w) => {
      const s = wardStats(w);
      t.total += s.total;
      t.occupied += s.occupied;
      t.available += s.available;
      t.cleaning += s.cleaning;
      t.outOfService += s.outOfService;
      t.usable += s.usable;
    });
    return {
      ...t,
      pct: t.usable ? Math.round((t.occupied / t.usable) * 100) : 0,
    };
  }, [wards]);

  const emergencies = requests.filter((r) => r.priority === "emergency").length;

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    wards.forEach((w) =>
      m.set(w.type || "general", (m.get(w.type || "general") || 0) + 1)
    );
    return [...m.entries()];
  }, [wards]);

  const q = query.trim().toLowerCase();
  const bedMatches = (w: Ward, b: WardBed) => {
    if (!q) return true;
    const occ = occupantOf(b);
    return (
      b.code.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q) ||
      !!occ?.name.toLowerCase().includes(q) ||
      !!occ?.mrn?.toLowerCase().includes(q)
    );
  };

  const visibleWards = wards.filter(
    (w) =>
      (typeFilter === "all" || (w.type || "general") === typeFilter) &&
      (!q || (w.beds || []).some((b) => bedMatches(w, b)))
  );

  if (!activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-20 text-center"
        style={{ color: colors.text }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
        >
          <Building2 size={28} style={{ color: PRIMARY_COLOR }} />
        </div>
        <p className="text-lg font-semibold">Select a facility first</p>
        <p className="mt-1 text-sm opacity-60">
          Choose a facility to manage its wards and beds
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6" style={{ color: ui.text }}>
        {/* ─── Header ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${PRIMARY_COLOR}18`,
                color: PRIMARY_COLOR,
              }}
            >
              <BedDouble size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                Ward & Bed Management
              </h1>
              <p className="truncate text-sm opacity-55">
                {activeFacility?.name}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/wards/create"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
            style={{
              backgroundColor: PRIMARY_COLOR,
              boxShadow: `0 8px 24px ${PRIMARY_COLOR}35`,
            }}
          >
            <Plus size={16} />
            New ward
          </Link>
        </div>

        {/* ─── Waiting banner ─────────────────────────── */}
        {pendingRequests > 0 && (
          <Link
            href="/dashboard/wards/requests"
            className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-all hover:opacity-95"
            style={{
              backgroundColor: `${PRIMARY_COLOR}0C`,
              border: `1px solid ${PRIMARY_COLOR}22`,
            }}
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${PRIMARY_COLOR}20` }}
              >
                <AlertTriangle size={16} style={{ color: PRIMARY_COLOR }} />
              </span>
              <span>
                {pendingRequests} patient
                {pendingRequests === 1 ? " is" : "s are"} waiting for a bed
                {emergencies > 0 && (
                  <span className="ml-1.5 font-semibold text-red-500">
                    · {emergencies} emergency
                  </span>
                )}
              </span>
            </span>
            <span
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: PRIMARY_COLOR }}
            >
              Review & assign
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        )}

        {/* ─── Stats strip (ProHealth style) ──────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Occupancy card with circular progress */}
          <div
            className="col-span-2 flex items-center gap-5 rounded-3xl p-5 lg:col-span-1"
            style={{
              backgroundColor: ui.card,
              boxShadow: isDark
                ? "0 4px 24px rgba(0,0,0,0.25)"
                : "0 4px 24px rgba(0,0,0,0.04)",
            }}
          >
            <CircularProgress pct={totals.pct} size={72} stroke={6} />
            <div>
              <p className="text-xs font-medium opacity-55">Occupancy</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                {totals.occupied}
                <span className="text-base font-normal opacity-50">
                  /{totals.usable}
                </span>
              </p>
              <p className="text-[11px] opacity-45">beds in use</p>
            </div>
          </div>

          {[
            { label: "Available", value: totals.available, sub: "ready now" },
            { label: "Occupied", value: totals.occupied, sub: "patients" },
            {
              label: "Unavailable",
              value: totals.cleaning + totals.outOfService,
              sub: "cleaning / service",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-3xl p-5"
              style={{
                backgroundColor: ui.card,
                boxShadow: isDark
                  ? "0 4px 24px rgba(0,0,0,0.25)"
                  : "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-xs font-medium opacity-55">{c.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {c.value}
              </p>
              <p className="mt-1 text-[11px] opacity-45">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ─── Toolbar ────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div
              className="flex min-w-[240px] max-w-md flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5"
              style={{
                backgroundColor: ui.card,
                boxShadow: isDark
                  ? "0 2px 12px rgba(0,0,0,0.2)"
                  : "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <Search size={16} className="shrink-0 opacity-40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, MRN, bed or ward…"
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-40"
                style={{ color: ui.text }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-lg p-0.5 opacity-50 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Type pills */}
            <div className="flex flex-wrap gap-1.5">
              {[["all", wards.length] as [string, number], ...typeCounts].map(
                ([t, n]) => {
                  const active = typeFilter === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all"
                      style={{
                        backgroundColor: active ? PRIMARY_COLOR : ui.card,
                        color: active ? "#FFFFFF" : ui.text,
                        boxShadow: active
                          ? `0 4px 14px ${PRIMARY_COLOR}40`
                          : isDark
                          ? "0 1px 4px rgba(0,0,0,0.2)"
                          : "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      {t === "all" ? "All wards" : typeLabel(t)}
                      <span
                        className={`ml-1.5 ${
                          active ? "opacity-80" : "opacity-45"
                        }`}
                      >
                        {n}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <Legend ui={ui} />
        </div>

        {/* ─── Wards list ─────────────────────────────── */}
        {loading && wards.length === 0 ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-sm opacity-55">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading wards…
          </div>
        ) : (
          <div className="space-y-5">
            {visibleWards.map((w) => {
              const s = wardStats(w);
              return (
                <section
                  key={w._id}
                  className="overflow-hidden rounded-3xl"
                  style={{
                    backgroundColor: ui.card,
                    boxShadow: isDark
                      ? "0 4px 24px rgba(0,0,0,0.25)"
                      : "0 4px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
                    {/* Left – Ward info */}
                    <div
                      className="space-y-5 p-6 lg:border-r"
                      style={{ borderColor: ui.inner }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/wards/${w._id}`}
                            className="block truncate text-base font-semibold tracking-tight hover:underline"
                          >
                            {w.name}
                          </Link>
                          <p className="mt-1 text-xs opacity-55">
                            <span className="font-mono uppercase tracking-wide">
                              {w.code}
                            </span>
                            {w.floor ? ` · Floor ${w.floor}` : ""}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: `${PRIMARY_COLOR}18`,
                            color: PRIMARY_COLOR,
                          }}
                        >
                          {typeLabel(w.type)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-65">
                            <strong className="font-semibold">
                              {s.occupied}
                            </strong>
                            /{s.usable} occupied ·{" "}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {s.available} free
                            </span>
                          </span>
                          <span className="font-semibold">{s.pct}%</span>
                        </div>
                        <Bar pct={s.pct} track={ui.inner} />
                      </div>

                      <Link
                        href={`/dashboard/wards/${w._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: ui.inner }}
                      >
                        <Plus size={13} />
                        Manage beds
                      </Link>
                    </div>

                    {/* Right – Beds grid */}
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2.5">
                        {(w.beds || []).map((b) => (
                          <BedChip
                            key={b.code}
                            wardId={w._id}
                            bed={b}
                            dimmed={!!q && !bedMatches(w, b)}
                            ui={ui}
                          />
                        ))}
                        {(w.beds || []).length === 0 && (
                          <p className="py-4 text-sm opacity-50">
                            No beds in this ward yet.
                          </p>
                        )}
                      </div>

                      {(s.cleaning > 0 || s.outOfService > 0) && (
                        <p className="mt-4 text-[11px] opacity-50">
                          {s.cleaning > 0 && (
                            <span className="mr-4">{s.cleaning} to clean</span>
                          )}
                          {s.outOfService > 0 && (
                            <span>{s.outOfService} out of service</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}

            {visibleWards.length === 0 && (
              <div
                className="rounded-3xl py-16 text-center"
                style={{
                  backgroundColor: ui.card,
                  boxShadow: isDark
                    ? "0 4px 24px rgba(0,0,0,0.25)"
                    : "0 4px 24px rgba(0,0,0,0.04)",
                }}
              >
                <p className="text-sm opacity-60">
                  {wards.length === 0
                    ? "No wards yet. Create your first ward to start admitting patients."
                    : "Nothing matches your search or filter."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
