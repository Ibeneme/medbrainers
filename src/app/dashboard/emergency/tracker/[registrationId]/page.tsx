"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { fetchErRegistration } from "@/api/slices";
import type { ErRegistrationDetail } from "@/api/slices/emergencySlice";
import {
  BASE, BackHeader, Btn, Card, DISPOSITION_LABEL, ER, ErPill, KV, KVGrid, Loader, NotFound, Page, TriageBadge, WaitChip,
  erLabel, fmtDateTime, nameOf, patientOfReg, refId, regMeta, regName, useAutoRefresh, useER, useLoad, useTick,
} from "@/components/emergency/er-ui";

export default function ErVisitPage() {
  const { registrationId } = useParams() as { registrationId: string };
  const er = useER();
  const { facilityId } = er;
  useTick();
  const { data: r, loading, reload } = useLoad<ErRegistrationDetail>(er, (fid) => fetchErRegistration({ facilityId: fid, registrationId }), [registrationId]);
  const refresh = useCallback(() => reload(true), [reload]);
  useAutoRefresh(refresh, !!facilityId && !!r && ER.activeStatuses.includes(r.status), 30000);

  if (loading) return <Page><Loader text="Loading ER visit…" /></Page>;
  if (!r) return <Page><NotFound what="ER visit" href={`${BASE}/tracker`} /></Page>;

  const active = ER.activeStatuses.includes(r.status);
  const p = patientOfReg(r);
  const allergies = p?.allergies || [];
  const reg = `registrationId=${r._id}`;
  const d = r.disposition;
  const wardReq = d?.admissionRequest && typeof d.admissionRequest !== "string" ? d.admissionRequest : null;
  const ward = d?.destinationWard && typeof d.destinationWard !== "string" ? d.destinationWard : null;

  return (
    <Page>
      <BackHeader
        href={`${BASE}/tracker`}
        title={regName(r)}
        subtitle={regMeta(r) || "Unidentified patient"}
        right={active ? (<><Btn href={`${BASE}/triage/${r._id}`} tone="ghost">{r.triageCategory ? "Re-triage" : "Triage"}</Btn><Btn href={`${BASE}/tracker/${r._id}/status`}>Update status</Btn></>) : undefined}
      />

      {allergies.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#ef44441f", color: "#ef4444" }}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>Allergies: {allergies.map((a) => `${a.substance}${a.reaction ? ` (${a.reaction})` : ""}`).join(", ")}</span>
        </div>
      )}

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <TriageBadge category={r.triageCategory} size="lg" />
          <ErPill value={r.status} />
          <WaitChip r={r} />
        </div>
        <p className="text-base">{r.chiefComplaint}</p>
        <KVGrid>
          <KV label="Arrived">{fmtDateTime(r.arrivalTime)}</KV>
          <KV label="Arrival mode">{erLabel(r.arrivalMode)}</KV>
          <KV label="Location">{r.location}</KV>
          <KV label="Attending clinician">{r.attendingClinician ? nameOf(r.attendingClinician) : undefined}</KV>
          <KV label="Triaged">{r.triageTime ? `${fmtDateTime(r.triageTime)} · ${nameOf(r.triagedBy)}` : undefined}</KV>
          <KV label="Registered by">{nameOf(r.registeredBy)}</KV>
        </KVGrid>
        {r.triageNotes && <KV label="Triage notes"><p className="whitespace-pre-wrap">{r.triageNotes}</p></KV>}
        {r.notes && <KV label="Notes"><p className="whitespace-pre-wrap">{r.notes}</p></KV>}
      </Card>

      {active && (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Next steps</h2>
          <div className="flex flex-wrap gap-2.5">
            <Btn href={`${BASE}/orders/lab?${reg}`} tone="ghost">Order labs</Btn>
            <Btn href={`${BASE}/orders/imaging?${reg}`} tone="ghost">Order imaging</Btn>
            {refId(r.patient) && <Btn href={`/dashboard/pharmacy/prescriptions/new?patients=${encodeURIComponent(refId(r.patient))}`} tone="ghost">Prescribe</Btn>}
            {r.trauma ? <Btn href={`${BASE}/trauma/${r.trauma._id}`} tone="ghost">Trauma case</Btn> : <Btn href={`${BASE}/trauma/new?${reg}`} tone="ghost">Open trauma case</Btn>}
            <Btn href={`${BASE}/medico-legal/new?${reg}`} tone="ghost">Medico-legal case</Btn>
          </div>
          <div className="flex flex-wrap gap-2.5 border-t pt-4" style={{ borderColor: "rgba(128,128,128,0.2)" }}>
            <Btn href={`${BASE}/admissions/new?${reg}`}>Admit to ward</Btn>
            <Btn href={`${BASE}/referrals/new?${reg}`} tone="ghost">Refer / transfer</Btn>
            <Btn href={`${BASE}/discharges/new?${reg}`} tone="ghost">Discharge / other</Btn>
          </div>
        </Card>
      )}

      {(r.trauma || (r.medicoLegal?.length ?? 0) > 0 || r.dispatch) && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Linked records</h2>
          {r.trauma && (
            <Link href={`${BASE}/trauma/${r.trauma._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
              <span><b>Trauma case</b> · {r.trauma.mechanism || "mechanism not recorded"}</span>
              <span className="text-xs opacity-60">{r.trauma.gcs ? `GCS ${r.trauma.gcs}` : ""}</span>
            </Link>
          )}
          {r.medicoLegal?.map((m) => (
            <Link key={m._id} href={`${BASE}/medico-legal/${m._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
              <span><b>Medico-legal</b> · {m.caseType}</span>
              <ErPill tone={m.policeNotified ? "ok" : "warn"}>{m.policeNotified ? "Police notified" : "Police not notified"}</ErPill>
            </Link>
          ))}
          {r.dispatch && (
            <Link href={`${BASE}/ambulance/${r.dispatch._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
              <span><b>Ambulance</b> · {r.dispatch.vehicle || "vehicle not recorded"} from {r.dispatch.pickupAddress}</span>
              <ErPill value={r.dispatch.status} />
            </Link>
          )}
        </Card>
      )}

      {d && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Outcome</h2>
            <ErPill value={r.status}>{DISPOSITION_LABEL[d.type] || erLabel(d.type)}</ErPill>
            {wardReq && <ErPill value={wardReq.status}>{wardReq.status === "accepted" ? `Bed ${wardReq.bedCode || "assigned"}` : `Ward request ${wardReq.status}`}</ErPill>}
          </div>
          <KVGrid>
            <KV label="Time">{fmtDateTime(d.dispositionTime)}</KV>
            <KV label="Recorded by">{nameOf(d.by)}</KV>
            <KV label="Ward">{ward ? `${ward.name}${ward.code ? ` (${ward.code})` : ""}` : undefined}</KV>
            <KV label="Receiving facility">{d.destinationFacility}</KV>
          </KVGrid>
          {d.reason && <KV label="Reason"><p className="whitespace-pre-wrap">{d.reason}</p></KV>}
          {d.summary && <KV label="Summary"><p className="whitespace-pre-wrap">{d.summary}</p></KV>}
        </Card>
      )}
    </Page>
  );
}
