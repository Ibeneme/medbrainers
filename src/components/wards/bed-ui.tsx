"use client";

import { BedDouble, Sparkles, Wrench, Ban, Clock } from "lucide-react";
import type { BedStatus, Ward, WardBed } from "@/api/types";
import { PRIMARY_COLOR } from "@/constants/colors";

/* ------------------------------------------------------------------ */
/*  Colours / labels for each bed state (single source of truth)       */
/* ------------------------------------------------------------------ */

export const BED_STATUS_ORDER: BedStatus[] = [
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "maintenance",
  "blocked",
];

export const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  blocked: "Blocked",
};

/** PRIMARY_COLOR is a live binding, so this must be a function, not a const. */
export function bedTone(status: BedStatus): string {
  switch (status) {
    case "available":
      return PRIMARY_COLOR;
    case "occupied":
      return "#dc2626";
    case "reserved":
      return "#d97706";
    case "cleaning":
      return "#0284c7";
    case "maintenance":
      return "#6b7280";
    case "blocked":
      return "#475569";
  }
}

export function isAssignable(b: WardBed) {
  return b.status === "available" || b.status === "reserved";
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export type OccupantInfo = {
  id?: string;
  name: string;
  mrn?: string;
  diagnosis?: string;
  admittedAt?: string;
};

export function occupantOf(bed: WardBed): OccupantInfo | null {
  const a = bed.currentAdmission;
  if (!a || typeof a === "string") return null;
  const p = a.patient;
  if (!p || typeof p === "string") {
    return { name: "Patient", diagnosis: a.admittingDiagnosis, admittedAt: a.admittedAt };
  }
  const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.mrn || "Patient";
  return {
    id: p._id,
    name,
    mrn: p.mrn,
    diagnosis: a.admittingDiagnosis,
    admittedAt: a.admittedAt,
  };
}

export function wardStats(ward: Pick<Ward, "beds">) {
  const beds = ward.beds || [];
  const count = (s: BedStatus) => beds.filter((b) => b.status === s).length;
  const total = beds.length;
  const occupied = count("occupied");
  const available = count("available");
  const reserved = count("reserved");
  const cleaning = count("cleaning");
  const outOfService = count("maintenance") + count("blocked");
  const usable = total - outOfService;
  const pct = usable > 0 ? Math.round((occupied / usable) * 100) : 0;
  return { total, occupied, available, reserved, cleaning, outOfService, usable, pct };
}

export function waitingLabel(iso?: string) {
  if (!iso) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

export function OccupancyBar({ pct, height = 6 }: { pct: number; height?: number }) {
  const tone = pct >= 90 ? "#dc2626" : pct >= 75 ? "#d97706" : PRIMARY_COLOR;
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, backgroundColor: "rgba(127,127,127,0.18)" }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: tone }}
      />
    </div>
  );
}

export function BedLegend({ counts }: { counts?: Partial<Record<BedStatus, number>> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {BED_STATUS_ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 text-[11px] font-medium opacity-80">
          <span className="h-2.5 w-2.5 rounded-[4px]" style={{ backgroundColor: bedTone(s) }} />
          {BED_STATUS_LABEL[s]}
          {counts?.[s] !== undefined && <span className="opacity-50">({counts[s]})</span>}
        </span>
      ))}
    </div>
  );
}

function StatusGlyph({ status, size = 14 }: { status: BedStatus; size?: number }) {
  if (status === "cleaning") return <Sparkles size={size} />;
  if (status === "maintenance") return <Wrench size={size} />;
  if (status === "blocked") return <Ban size={size} />;
  if (status === "reserved") return <Clock size={size} />;
  return <BedDouble size={size} />;
}

/**
 * One bed. Used on the ward map (click = open bed details) and in the
 * "assign bed" modal (click = select, only assignable beds are enabled).
 */
export function BedTile({
  bed,
  onClick,
  selected = false,
  disabled = false,
  dimmed = false,
  showOccupant = true,
}: {
  bed: WardBed;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  showOccupant?: boolean;
}) {
  const tone = bedTone(bed.status);
  const occ = showOccupant ? occupantOf(bed) : null;
  const sub = occ ? occ.name.split(" ")[0] : BED_STATUS_LABEL[bed.status];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={occ ? `${occ.name}${occ.mrn ? ` · ${occ.mrn}` : ""}` : `${bed.code} · ${BED_STATUS_LABEL[bed.status]}`}
      aria-pressed={selected}
      className="group relative flex min-w-[84px] flex-col items-start gap-1 rounded-2xl px-3 py-2.5 text-left transition outline-none disabled:cursor-not-allowed focus-visible:ring-2"
      style={{
        backgroundColor: selected ? tone : `${tone}1c`,
        color: selected ? "#fff" : undefined,
        boxShadow: selected ? `0 0 0 2px ${tone}` : `inset 0 0 0 1px ${tone}33`,
        opacity: dimmed ? 0.3 : disabled && !selected ? 0.45 : 1,
        backgroundImage:
          bed.status === "blocked" || bed.status === "maintenance"
            ? "repeating-linear-gradient(135deg, transparent 0 6px, rgba(127,127,127,0.12) 6px 12px)"
            : undefined,
      }}
    >
      <span className="flex w-full items-center justify-between gap-2" style={{ color: selected ? "#fff" : tone }}>
        <span className="text-xs font-bold tracking-tight">{bed.code}</span>
        <StatusGlyph status={bed.status} size={13} />
      </span>
      <span
        className="max-w-[90px] truncate text-[10px] font-medium"
        style={{ color: selected ? "#ffffffdd" : undefined, opacity: selected ? 1 : 0.7 }}
      >
        {sub}
      </span>
    </button>
  );
}
