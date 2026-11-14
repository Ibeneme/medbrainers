"use client";

import Link from "@/components/access/guarded-link";
import { ChevronRight, Clock } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import type { ImagingRequest, Priority, RequestStatus } from "@/api/slices/radiologySlice";

const PRIORITY_STYLE: Record<Priority, { color: string; bg: string }> = {
  routine: { color: "#6b7280", bg: "rgba(107,114,128,0.14)" },
  urgent: { color: "#d97706", bg: "rgba(217,119,6,0.16)" },
  stat: { color: "#dc2626", bg: "rgba(220,38,38,0.16)" },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  requested: { color: "#6b7280", bg: "rgba(107,114,128,0.14)" },
  pre_auth_pending: { color: "#ca8a04", bg: "rgba(202,138,4,0.16)" },
  pre_auth_approved: { color: "#059669", bg: "rgba(16,185,129,0.14)" },
  pre_auth_denied: { color: "#dc2626", bg: "rgba(220,38,38,0.14)" },
  scheduled: { color: "#2563eb", bg: "rgba(37,99,235,0.14)" },
  arrived: { color: "#0891b2", bg: "rgba(8,145,178,0.14)" },
  queued: { color: "#7c3aed", bg: "rgba(124,58,237,0.14)" },
  in_acquisition: { color: "#7c3aed", bg: "rgba(124,58,237,0.18)" },
  completed: { color: "#059669", bg: "rgba(16,185,129,0.14)" },
  reported: { color: "#059669", bg: "rgba(16,185,129,0.18)" },
  cancelled: { color: "#6b7280", bg: "rgba(107,114,128,0.16)" },
};

function patientLabel(p: ImagingRequest["patient"]) {
  if (!p) return "—";
  if (typeof p === "string") return p.slice(-6);
  return `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.mrn || "—";
}

export function PriorityBadge({ priority }: { priority?: Priority }) {
  const p = priority || "routine";
  const s = PRIORITY_STYLE[p];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {p}
    </span>
  );
}

export function StatusBadge({ status }: { status?: RequestStatus | string }) {
  const key = status || "requested";
  const s = STATUS_STYLE[key] || STATUS_STYLE.requested;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {String(key).replace(/_/g, " ")}
    </span>
  );
}

export default function RequestRow({
  item,
  href,
  ui,
}: {
  item: ImagingRequest;
  href?: string;
  ui: { card: string; inner: string; text: string; border: string };
}) {
  const link = href || `/dashboard/radiology/requests?id=${item._id}`;
  return (
    <Link
      href={link}
      className="flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4 transition hover:opacity-95"
      style={{ backgroundColor: ui.card, borderColor: ui.border, color: ui.text }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold uppercase"
        style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
      >
        {(item.modality || "img").slice(0, 3)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">
            {item.procedureName || item.bodyPart || "Imaging"}
          </p>
          <PriorityBadge priority={item.priority} />
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-0.5 truncate text-xs opacity-60">
          {patientLabel(item.patient)}
          {item.accessionNumber ? ` · ${item.accessionNumber}` : ""}
          {item.bodyPart ? ` · ${item.bodyPart}` : ""}
        </p>
        {item.clinicalIndication && (
          <p className="mt-1 line-clamp-1 text-[11px] opacity-50">{item.clinicalIndication}</p>
        )}
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] opacity-50">
        {item.requestedAt && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {new Date(item.requestedAt).toLocaleString()}
          </span>
        )}
      </div>
      <ChevronRight size={16} className="shrink-0 opacity-40" />
    </Link>
  );
}
