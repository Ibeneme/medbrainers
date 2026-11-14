"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import {
  ArrowLeft,
  BedDouble,
  Minus,
  Plus,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { addBedsToWard, removeBedsFromWard } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { getUI, PRIMARY_COLOR } from "@/constants/colors";
import { occupantOf, wardStats } from "@/components/wards/bed-ui";
import { useWardsData } from "@/hooks/useWardsData";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import type { BedStatus, WardBed } from "@/api/types";

const typeLabel = (t?: string) =>
  t === "icu" || t === "nicu" ? t.toUpperCase() : t || "general";

const fieldCls =
  "w-full rounded-2xl px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-offset-0";

function generateBeds(prefix: string, from: number, count: number) {
  return Array.from(
    { length: Math.max(0, Math.min(count, 100)) },
    (_, i) => `${prefix}${from + i}`
  );
}

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  blocked: "Blocked",
};

type BedKind = "available" | "occupied" | "reserved" | "cleaning" | "out";

const bedKind = (b: WardBed): BedKind => {
  if (occupantOf(b) || b.status === "occupied") return "occupied";
  switch (b.status) {
    case "reserved":
      return "reserved";
    case "cleaning":
      return "cleaning";
    case "maintenance":
    case "blocked":
      return "out";
    default:
      return "available";
  }
};

type Ui = { border: string; inner: string; text: string; card: string };

const tileStyle = (kind: BedKind, ui: Ui): React.CSSProperties => {
  switch (kind) {
    case "occupied":
      return {
        backgroundColor: PRIMARY_COLOR,
        color: "#FFFFFF",
        boxShadow: `0 4px 14px ${PRIMARY_COLOR}40`,
      };
    case "reserved":
      return {
        backgroundColor: `${PRIMARY_COLOR}18`,
        color: PRIMARY_COLOR,
        border: `1px solid ${PRIMARY_COLOR}30`,
      };
    case "cleaning":
      return {
        backgroundColor: "rgba(128,128,128,0.18)",
        color: ui.text,
      };
    case "out":
      return {
        backgroundColor: ui.inner,
        color: ui.text,
        opacity: 0.5,
      };
    default:
      return {
        backgroundColor: ui.card,
        color: ui.text,
        border: `1px solid ${ui.inner}`,
      };
  }
};

const LEGEND: { kind: BedKind; label: string }[] = [
  { kind: "available", label: "Available" },
  { kind: "occupied", label: "Occupied" },
  { kind: "reserved", label: "Reserved" },
  { kind: "cleaning", label: "Cleaning" },
  { kind: "out", label: "Maintenance / blocked" },
];

