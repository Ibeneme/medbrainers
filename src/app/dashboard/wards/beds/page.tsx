"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useWardsData } from "@/hooks/useWardsData";
import {
  BED_STATUS_LABEL,
  BED_STATUS_ORDER,
  bedTone,
  occupantOf,
  wardStats,
} from "@/components/wards/bed-ui";
import type { BedStatus } from "@/api/types";
import { WardsTabs } from "@/components/wards/WardsTabs";

/** Circular progress ring (like the "8%" ring in the reference). */
function Ring({
  pct,
  size = 76,
  stroke = 9,
  color,
  track,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function BedBoardPage() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors);
  const { wards, ready, noFacility } = useWardsData();

  const [status, setStatus] = useState<BedStatus | "all">("all");
  const [wardId, setWardId] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      wards.flatMap((w) =>
        (w.beds || []).map((b) => ({ ward: w, bed: b, occ: occupantOf(b) }))
      ),
    [wards]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => (c[r.bed.status] = (c[r.bed.status] || 0) + 1));
    return c;
  }, [rows]);

  const total = rows.length;
  const out = (counts.maintenance || 0) + (counts.blocked || 0);
  const usable = total - out;
  const occPct =
    usable > 0 ? Math.round(((counts.occupied || 0) / usable) * 100) : 0;

  const wardBars = useMemo(
    () => wards.map((w) => ({ id: w._id, name: w.name, ...wardStats(w) })),
    [wards]
  );

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(({ ward, bed, occ }) => {
    if (status !== "all" && bed.status !== status) return false;
    if (wardId !== "all" && ward._id !== wardId) return false;
    if (!q) return true;
    return (
      bed.code.toLowerCase().includes(q) ||
      (bed.label || "").toLowerCase().includes(q) ||
      ward.name.toLowerCase().includes(q) ||
      (occ?.name || "").toLowerCase().includes(q) ||
      (occ?.mrn || "").toLowerCase().includes(q)
    );
  });

  if (noFacility) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-16 text-center"
        style={{ color: ui.text }}
      >
        <BedDouble className="mx-auto mb-3 opacity-30" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const card = "rounded-[28px] p-5";
  const pill = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? PRIMARY_COLOR : ui.inner,
    color: active ? "#fff" : ui.text,
  });
  const maxBars = Math.max(1, ...wardBars.map((b) => b.total));

  return (
    <div
      className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-6"
      style={{ color: ui.text }}
    >
      {/* <WardsTabs ui={ui} /> */}

      {/* ── Hero row: big light title + ring + search pill + CTA ── */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Bed board
            </h1>
            <p className="text-4xl font-light leading-tight tracking-tight opacity-90">
              Ward occupancy
            </p>
          </div>
          <Ring pct={occPct} color={PRIMARY_COLOR} track={ui.inner}>
            <span className="text-xl font-light">
              {occPct}
              <sup className="text-[9px] opacity-60">%</sup>
            </span>
          </Ring>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3 lg:max-w-[560px]">
          <div
            className="flex min-w-[260px] flex-1 items-center gap-3 rounded-full py-2 pl-5 pr-2"
            style={{ backgroundColor: ui.card }}
          >
            <span className="text-sm font-medium">Beds</span>
            <div
              className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2.5"
              style={{ backgroundColor: ui.inner }}
            >
              <Search size={13} className="opacity-50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bed, ward, patient…"
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>
          </div>
          <Link
            href="/dashboard/wards/admissions/new"
            className="inline-flex items-center gap-2 rounded-full px-7 py-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            Admit patient <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
        {/* Left tall card: occupancy + status filters */}
        <section
          className={`${card} flex flex-col gap-5`}
          style={{ backgroundColor: ui.card }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-70">Occupancy</p>
            <span className="text-xs opacity-50">{total} beds</span>
          </div>
          <div className="flex items-center justify-center py-2">
            <Ring
              pct={occPct}
              size={190}
              stroke={16}
              color={PRIMARY_COLOR}
              track={ui.inner}
            >
              <div className="text-center">
                <p className="text-5xl font-light">
                  {occPct}
                  <span className="text-lg opacity-50">%</span>
                </p>
                <p className="mt-1 text-xs opacity-60">
                  {counts.occupied || 0} of {usable} in use
                </p>
              </div>
            </Ring>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setStatus("all")}
              className="flex w-full items-center justify-between rounded-full px-4 py-2.5 text-xs font-medium"
              style={pill(status === "all")}
            >
              <span>All beds</span>
              <span>{total}</span>
            </button>
            {BED_STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="flex w-full items-center justify-between rounded-full px-4 py-2.5 text-xs font-medium"
                style={pill(status === s)}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: status === s ? "#fff" : bedTone(s),
                    }}
                  />
                  {BED_STATUS_LABEL[s]}
                </span>
                <span>{counts[s] || 0}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Right: stat cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Wide: available + bar chart per ward */}
          <section
            className={`${card} sm:col-span-2`}
            style={{ backgroundColor: ui.card }}
          >
            <div className="flex items-center gap-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: ui.inner }}
              >
                <BedDouble size={18} />
              </span>
              <div>
                <p className="text-[11px] opacity-50">Available now</p>
                <p className="text-3xl font-light">
                  {counts.available || 0}
                  <span className="text-sm opacity-50"> beds</span>
                </p>
              </div>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="ml-auto max-w-[170px] rounded-full px-4 py-2.5 text-xs outline-none"
                style={{ backgroundColor: ui.inner, color: ui.text }}
              >
                <option value="all">All wards</option>
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="mt-4 rounded-3xl px-5 pb-3 pt-5"
              style={{ backgroundColor: ui.inner }}
            >
              {wardBars.length === 0 ? (
                <p className="py-8 text-center text-xs opacity-50">
                  No wards yet.
                </p>
              ) : (
                <div className="flex h-28 items-end gap-2 overflow-x-auto">
                  {wardBars.map((b) => {
                    const active = wardId === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setWardId(active ? "all" : b.id)}
                        title={`${b.name}: ${b.occupied}/${b.total} occupied`}
                        className="flex h-full min-w-[26px] flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div
                          className="flex w-full flex-1 items-end rounded-full"
                          style={{ backgroundColor: `${ui.text}14` }}
                        >
                          <div
                            className="w-full rounded-full transition-all"
                            style={{
                              height: `${Math.max(
                                8,
                                (b.total / maxBars) * 100
                              )}%`,
                              background: `linear-gradient(to top, ${PRIMARY_COLOR} ${b.pct}%, ${ui.text}22 ${b.pct}%)`,
                              outline: active
                                ? `2px solid ${PRIMARY_COLOR}`
                                : "none",
                            }}
                          />
                        </div>
                        <span className="max-w-full truncate text-[9px] opacity-60">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-2 text-right text-[10px] opacity-50">
                Bar = ward size · fill = occupied
              </p>
            </div>
          </section>

          {/* Cleaning */}
          <section
            className={`${card} flex flex-col justify-between`}
            style={{ backgroundColor: ui.card, minHeight: 150 }}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm leading-tight opacity-80">
                Awaiting
                <br />
                cleaning
              </p>
              <button
                aria-label="Show cleaning beds"
                onClick={() => setStatus("cleaning")}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: ui.inner }}
              >
                <Sparkles size={14} />
              </button>
            </div>
            <p className="text-4xl font-light">
              {counts.cleaning || 0}
              <sup className="ml-1 text-xs opacity-50">beds</sup>
            </p>
          </section>

          {/* Dark card: out of service */}
          <section
            className={`${card} relative flex min-h-[150px] flex-col justify-between overflow-hidden text-white`}
            style={{
              background: "linear-gradient(135deg,#2b2b2b 0%,#0b0b0b 100%)",
            }}
          >
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px]">
                Maintenance / blocked
              </span>
              <button
                aria-label="Show out of service beds"
                onClick={() => setStatus("maintenance")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"
              >
                <ArrowUpRight size={15} />
              </button>
            </div>
            <div>
              <p className="text-3xl font-light">Out of service</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs opacity-70">
                <Wrench size={12} /> {out} bed{out === 1 ? "" : "s"}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ── Beds ── */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-semibold">
          {status === "all" ? "All beds" : BED_STATUS_LABEL[status]}
          <span className="ml-2 text-xs font-normal opacity-50">
            {filtered.length}
          </span>
        </h2>
        {(status !== "all" || wardId !== "all" || q) && (
          <button
            onClick={() => {
              setStatus("all");
              setWardId("all");
              setQuery("");
            }}
            className="rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{ backgroundColor: ui.card }}
          >
            Clear filters
          </button>
        )}
      </div>

      {!ready ? (
        <div className="py-16 text-center text-xs opacity-60">
          Loading beds…
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-[28px] py-14 text-center text-xs opacity-60"
          style={{ backgroundColor: ui.card }}
        >
          {total === 0
            ? "No beds yet. Create a ward and add beds."
            : "No beds match your filters."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ ward, bed, occ }) => (
            <Link
              key={`${ward._id}-${bed.code}`}
              href={`/dashboard/wards/${ward._id}/beds/${encodeURIComponent(
                bed.code
              )}`}
              className="group flex items-center gap-3 rounded-[28px] p-4 transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: ui.card }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: bedTone(bed.status) }}
              >
                {bed.code}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {occ ? occ.name : ward.name}
                </p>
                <p className="truncate text-xs opacity-55">
                  {occ
                    ? `${ward.name}${occ.mrn ? ` · ${occ.mrn}` : ""}`
                    : BED_STATUS_LABEL[bed.status]}
                </p>
              </div>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 group-hover:opacity-100"
                style={{ backgroundColor: ui.inner }}
              >
                <ArrowUpRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
