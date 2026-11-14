"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/api/hooks";
import { fetchTheaterRecords, fetchTheaterSchedule, type TheatreRecordKind } from "@/api/slices/theaterSlice";
import { useTheater } from "@/hooks/useTheater";
import {
  Banner, Btn, Empty, Header, Loader, Page, Pill, Pills, RowLink, SectionCard, SpecForm, fmtDateTime, idOf, nameOf,
  useForm, useUI, type ConfirmSpec, type FieldSpec, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export * from "@/components/blood-bank/bb-ui";

export const TBASE = "/dashboard/theater";

/* ───────────────────────── enums (server accepts free text for most) ───────────────────────── */

export const TH = {
  priorities: ["elective", "urgent", "emergency"],
  caseStatuses: ["scheduled", "pre-op", "in-theatre", "recovery", "completed", "cancelled"],
  requestStatuses: ["requested", "scheduled", "in-progress", "completed", "cancelled"],
  fitness: ["fit", "fit-with-optimisation", "unfit"],
  asa: ["I", "II", "III", "IV", "V", "VI"],
  airway: ["Mallampati I", "Mallampati II", "Mallampati III", "Mallampati IV", "Anticipated difficult airway"],
  anaesthesiaTypes: ["General", "Spinal", "Epidural", "Combined spinal-epidural", "Regional block", "Local", "Sedation"],
  roomTypes: ["General", "Orthopaedic", "Obstetric / C-section", "Cardiothoracic", "Neurosurgery", "Day-case", "Emergency", "Minor procedures"],
  countTypes: ["swab", "instrument", "needle", "other"],
  severities: ["minor", "moderate", "major", "death"],
  cssdMethods: ["Steam autoclave", "Ethylene oxide", "Low-temperature plasma", "Dry heat", "Chemical (high-level disinfection)"],
};

export const opts = (a: readonly string[]) => a.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, " ") }));
export const plain = (a: readonly string[]) => a.map((v) => ({ value: v, label: v }));

/* ───────────────────────── helpers ───────────────────────── */