/* ─── Circular Progress ─────────────────────────────── */
function CircularProgress({
  pct,
  size = 68,
  stroke = 5.5,
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

export default function WardDetailPage() {
  const params = useParams();
  const wardId = params.wardId as string;
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { saving } = useAppSelector((s) => s.wards);
  const { wards, ready, refresh } = useWardsData();

  const ward = wards.find((w) => w._id === wardId);

  const [prefix, setPrefix] = useState("A");
  const [count, setCount] = useState(2);
  const [selectedForRemoval, setSelectedForRemoval] = useState<string[]>([]);

  const start = useMemo(() => {
    if (!ward) return 1;
    const re = new RegExp(
      `^${prefix.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`,
      "i"
    );
    const nums = (ward.beds || [])
      .map((b) => re.exec(b.code))
      .filter(Boolean)
      .map((m) => Number(m![1]));
    return nums.length ? Math.max(...nums) + 1 : 1;
  }, [ward, prefix]);

  const newBeds = generateBeds(prefix.trim(), start, count);
  const setQty = (n: number) =>
    setCount(Math.max(1, Math.min(100, Number.isFinite(n) ? n : 1)));

  if (!ward && !ready) {
    return (
      <div className="mx-auto max-w-md py-20 text-center text-sm opacity-55">
        Loading ward…
      </div>
    );
  }

  if (!ward) {
    return (
      <div className="mx-auto max-w-md py-20 text-center text-sm opacity-55">
        Ward not found.{" "}
        <Link
          href="/dashboard/wards"
          className="font-medium underline underline-offset-2"
          style={{ color: PRIMARY_COLOR }}
        >
          Back to wards
        </Link>
      </div>
    );
  }

  const s = wardStats(ward);

  const removableBeds = (ward.beds || []).filter(
    (b) => !occupantOf(b) && b.status !== "occupied"
  );

  const toggleBedSelection = (code: string) => {
    setSelectedForRemoval((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleRemoveBeds = async () => {
    if (!activeFacilityId || selectedForRemoval.length === 0) return;
    try {
      await dispatch(
        removeBedsFromWard({
          facilityId: activeFacilityId,
          wardId: ward._id,
          bedCodes: selectedForRemoval,
        })
      ).unwrap();
      await refresh();
      showToast(`${selectedForRemoval.length} bed(s) removed`);
      setSelectedForRemoval([]);
    } catch (err) {
      showToast(
        typeof err === "string" ? err : "Could not remove beds",
        "error"
      );
    }
  };

  const softShadow = isDark
    ? "0 4px 24px rgba(0,0,0,0.25)"
    : "0 4px 24px rgba(0,0,0,0.04)";

  return (
    <div
      className="relative mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8"
      style={{ color: ui.text }}
    >
      {saving && <DarkBlurOverlayLoader text="Updating beds..." />}

      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/wards"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80"
          style={{
            backgroundColor: ui.card,
            boxShadow: softShadow,
          }}
          aria-label="Back to wards"
        >
          <ArrowLeft size={16} />
        </Link>

        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${PRIMARY_COLOR}18`,
            color: PRIMARY_COLOR,
          }}
        >
          <BedDouble size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {ward.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-lg px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: ui.inner }}
            >
              {ward.code}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: `${PRIMARY_COLOR}18`,
                color: PRIMARY_COLOR,
              }}
            >
              {typeLabel(ward.type)}
            </span>
            {ward.floor && (
              <span className="opacity-55">Floor {ward.floor}</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Stats strip ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Occupancy with circular progress */}
        <div
          className="col-span-2 flex items-center gap-5 rounded-3xl p-5 lg:col-span-1"
          style={{ backgroundColor: ui.card, boxShadow: softShadow }}
        >
          <CircularProgress pct={s.pct} size={72} stroke={6} />
          <div>
            <p className="text-xs font-medium opacity-55">Occupancy</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight">
              {s.occupied}
              <span className="text-base font-normal opacity-50">
                /{s.usable}
              </span>
            </p>
            <p className="text-[11px] opacity-45">beds in use</p>
          </div>
        </div>

        {[
          { label: "Free beds", value: s.available, sub: "ready now" },
          { label: "Occupied", value: s.occupied, sub: "patients" },
          {
            label: "Unavailable",
            value: s.cleaning + s.outOfService,
            sub: "cleaning / service",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-3xl p-5"
            style={{ backgroundColor: ui.card, boxShadow: softShadow }}
          >
            <p className="text-xs font-medium opacity-55">{c.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {c.value}
            </p>
            <p className="mt-1 text-[11px] opacity-45">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ─── Beds ─────────────────────────────────── */}
        <section
          className="space-y-5 rounded-3xl p-6"
          style={{ backgroundColor: ui.card, boxShadow: softShadow }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              Ward beds
            </h2>
            <span className="text-xs opacity-50">
              {(ward.beds || []).length} total
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {(ward.beds || []).map((b) => {
              const kind = bedKind(b);
              const occ = occupantOf(b);
              const st = tileStyle(kind, ui);
              return (
                <Link
                  key={b.code}
                  href={`/dashboard/wards/${ward._id}/beds/${encodeURIComponent(
                    b.code
                  )}`}
                  title={`${b.code} · ${BED_STATUS_LABEL[b.status]}${
                    occ ? ` · ${occ.name}` : ""
                  }`}
                  className="group relative flex h-16 w-[72px] flex-col items-center justify-center rounded-2xl px-1 transition-all hover:-translate-y-0.5 hover:opacity-100"
                  style={st}
                >
                  <span
                    className={`font-mono text-[12px] font-semibold tracking-tight ${
                      kind === "out" ? "line-through" : ""
                    }`}
                  >
                    {b.code}
                  </span>
                  {occ ? (
                    <span className="mt-0.5 max-w-full truncate px-1 text-[10px] opacity-90">
                      {occ.name.split(" ")[0]}
                    </span>
                  ) : (
                    kind !== "available" && (
                      <span className="mt-0.5 max-w-full truncate px-1 text-[10px] opacity-70">
                        {BED_STATUS_LABEL[b.status]}
                      </span>
                    )
                  )}
                  {kind === "occupied" && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-blue-600 shadow-sm">
                      ●
                    </span>
                  )}
                </Link>
              );
            })}
            {(ward.beds || []).length === 0 && (
              <p className="py-6 text-sm opacity-50">No beds created yet.</p>
            )}
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-[11px] opacity-70"
            style={{ borderColor: ui.inner }}
          >
            {LEGEND.map((l) => (
              <span key={l.kind} className="inline-flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-md"
                  style={tileStyle(l.kind, ui)}
                />
                {l.label}
              </span>
            ))}
          </div>
        </section>

        {/* ─── Side column: Add + Remove ─────────────── */}
        <div className="space-y-5">
          {/* Add beds */}
          <form
            className="space-y-5 rounded-3xl p-6"
            style={{ backgroundColor: ui.card, boxShadow: softShadow }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!activeFacilityId) return;
              try {
                await dispatch(
                  addBedsToWard({
                    facilityId: activeFacilityId,
                    wardId: ward._id,
                    beds: newBeds.map((c) => ({ code: c })),
                  })
                ).unwrap();
                await refresh();
                showToast(`${newBeds.length} bed(s) added`);
                setCount(2);
              } catch (err) {
                showToast(
                  typeof err === "string" ? err : "Could not add beds",
                  "error"
                );
              }
            }}
          >
            <h2 className="text-base font-semibold tracking-tight">
              Add more beds
            </h2>

            <div>
              <label className="mb-2 block text-xs font-medium opacity-55">
                Prefix
              </label>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className={fieldCls}
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium opacity-55">
                Quantity
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setQty(count - 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80"
                  style={{ backgroundColor: ui.inner }}
                  aria-label="Fewer beds"
                >
                  <Minus size={15} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className={`${fieldCls} text-center font-semibold`}
                  style={{
                    backgroundColor: ui.inner,
                    color: ui.text,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setQty(count + 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80"
                  style={{ backgroundColor: ui.inner }}
                  aria-label="More beds"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Preview chips */}
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: ui.inner }}
            >
              <p className="mb-2.5 text-xs opacity-55">
                Will add {newBeds.length} bed
                {newBeds.length === 1 ? "" : "s"}
              </p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {newBeds.length === 0 ? (
                  <span className="text-xs opacity-45">—</span>
                ) : (
                  newBeds.map((b) => (
                    <span
                      key={b}
                      className="rounded-xl px-2.5 py-1 font-mono text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${PRIMARY_COLOR}18`,
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {b}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || newBeds.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: PRIMARY_COLOR,
                boxShadow: `0 8px 20px ${PRIMARY_COLOR}35`,
              }}
            >
              <Plus size={15} />
              {saving ? "Adding..." : "Add beds"}
            </button>
          </form>

          {/* Remove beds */}
          <div
            className="space-y-5 rounded-3xl p-6"
            style={{ backgroundColor: ui.card, boxShadow: softShadow }}
          >
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Remove unoccupied beds
              </h2>
              <p className="mt-1 text-xs opacity-55">
                Select available or non-occupied beds to remove.
              </p>
            </div>

            <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
              {removableBeds.length === 0 ? (
                <span className="py-2 text-sm opacity-50">
                  No unoccupied beds available.
                </span>
              ) : (
                removableBeds.map((b) => {
                  const isSelected = selectedForRemoval.includes(b.code);
                  return (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => toggleBedSelection(b.code)}
                      className="rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-all hover:opacity-90"
                      style={{
                        backgroundColor: isSelected ? "#dc2626" : ui.inner,
                        color: isSelected ? "#ffffff" : ui.text,
                        boxShadow: isSelected
                          ? "0 4px 12px rgba(220,38,38,0.35)"
                          : undefined,
                      }}
                    >
                      {b.code}
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              disabled={saving || selectedForRemoval.length === 0}
              onClick={handleRemoveBeds}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "#dc2626",
                boxShadow:
                  selectedForRemoval.length > 0
                    ? "0 8px 20px rgba(220,38,38,0.3)"
                    : undefined,
              }}
            >
              <Trash2 size={15} />
              {saving
                ? "Removing..."
                : `Remove selected (${selectedForRemoval.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
