"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchErActive, fetchErRegistration } from "@/api/slices";
import type { ErDispatch, ErDispatchStatus, ErRegistration, ErStatus, ErTriage } from "@/api/slices/emergencySlice";
import { useEmergency } from "@/hooks/useEmergency";
import {
  Card,
  RowLink,
  useUI,
  type SectionSpec,
} from "@/components/blood-bank/bb-ui";

/* One look across Blood Bank, Wards and Emergency: re-export the shared primitives. */
export {
  Avatar,
  BackHeader,
  Banner,
  Bar,
  Btn,
  Card,
  Context,
  DataTable,
  Empty,
  Header,
  KV,
  KVGrid,
  Loader,
  NotFound,
  Page,
  Pills,
  RowLink,
  SearchBox,
  SectionCard,
  SpecForm,
  Stat,
  Ring,
  clean,
  fmtDate,
  fmtDateTime,
  idOf,
  nameOf,
  num,
  toLocalInput,
  useConfirm,
  useDebounced,
  useForm,
  useLoad,
  useUI,
} from "@/components/blood-bank/bb-ui";
export type { FieldSpec, SectionSpec } from "@/components/blood-bank/bb-ui";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Constants (mirror the server enums in emergency.schema.ts)                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export const BASE = "/dashboard/emergency";

/**
 * Manchester Triage System. `targetMin` = max minutes a triaged patient should wait to be seen.
 * MIRRORS TRIAGE_TARGET_MINUTES in the server schema — keep both in sync.
 */
export const TRIAGE: Record<ErTriage, { label: string; color: string; targetMin: number; hint: string }> = {
  red: { label: "Immediate", color: "#dc2626", targetMin: 0, hint: "Life-threatening. Goes straight to the resuscitation bay." },
  orange: { label: "Very urgent", color: "#f97316", targetMin: 10, hint: "Risk to life or limb. Be seen within 10 minutes." },
  yellow: { label: "Urgent", color: "#eab308", targetMin: 60, hint: "Serious but stable. Be seen within 1 hour." },
  green: { label: "Standard", color: "#16a34a", targetMin: 120, hint: "Minor problem. Be seen within 2 hours." },
  blue: { label: "Non-urgent", color: "#2563eb", targetMin: 240, hint: "Could be managed elsewhere. Be seen within 4 hours." },
};
export const TRIAGE_ORDER: ErTriage[] = ["red", "orange", "yellow", "green", "blue"];
/** Max minutes an arrival should wait before being triaged. */
export const TRIAGE_DELAY_MIN = 15;

export const ER = {
  arrivalModes: ["walk-in", "ambulance", "referral", "police", "other"],
  activeStatuses: ["waiting", "triaged", "in-resus", "in-treatment", "observation"] as ErStatus[],
  terminalStatuses: ["admitted", "referred", "discharged", "deceased", "left-against-advice"] as ErStatus[],
  dispatchStatuses: ["requested", "dispatched", "en-route", "on-scene", "returning", "completed", "cancelled"] as ErDispatchStatus[],
  openDispatch: ["requested", "dispatched", "en-route", "on-scene", "returning"] as ErDispatchStatus[],
  priorities: ["emergency", "urgent", "routine"],
  mlCaseTypes: [
    "Assault",
    "Road traffic accident",
    "Gunshot wound",
    "Stab wound",
    "Sexual assault",
    "Domestic violence",
    "Poisoning / overdose",
    "Burns",
    "Suspicious death",
    "Brought in dead",
  ],
  mechanisms: [
    "Road traffic accident",
    "Fall from height",
    "Fall (same level)",
    "Assault",
    "Gunshot wound",
    "Stab / cut wound",
    "Burn / scald",
    "Blast / explosion",
    "Drowning",
    "Sports injury",
    "Crush injury",
  ],
  injuryRegions: ["Head", "Face", "Neck", "Cervical spine", "Chest", "Abdomen", "Pelvis", "Spine", "Upper limb", "Lower limb", "Burns", "Soft tissue"],
};