export const patientLabel = (p: any) => {
  if (!p || typeof p === "string") return "Patient";
  return `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Patient";
};
export const caseLabel = (c: any) => `${patientLabel(c.patient)} · ${c.procedureName} · ${fmtDateTime(c.scheduledStart)}`;
export const roomLabel = (r: any) => (r && typeof r === "object" ? `${r.name || ""}${r.code ? ` (${r.code})` : ""}` : "Room");
export const isToday = (d?: string) => !!d && new Date(d).toDateString() === new Date().toDateString();
export const dur = (a?: string, b?: string) => (a && b ? Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000)) : undefined);

export function useTH() {
  const th = useTheater();
  const router = useRouter();
  const u = useUI();
  return { ...th, router, ...u };
}

/** Loads the full theatre schedule into the slice once. */
export function useSchedule() {
  const th = useTH();
  const { facilityId, act } = th;
  useEffect(() => {
    if (facilityId) act(fetchTheaterSchedule({ facilityId }), false);
  }, [facilityId, act]);
  return { ...th, cases: th.theater.schedule as any[] };
}

/* ───────────────────────── template 1: case-centric record index ───────────────────────── */

/**
 * List page for a clinical step (pre-op, consent, counts…).
 *  1. "Cases waiting for this step" comes from the schedule, so it works on the current server.
 *  2. "Recorded" comes from GET /records/:kind (optional read-endpoints patch). If the server does not
 *     have it yet we say so instead of failing.
 */
export function RecordIndex({
  icon, title, subtitle, kind, stages, stageTitle, newPath, actionLabel, headerLabel, renderRecord, recordTitle = "Recorded", rowHref, recordFilter, recordHref,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  kind?: TheatreRecordKind;
  stages: string[];
  stageTitle: string;
  newPath: string;
  actionLabel: string;
  headerLabel?: string;
  renderRecord?: (r: any) => ReactNode;
  recordTitle?: string;
  rowHref?: (c: any) => string;
  recordFilter?: (r: any) => boolean;
  recordHref?: (r: any) => string;
}) {
  const { facilityId, activeFacility, theater } = useTH();
  const dispatch = useAppDispatch();
  const { cases } = useSchedule();
  const [missing, setMissing] = useState(false);
  const [q, setQ] = useState("all");

  useEffect(() => {
    if (!facilityId || !kind) return;
    setMissing(false);
    dispatch(fetchTheaterRecords({ facilityId, kind }))
      .unwrap()
      .catch(() => setMissing(true));
  }, [facilityId, kind, dispatch]);

  const waiting = useMemo(
    () => cases.filter((c) => stages.includes(c.status) && (q === "all" || (q === "today" && isToday(c.scheduledStart)))),
    [cases, stages, q]
  );
  const records: any[] = ((kind && theater.records[kind]) || []).filter((r: any) => (recordFilter ? recordFilter(r) : true));

  return (
    <Page>
      <Header icon={icon} title={title} subtitle={subtitle || activeFacility?.name} actions={headerLabel ? <Btn href={`${TBASE}${newPath}`}>{headerLabel}</Btn> : undefined} />
      <> 
        <Pills value={q} onChange={setQ} options={[{ value: "all", label: "All dates" }, { value: "today", label: "Today" }]} />
        {theater.listLoading && cases.length === 0 ? <Loader /> : waiting.length === 0 ? (
          <Empty>No cases are at this stage right now.</Empty>
        ) : (
          <div className="space-y-3">
            {waiting.map((c) => (
              <RowLink key={c._id} href={rowHref ? rowHref(c) : `${TBASE}${newPath}?caseId=${c._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(c.patient)}</p><p className="truncate text-xs opacity-55">{c.procedureName}</p></div>
                  <p className="text-xs opacity-60">{roomLabel(c.room)}<br />{fmtDateTime(c.scheduledStart)}</p>
                  <p className="text-xs opacity-60">Surgeon: {nameOf(c.surgeon)}</p>
                  <div className="flex items-center gap-2"><Pill value={c.status} /><span className="text-xs font-semibold opacity-70">{actionLabel}</span></div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>

      {kind && renderRecord && (
        <> 
          {missing ? (
            <Banner tone="info">Record history needs the optional read endpoints on the server (see server/theater-read-endpoints.patch.md). You can still add records above.</Banner>
          ) : records.length === 0 ? (
            <Empty>Nothing recorded yet.</Empty>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <RowLink key={r._id} href={recordHref ? recordHref(r) : `${TBASE}/schedule/${idOf(r.theatreCase)}`}>
                  {renderRecord(r)}
                </RowLink>
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
}

/* ───────────────────────── template 2: new record for a case ───────────────────────── */

type CaseFormProps = {
  title: string;
  subtitle?: ReactNode;
  backHref: string;
  initial: Record<string, any>;
  sections: (ctx: { caseField: FieldSpec; selected: any; v: any }) => SectionSpec[];
  submit: (v: any, selected: any) => Promise<unknown>;
  submitLabel: string;
  confirm?: ConfirmSpec | ((v: any) => ConfirmSpec | null | undefined);
  danger?: boolean;
  statuses?: string[];
  afterHref?: (caseId: string) => string;
  canSubmit?: (v: any) => boolean;
  top?: ReactNode | ((v: any, selected: any) => ReactNode);
};

function CaseFormInner(p: CaseFormProps) {
  const sp = useSearchParams();
  const { cases } = useSchedule();
  const { theater } = useTH();
  const form = useForm<any>({ caseId: sp.get("caseId") || "", ...p.initial });
  const pool = cases.filter((c) => c.status !== "cancelled" && (!p.statuses || p.statuses.includes(c.status) || c._id === form.v.caseId));
  const selected = cases.find((c) => c._id === form.v.caseId);

  const caseField: FieldSpec = {
    key: "caseId", label: "Surgical case", type: "select", required: true, searchable: true,
    options: pool.map((c) => ({ value: c._id, label: caseLabel(c) })),
    hint: pool.length === 0 ? "No eligible cases. Schedule a case first." : undefined,
  };

  return (
    <SpecForm
      form={form}
      sections={p.sections({ caseField, selected, v: form.v })}
      backHref={p.backHref}
      title={p.title}
      subtitle={p.subtitle}
      submitLabel={p.submitLabel}
      saving={theater.saving}
      confirm={p.confirm}
      danger={p.danger}
      top={typeof p.top === "function" ? p.top(form.v, selected) : p.top}
      canSubmit={!!selected && (p.canSubmit ? p.canSubmit(form.v) : true)}
      onSubmit={async (v) => {
        await p.submit(v, selected);
      }}
    />
  );
}

export function CaseFormPage(p: CaseFormProps) {
  return (
    <Suspense fallback={<Page narrow><Loader /></Page>}>
      <CaseFormInner {...p} />
    </Suspense>
  );
}

/** Small helper so every page uses the same push-after-save behaviour. */
export function useAfterSave() {
  const { router } = useTH();
  return (href: string) => router.push(href);
}

export { Link };
