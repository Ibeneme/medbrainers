"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchTheatreCase, updateCaseStatus, type TheatreCaseStatus } from "@/api/slices/theaterSlice";
import { PRIMARY_COLOR } from "@/constants/colors";
import { BackHeader, Btn, Card, DataTable, KV, KVGrid, Loader, NotFound, Page, Pill, TBASE, dur, fmtDateTime, fmtDuration, label, nameOf, patientLabel, roomLabel, useConfirm, useTH } from "@/components/theater/th-ui";

const NEXT: Record<string, Array<{ to: TheatreCaseStatus; label: string; warn: string }>> = {
  scheduled: [{ to: "pre-op", label: "Move to pre-op", warn: "The patient is being prepared for theatre. Make sure pre-op assessment and consent are done." }],
  "pre-op": [{ to: "in-theatre", label: "Send to theatre", warn: "This starts the operation clock. Confirm consent is signed, the sign-in checklist is complete and the site is marked." }],
  "in-theatre": [],
  recovery: [{ to: "completed", label: "Mark completed", warn: "Mark the case as completed. The linked surgery request is closed too." }],
};

const STEPS = [
  ["Pre-op assessment", "/pre-op/new"], ["Anaesthesia review", "/anaesthesia/new"], ["Consent form", "/consent/new"], ["Safety checklist", "/checklist"],
  ["Operation note", "/operation-notes/new"], ["Anaesthesia record", "/anaesthesia-record/new"], ["Instrument & swab count", "/counts/new"], ["Implants & consumables", "/implants/new"],
  ["Start recovery", "/recovery/new"], ["Post-op orders", "/post-op/new"], ["Report complication", "/complications/new"],
];

export default function CaseHubPage() {
  const { caseId } = useParams() as { caseId: string };
  const { facilityId, act, theater } = useTH();
  const { ask, node } = useConfirm();
  useEffect(() => { if (facilityId) act(fetchTheatreCase({ facilityId, caseId }), false); }, [facilityId, caseId, act]);

  const c: any = theater.activeCase?._id === caseId ? theater.activeCase : null;
  if (!c) return <Page>{theater.detailLoading || !facilityId ? <Loader text="Loading case…" /> : <NotFound what="Case" href={`${TBASE}/schedule`} />}</Page>;

  const move = (to: TheatreCaseStatus, title: string, message: string, tone: "primary" | "danger" = "primary") =>
    ask({ title, message, tone, confirmLabel: title, onConfirm: async () => { await act(updateCaseStatus({ facilityId, caseId, status: to }), `Case ${label(to).toLowerCase()}`); } });
  const next = NEXT[c.status] || [];
  const open = !["completed", "cancelled"].includes(c.status);
  const rec = c.records;
  const p = c.patient || {};

  return (
    <Page>
      <BackHeader href={`${TBASE}/schedule`} title={c.procedureName} subtitle={`${patientLabel(p)} · ${p.mrn || ""}`}
        right={open && (<>
          {next.map((n) => <Btn key={n.to} onClick={() => move(n.to, n.label, n.warn)}>{n.label}</Btn>)}
          {c.status === "in-theatre" && <Btn href={`${TBASE}/recovery/new?caseId=${caseId}`}>Move to recovery</Btn>}
          <Btn tone="danger" onClick={() => move("cancelled", "Cancel case", "Cancel this operation? The room is released and the linked request is cancelled.", "danger")}>Cancel case</Btn>
        </>)} />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-3"><Pill value={c.status} />{c.actualStart && <span className="text-xs opacity-60">Operating time {fmtDuration(dur(c.actualStart, c.actualEnd || new Date().toISOString()))}</span>}</div>
        <KVGrid>
          <KV label="Room">{roomLabel(c.room)}</KV><KV label="Scheduled">{fmtDateTime(c.scheduledStart)}</KV><KV label="Expected end">{fmtDateTime(c.scheduledEnd)}</KV>
          <KV label="Actual start">{fmtDateTime(c.actualStart)}</KV><KV label="Actual end">{fmtDateTime(c.actualEnd)}</KV>
          <KV label="Surgeon">{nameOf(c.surgeon)}</KV><KV label="Anaesthetist">{nameOf(c.anaesthetist)}</KV>
          <KV label="Patient gender">{label(p.gender)}</KV>
        </KVGrid>
        {c.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{c.notes}</p>}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Record for this case</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([t, href]) => (
            <Link key={t} href={`${TBASE}${href}${href === "/checklist" ? `/${caseId}` : `?caseId=${caseId}`}`} className="rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all hover:opacity-80" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
              <span style={{ color: PRIMARY_COLOR }}>+</span> {t}
            </Link>
          ))}
        </div>
      </Card>

      {rec ? (
        <>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Safety readiness</h2>
            <div className="flex flex-wrap gap-2">
              <Pill tone={rec.preOp?.length ? "ok" : "warn"}>{rec.preOp?.length ? "Pre-op done" : "No pre-op"}</Pill>
              <Pill tone={rec.consent?.some((x: any) => x.consentGiven) ? "ok" : "bad"}>{rec.consent?.some((x: any) => x.consentGiven) ? "Consent given" : "No consent"}</Pill>
              <Pill tone={rec.checklist?.signInCompleted ? "ok" : "warn"}>Sign-in</Pill><Pill tone={rec.checklist?.timeOutCompleted ? "ok" : "warn"}>Time-out</Pill><Pill tone={rec.checklist?.signOutCompleted ? "ok" : "warn"}>Sign-out</Pill>
            </div>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Recorded notes</h2>
            <DataTable head={["Record", "Detail", "When"]} empty="Nothing recorded yet." rows={[
              ...(rec.preOp || []).map((x: any) => ["Pre-op", `${label(x.fitnessForSurgery)}${x.asaGrade ? ` · ASA ${x.asaGrade}` : ""}`, fmtDateTime(x.assessedAt)]),
              ...(rec.consent || []).map((x: any) => ["Consent", x.consentGiven ? "Given" : "Declined", fmtDateTime(x.consentDate)]),
              ...(rec.operationNotes || []).map((x: any) => ["Operation note", x.procedurePerformed, fmtDateTime(x.recordedAt)]),
              ...(rec.anaesthesia || []).map((x: any) => ["Anaesthesia", x.anaesthesiaType, fmtDateTime(x.createdAt)]),
              ...(rec.counts || []).map((x: any) => ["Count", `${x.itemName}: ${x.countInitial ?? "-"} → ${x.countFinal ?? "-"} ${x.correct ? "(correct)" : "(DISCREPANCY)"}`, fmtDateTime(x.createdAt)]),
              ...(rec.implants || []).map((x: any) => ["Implant", `${x.implantName} ×${x.quantity}`, fmtDateTime(x.createdAt)]),
              ...(rec.recovery || []).map((x: any) => ["Recovery", x.dischargedAt ? "Discharged" : "In recovery", fmtDateTime(x.arrivedAt)]),
              ...(rec.complications || []).map((x: any) => ["Complication", `${x.description} (${x.severity || "-"})`, fmtDateTime(x.occurredAt)]),
            ]} />
          </Card>
        </>
      ) : (
        <Card className="text-xs opacity-60">Saved records will appear here once the optional read endpoints are added to the server (server/theater-read-endpoints.patch.md). Recording still works without them.</Card>
      )}
      {node}
    </Page>
  );
}