/** What a ward / referral destination looks like once the patient leaves. */
export const DISPOSITION_LABEL: Record<string, string> = {
  admit: "Admitted",
  refer: "Referred",
  discharge: "Discharged",
  deceased: "Deceased",
  "left-against-advice": "Left against advice",
};

/** Next step in the ambulance lifecycle and the button that performs it. */
export const DISPATCH_NEXT: Partial<Record<ErDispatchStatus, { to: ErDispatchStatus; cta: string; confirm: string }>> = {
  requested: { to: "dispatched", cta: "Dispatch ambulance", confirm: "Send this vehicle and crew to the scene?" },
  dispatched: { to: "en-route", cta: "Mark en route", confirm: "Crew has left for the scene?" },
  "en-route": { to: "on-scene", cta: "Arrived on scene", confirm: "Crew has reached the pickup address?" },
  "on-scene": { to: "returning", cta: "Returning to hospital", confirm: "Patient is loaded and the crew is heading back?" },
  returning: { to: "completed", cta: "Arrived at hospital", confirm: "The ambulance has arrived at the emergency department?" },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const TONES = { ok: "#10b981", warn: "#f59e0b", bad: "#ef4444", info: "#3b82f6", mute: "#94a3b8" };

export const erLabel = (s?: string | null) => {
  if (!s) return "—";
  const t = String(s).replace(/[-_]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const minsSince = (iso?: string | null, to?: string | number | Date) =>
  iso ? Math.max(0, Math.round(((to ? new Date(to).getTime() : Date.now()) - new Date(iso).getTime()) / 60000)) : 0;

export const fmtMins = (m?: number | null) => {
  if (m === undefined || m === null) return "—";
  if (m < 1) return "<1m";
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const r = m % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${r}m` : `${r}m`;
};

export const ageOf = (dob?: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(+d)) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
};

type RegLike = { patient?: any; temporaryName?: string; isUnknown?: boolean };

export const patientOfReg = (r?: RegLike | null) =>
  r?.patient && typeof r.patient !== "string" ? (r.patient as Exclude<NonNullable<ErRegistration["patient"]>, string>) : null;

export const regName = (r?: RegLike | null) => {
  if (!r) return "—";
  const p = patientOfReg(r);
  if (p) return `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.mrn || "Patient";
  if (r.patient) return "Patient";
  return r.temporaryName || "Unidentified patient";
};

/** Person on a populated trauma / medico-legal / disposition row. */
export const rowPatientName = (row: { patient?: any; registration?: any }) => {
  const p = row.patient && typeof row.patient !== "string" ? row.patient : null;
  if (p) return `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.mrn || "Patient";
  const reg = row.registration && typeof row.registration !== "string" ? row.registration : null;
  return reg?.temporaryName || "Unidentified patient";
};

export const regMeta = (r: RegLike) => {
  const p = patientOfReg(r);
  if (!p) return r.patient ? "" : "Unidentified";
  const age = ageOf(p.dateOfBirth);
  return [p.mrn, age !== null ? `${age}y` : null, p.gender].filter(Boolean).join(" · ");
};

/** True when a not-yet-seen patient has waited past the target for their category (or past the triage target if untriaged). */
export const isOverdue = (r: Pick<ErRegistration, "status" | "triageCategory" | "arrivalTime">) => {
  if (r.status !== "waiting" && r.status !== "triaged") return false;
  const m = minsSince(r.arrivalTime);
  return r.triageCategory ? m > TRIAGE[r.triageCategory].targetMin : m > TRIAGE_DELAY_MIN;
};

export const sortByPriority = <T extends Pick<ErRegistration, "triageCategory" | "arrivalTime">>(rows: T[]) =>
  [...rows].sort(
    (a, b) =>
      (a.triageCategory ? TRIAGE_ORDER.indexOf(a.triageCategory) : -1) - (b.triageCategory ? TRIAGE_ORDER.indexOf(b.triageCategory) : -1) ||
      +new Date(a.arrivalTime) - +new Date(b.arrivalTime),
  );

export const textOn = (hex: string) => (hex === "#eab308" ? "#1f2937" : "#ffffff");

export const refId = (x: any): string => (!x ? "" : typeof x === "string" ? x : x._id || "");

/** Re-render a page every `ms` so wait timers keep moving. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

/** Run `load` now and then every `ms` (ER boards must not go stale). */
export function useAutoRefresh(load: () => unknown, enabled: boolean, ms = 20000) {
  useEffect(() => {
    if (!enabled) return;
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, [load, enabled, ms]);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Hooks                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export function useER() {
  const er = useEmergency();
  const router = useRouter();
  const u = useUI();
  return { ...er, router, ...u };
}

/**
 * Options for a "which ER patient?" select. Loads the active list and, when a preselected
 * registration is no longer active (e.g. opening a trauma case after discharge), fetches it too.
 */
export function useRegOptions(preselectId?: string) {
  const { facilityId, act, emergency } = useER();
  const [extra, setExtra] = useState<ErRegistration | null>(null);

  useEffect(() => {
    if (facilityId) act(fetchErActive({ facilityId }), false);
  }, [facilityId, act]);

  useEffect(() => {
    if (!facilityId || !preselectId) return;
    if (emergency.active.some((r) => r._id === preselectId)) return;
    act<ErRegistration>(fetchErRegistration({ facilityId, registrationId: preselectId }), false).then((r) => {
      if (r && r !== (true as any)) setExtra(r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, preselectId, act]);

  const rows = [...(extra && !emergency.active.some((r) => r._id === extra._id) ? [extra] : []), ...sortByPriority(emergency.active)];
  const options = rows.map((r) => ({
    value: r._id,
    label: `${regName(r)} · ${r.chiefComplaint.length > 44 ? `${r.chiefComplaint.slice(0, 44)}…` : r.chiefComplaint}${
      r.triageCategory ? ` · ${TRIAGE[r.triageCategory].label}` : " · Untriaged"
    }`,
  }));
  return { options, rows, byId: (id: string) => rows.find((r) => r._id === id) };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Badges                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

export function TriageBadge({ category, size = "md" }: { category?: ErTriage | null; size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-14 min-w-24 px-4 text-base" : size === "sm" ? "h-6 min-w-[52px] px-2 text-[10px]" : "h-9 min-w-[72px] px-3 text-xs";
  if (!category) {
    return (
      <span
        className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-xl font-bold uppercase tracking-wide opacity-45`}
        style={{ border: "1px dashed currentColor" }}
      >
        {size === "sm" ? "New" : "Untriaged"}
      </span>
    );
  }
  const t = TRIAGE[category];
  return (
    <span
      className={`inline-flex ${dim} shrink-0 flex-col items-center justify-center rounded-xl font-bold uppercase leading-none tracking-wide`}
      style={{ backgroundColor: t.color, color: textOn(t.color), boxShadow: size === "sm" ? undefined : `0 6px 16px ${t.color}40` }}
      title={`${t.label} — ${t.hint}`}
    >
      <span>{category}</span>
      {size === "lg" && <span className="mt-1 text-[10px] font-medium normal-case tracking-normal opacity-90">{t.label}</span>}
    </span>
  );
}

