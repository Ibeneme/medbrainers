"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { fetchReactionById } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, KV, KVGrid, Loader, NotFound, Page, Pill, PRODUCT_LABEL, fmtDateTime, idOf, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function ReactionDetailPage() {
  const { reactionId } = useParams() as { reactionId: string };
  const { facilityId, act, bloodBank } = useBB();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  useEffect(() => {
    if (!facilityId) return;
    setState("loading");
    act(fetchReactionById({ facilityId, reactionId }), false).then((r) => setState(r ? "ready" : "missing"));
  }, [facilityId, reactionId, act]);
  const r: any = bloodBank.activeReaction?._id === reactionId ? bloodBank.activeReaction : null;
  if (state === "loading" || (!r && state === "ready")) return <Page><Loader /></Page>;
  if (!r) return <Page><NotFound what="Reaction" href={`${BASE}/reactions`} /></Page>;
  const inv = r.investigation || {};
  return (
    <Page>
      <BackHeader href={`${BASE}/reactions`} title={<span className="font-mono">{r.reactionNumber}</span>} subtitle={fmtDateTime(r.reportedAt)}
        right={<Btn href={`${BASE}/reactions/${reactionId}/edit`} tone="card"><Pencil size={14} /> {r.status === "closed" ? "View / amend" : "Update & investigate"}</Btn>} />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-2"><Pill value={r.severity} /><Pill value={r.status} />{r.outcome && <Pill value={r.outcome} />}</div>
        <KVGrid>
          <KV label="Patient">{nameOf(r.patient)}</KV>
          <KV label="Type">{label(r.type)}</KV>
          <KV label="Imputability">{label(r.imputability)}</KV>
          <KV label="Unit"><span className="font-mono">{r.unitNumber}</span> · {PRODUCT_LABEL[r.product]}</KV>
          <KV label="Transfusion"><Link href={`${BASE}/transfusions/${idOf(r.transfusion)}`} className="underline">{r.transfusion?.transfusionNumber || "View"}</Link></KV>
          <KV label="Onset">{fmtDateTime(r.onsetAt)}</KV>
          <KV label="Reported by">{nameOf(r.reportedBy)}</KV>
          <KV label="Transfusion stopped">{r.transfusionStopped ? "Yes" : "No"}</KV>
          <KV label="Reported to authority">{r.reportedToAuthority ? "Yes" : "No"}</KV>
        </KVGrid>
        {r.symptoms?.length > 0 && <div className="flex flex-wrap gap-1.5">{r.symptoms.map((s: string) => <span key={s} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "rgba(128,128,128,0.14)" }}>{s}</span>)}</div>}
        {r.actionsTaken && <KV label="Actions taken"><span className="whitespace-pre-wrap">{r.actionsTaken}</span></KV>}
        {r.notes && <KV label="Notes"><span className="whitespace-pre-wrap">{r.notes}</span></KV>}
      </Card>
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Investigation</h2>
        <KVGrid>
          <KV label="Clerical check">{inv.clericalCheckDone ? "Done" : "Not done"}</KV>
          <KV label="Visual haemolysis check">{inv.visualHemolysisCheck ? "Done" : "Not done"}</KV>
          <KV label="Direct Coombs">{label(inv.directCoombs)}</KV>
          <KV label="Repeat grouping / crossmatch">{label(inv.repeatGroupingCrossmatch)}</KV>
          <KV label="Bag culture">{label(inv.bagCulture)}</KV>
          <KV label="Patient culture">{label(inv.patientCulture)}</KV>
        </KVGrid>
        {inv.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{inv.notes}</p>}
        {r.closureNotes && <KV label="Closure notes"><span className="whitespace-pre-wrap">{r.closureNotes}</span></KV>}
      </Card>
    </Page>
  );
}
