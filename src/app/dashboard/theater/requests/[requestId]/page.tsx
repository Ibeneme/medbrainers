"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchSurgeryRequests } from "@/api/slices/theaterSlice";
import { BackHeader, Btn, Card, KV, KVGrid, Loader, NotFound, Page, Pill, TBASE, fmtDate, fmtDateTime, nameOf, patientLabel, useTH } from "@/components/theater/th-ui";

export default function SurgeryRequestDetailPage() {
  const { requestId } = useParams() as { requestId: string };
  const { facilityId, act, theater } = useTH();
  useEffect(() => { if (facilityId) act(fetchSurgeryRequests({ facilityId }), false); }, [facilityId, act]);
  const r = theater.requests.find((x) => x._id === requestId);
  if (!r) return <Page>{theater.listLoading || !facilityId ? <Loader /> : <NotFound what="Request" href={`${TBASE}/requests`} />}</Page>;
  const p: any = r.patient;
  return (
    <Page>
      <BackHeader href={`${TBASE}/requests`} title={r.procedureName} subtitle={`${patientLabel(p)} · ${p?.mrn || ""}`}
        right={r.status === "requested" && <Btn href={`${TBASE}/schedule/new?requestId=${r._id}`}>Schedule this surgery</Btn>} />
      <Card className="space-y-5">
        <div className="flex gap-2"><Pill value={r.priority} /><Pill value={r.status} /></div>
        <KVGrid>
          <KV label="Diagnosis">{r.diagnosis}</KV><KV label="ICD code">{r.icdCode}</KV><KV label="Preferred date">{fmtDate(r.preferredDate)}</KV>
          <KV label="Requested by">{nameOf(r.requestedBy)}</KV><KV label="Requested at">{fmtDateTime(r.requestedAt)}</KV>
        </KVGrid>
        {r.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{r.notes}</p>}
      </Card>
    </Page>
  );
}