const STATUS_COLOR: Record<string, string> = {
  waiting: TONES.warn,
  triaged: TONES.info,
  "in-resus": TONES.bad,
  "in-treatment": TONES.info,
  observation: "#8b5cf6",
  admitted: TONES.ok,
  referred: TONES.mute,
  discharged: TONES.ok,
  deceased: "#475569",
  "left-against-advice": TONES.warn,
  // dispatch
  requested: TONES.warn,
  dispatched: TONES.info,
  "en-route": TONES.info,
  "on-scene": "#8b5cf6",
  returning: TONES.info,
  completed: TONES.ok,
  cancelled: TONES.mute,
  // priority / mass casualty
  emergency: TONES.bad,
  urgent: TONES.warn,
  routine: TONES.mute,
  active: TONES.bad,
  "stand-down": TONES.warn,
  closed: TONES.mute,
  // ward request status
  pending: TONES.warn,
  accepted: TONES.ok,
  rejected: TONES.bad,
};

export const statusColor = (s?: string) => STATUS_COLOR[s || ""] || TONES.mute;

export function ErPill({ value, tone, children }: { value?: string; tone?: keyof typeof TONES; children?: ReactNode }) {
  const c = tone ? TONES[tone] : statusColor(value);
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${c}1f`, color: c }}
    >
      {children ?? erLabel(value)}
    </span>
  );
}

/** Time in department. Red + "over target" once a not-yet-seen patient has waited past their category's limit. */
export function WaitChip({ r }: { r: Pick<ErRegistration, "status" | "triageCategory" | "arrivalTime"> }) {
  const m = minsSince(r.arrivalTime);
  const waiting = r.status === "waiting" || r.status === "triaged";
  const over = isOverdue(r);
  const target = r.triageCategory ? TRIAGE[r.triageCategory].targetMin : TRIAGE_DELAY_MIN;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold"
      style={{ color: over ? TONES.bad : undefined, opacity: over ? 1 : 0.7 }}
      title={waiting ? `Target: ${target ? `${target} min` : "immediate"}` : "Time in department"}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: over ? TONES.bad : waiting ? TONES.warn : TONES.ok }} />
      {waiting ? "Waiting" : "In ED"} {fmtMins(m)}
      {over && <span className="text-[10px] uppercase tracking-wide">· over target</span>}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Rows & cards                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export function RegistrationRow({ r, href, action }: { r: ErRegistration; href?: string; action?: ReactNode }) {
  const loc = r.location;
  return (
    <RowLink href={href || `${BASE}/tracker/${r._id}`}>
      <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-3.5">
          <TriageBadge category={r.triageCategory} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{regName(r)}</p>
            <p className="truncate text-xs opacity-50">{regMeta(r) || erLabel(r.arrivalMode)}</p>
          </div>
        </div>
        <p className="line-clamp-2 text-xs opacity-70">{r.chiefComplaint}</p>
        <div className="space-y-0.5">
          <WaitChip r={r} />
          {loc && <p className="text-[11px] opacity-50">{loc}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <ErPill value={r.status} />
        </div>
      </div>
    </RowLink>
  );
}

/** Read-only patient summary shown above an action form. */
export function RegContext({ r }: { r?: ErRegistration | null }) {
  if (!r) return null;
  return (
    <Card className="flex flex-wrap items-center gap-4">
      <TriageBadge category={r.triageCategory} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{regName(r)}</p>
        <p className="truncate text-xs opacity-55">{[regMeta(r), `Arrived ${new Date(r.arrivalTime).toLocaleString()}`].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 text-sm opacity-75">{r.chiefComplaint}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <ErPill value={r.status} />
        <WaitChip r={r} />
      </div>
    </Card>
  );
}

/** Coloured GCS chip (≤8 severe, 9–12 moderate, 13–15 mild). */
export function GcsChip({ gcs }: { gcs?: number | null }) {
  if (gcs === undefined || gcs === null) return <span className="text-xs opacity-45">GCS —</span>;
  const c = gcs <= 8 ? TONES.bad : gcs <= 12 ? "#f97316" : TONES.ok;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${c}1f`, color: c }}>
      GCS {gcs}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Ambulance form (shared by "new" and "edit")                                */
