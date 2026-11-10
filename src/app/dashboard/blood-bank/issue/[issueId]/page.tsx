"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchIssues } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill, PRODUCT_LABEL,
  fmtDateTime, idOf, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function IssueDetailPage() {
  const { issueId } = useParams() as { issueId: string };
  const { facilityId, act, bloodBank } = useBB();
  useEffect(() => { if (facilityId) act(fetchIssues({ facilityId, limit: 500 }), false); }, [facilityId, act]);
  const i: any = bloodBank.issues.find((x) => x._id === issueId);
  if (!i) return <Page>{bloodBank.listLoading || !facilityId ? <Loader /> : <NotFound what="Issue" href={`${BASE}/issue`} />}</Page>;
  const retro = i.retrospectiveCrossmatch;
  return (
    <Page>
      <BackHeader href={`${BASE}/issue`} title={<span className="font-mono">{i.issueNumber}</span>} subtitle={fmtDateTime(i.issuedAt)}
        right={i.status === "issued" && (<><Btn href={`${BASE}/transfusions/new?issueId=${issueId}`}>Start transfusion</Btn><Btn href={`${BASE}/issue/${issueId}/return`} tone="ghost">Return unit</Btn></>)} />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <GroupBadge group={i.bloodGroup} size="lg" />
          <div className="flex gap-2">{i.emergency && <Pill value="emergency" />}<Pill value={i.status} /></div>
        </div>
        <KVGrid>
          <KV label="Patient">{nameOf(i.patient)}</KV>
          <KV label="Request"><Link href={`${BASE}/requests/${idOf(i.request)}`} className="underline">{i.request?.requestNumber || "View request"}</Link></KV>
          <KV label="Unit"><Link href={`${BASE}/inventory/${idOf(i.unit)}`} className="font-mono underline">{i.unitNumber}</Link></KV>
          <KV label="Product">{PRODUCT_LABEL[i.product]}</KV>
          <KV label="Issued by">{nameOf(i.issuedBy)}</KV>
          <KV label="Issued to">{i.issuedTo}</KV>
          <KV label="Destination">{i.destination}</KV>
        </KVGrid>
        {i.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{i.notes}</p>}
      </Card>
      {i.emergency && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Emergency release</h2>
          <p className="text-sm opacity-80">{i.emergency.reason}</p>
          {retro?.required && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" style={{ backgroundColor: retro.done ? "#10b9811f" : "#f59e0b1f" }}>
              <p className="text-sm font-medium">{retro.done ? `Retrospective crossmatch ${retro.result} · ${fmtDateTime(retro.doneAt)}` : "Retrospective crossmatch still outstanding"}</p>
              {!retro.done && <Btn href={`${BASE}/issue/${issueId}/retrospective`}>Record result</Btn>}
            </div>
          )}
        </Card>
      )}
      {i.returned && (
        <Card className="space-y-2"><h2 className="text-sm font-semibold">Returned</h2><p className="text-sm">{fmtDateTime(i.returned.at)} · {i.returned.reason} · <Pill value={i.returned.outcome} /></p></Card>
      )}
    </Page>
  );
}
