"use client";

import type { ReactNode } from "react";
import { personLabel } from "@/components/dashboard/ModuleShell";
import type { TelePerson, TeleRole, TeleSession, TeleStatus, TeleType } from "@/api/slices/telemedicineSlice";

export const TM = "/dashboard/telemedicine";

export const STATUS_COLOR: Record<string, string> = {
  scheduled: "#2563eb",
  live: "#059669",
  completed: "#6b7280",
  cancelled: "#dc2626",
  missed: "#d97706",
  draft: "#d97706",
  signed: "#059669",
};

export const TYPE_LABEL: Record<TeleType, string> = {
  consultation: "Consultation",
  follow_up: "Follow-up",
  review: "Review",
  second_opinion: "Second opinion",
  group: "Group",
};

export const ROLE_LABEL: Record<TeleRole, string> = {
  host: "Host",
  cohost: "Co-host",
  clinician: "Clinician",
  patient: "Patient",
  interpreter: "Interpreter",
  guest: "Guest",
};

export function idOf(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const o = v as { _id?: string; id?: string };
  return o._id || o.id || "";
}

export function who(p: unknown) {
  return personLabel(p);
}

export function hostName(s: TeleSession) {
  return who(s.host);
}

export function patientName(s: { patient?: string | TelePerson }) {
  if (!s.patient) return "No patient";
  if (typeof s.patient === "string") return "Patient";
  const mrn = s.patient.mrn ? ` · ${s.patient.mrn}` : "";
  return `${who(s.patient)}${mrn}`;
}

export function fmtWhen(iso?: string | number | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function toLocalInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 30 * 60_000);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(v: string) {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function minutesBetween(start?: string, end?: string) {
  if (!start || !end) return undefined;
  const n = Math.round((+new Date(end) - +new Date(start)) / 60000);
  return n > 0 ? n : undefined;
}

export function statusOf(s: TeleStatus | string) {
  return String(s || "").replace(/_/g, " ");
}

export function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (n: number) => void;
}) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-xs">
      <span className="opacity-55">{total} total</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-full border px-3 py-1.5 font-semibold disabled:opacity-40">
          Prev
        </button>
        <span className="opacity-60">
          {page} / {pages}
        </span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-full border px-3 py-1.5 font-semibold disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

export function SessionLink({ session, children }: { session: TeleSession; children?: ReactNode }) {
  return (
    <Link href={`${TM}/sessions/${session._id}`} className="min-w-0 flex-1">
      {children}
    </Link>
  );
}