/* ─────────────────────────────────────────────────────────────────────────── */

export const dispatchInitial = (d?: Partial<ErDispatch> | null, destination = "") => ({
  callerName: d?.callerName || "",
  callerPhone: d?.callerPhone || "",
  pickupAddress: d?.pickupAddress || "",
  destination: d?.destination ?? destination,
  chiefComplaint: d?.chiefComplaint || "",
  priority: d?.priority || "urgent",
  vehicle: d?.vehicle || "",
  crew: (d?.crew || []).join(", "),
  notes: d?.notes || "",
  linkedRegistrationId: typeof d?.linkedRegistration === "string" ? d.linkedRegistration : d?.linkedRegistration?._id || "",
});

export const dispatchPayload = (v: any) => ({
  callerName: v.callerName?.trim() || undefined,
  callerPhone: v.callerPhone?.trim() || undefined,
  pickupAddress: v.pickupAddress.trim(),
  destination: v.destination?.trim() || undefined,
  chiefComplaint: v.chiefComplaint?.trim() || undefined,
  priority: v.priority || undefined,
  vehicle: v.vehicle?.trim() || undefined,
  crew: String(v.crew || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean),
  notes: v.notes?.trim() || undefined,
});

export const dispatchSections = (linkOptions?: { label: string; value: string }[]): SectionSpec[] => [
  {
    title: "Call",
    fields: [
      { key: "callerName", label: "Caller name" },
      { key: "callerPhone", label: "Caller phone", type: "tel" },
      { key: "pickupAddress", label: "Pickup address", required: true, span: 2, hint: "Street, landmark or GPS description the crew can find." },
      { key: "chiefComplaint", label: "What happened", span: 2, placeholder: "e.g. Collapsed at a bus stop, not responding" },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ER.priorities.map((p) => ({ value: p, label: erLabel(p) })),
      },
      { key: "destination", label: "Destination" },
    ],
  },
  {
    title: "Vehicle & crew",
    desc: "A vehicle must be assigned before the call can be dispatched.",
    fields: [
      { key: "vehicle", label: "Vehicle", placeholder: "e.g. AMB-02" },
      { key: "crew", label: "Crew (comma separated)", placeholder: "e.g. Nurse Ada, Paramedic Sule, Driver Musa" },
    ],
  },
  ...(linkOptions
    ? ([
        {
          title: "ER visit",
          desc: "Link the call to the patient's emergency registration once they arrive.",
          cols: 1,
          fields: [{ key: "linkedRegistrationId", label: "Linked ER patient", type: "select", searchable: true, options: [{ value: "", label: "Not linked" }, ...linkOptions] }],
        },
      ] as SectionSpec[])
    : []),
  { cols: 1, fields: [{ key: "notes", label: "Notes", type: "textarea" }] },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Medico-legal form (shared by "new" and "edit")                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export const mlInitial = (m?: { caseType?: string; policeNotified?: boolean; policeStation?: string; crimeNumber?: string; findings?: string; evidenceCollected?: string; notes?: string } | null) => {
  const known = !m?.caseType || ER.mlCaseTypes.includes(m.caseType);
  return {
    caseType: m?.caseType ? (known ? m.caseType : "Other") : "",
    caseTypeOther: m?.caseType && !known ? m.caseType : "",
    policeNotified: !!m?.policeNotified,
    policeStation: m?.policeStation || "",
    crimeNumber: m?.crimeNumber || "",
    findings: m?.findings || "",
    evidenceCollected: m?.evidenceCollected || "",
    notes: m?.notes || "",
  };
};

export const mlPayload = (v: any) => ({
  caseType: (v.caseType === "Other" ? v.caseTypeOther : v.caseType).trim(),
  policeNotified: !!v.policeNotified,
  policeStation: v.policeNotified ? v.policeStation?.trim() || undefined : undefined,
  crimeNumber: v.policeNotified ? v.crimeNumber?.trim() || undefined : undefined,
  findings: v.findings?.trim() || undefined,
  evidenceCollected: v.evidenceCollected?.trim() || undefined,
  notes: v.notes?.trim() || undefined,
});

export const mlSections = (): SectionSpec[] => [
  {
    title: "Case",
    fields: [
      { key: "caseType", label: "Case type", type: "select", required: true, options: [...ER.mlCaseTypes, "Other"].map((c) => ({ value: c, label: c })) },
      { key: "caseTypeOther", label: "Specify case type", required: true, show: (v) => v.caseType === "Other" },
    ],
  },
  {
    title: "Police",
    fields: [
      { key: "policeNotified", type: "toggle", label: "Police notified", span: 2 },
      { key: "policeStation", label: "Police station", show: (v) => v.policeNotified },
      { key: "crimeNumber", label: "Crime / case number", show: (v) => v.policeNotified },
    ],
  },
  {
    title: "Documentation",
    desc: "Record facts objectively. This may be used as legal evidence.",
    cols: 1,
    fields: [
      { key: "findings", label: "Clinical findings", type: "textarea", rows: 5 },
      { key: "evidenceCollected", label: "Evidence collected", type: "textarea", placeholder: "e.g. Clothing bagged and labelled, swabs, photographs, bullet retrieved" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
];
