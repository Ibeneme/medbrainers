"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchCrossmatches } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill, PRODUCT_LABEL,
  fmtDateTime, idOf, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function CrossmatchDetailPage() {
  const { crossmatchId } = useParams() as { crossmatchId: string };
  const { facilityId, act, bloodBank } = useBB();
  useEffect(() => { if (facilityId) act(fetchCrossmatches({ facilityId, limit: 500 }), false); }, [facilityId, act]);
  const x: any = bloodBank.crossmatches.find((c) => c._id === crossmatchId);
  if (!x) return <Page>{bloodBank.listLoading || !facilityId ? <Loader /> : <NotFound what="Crossmatch" href={`${BASE}/crossmatch`} />}</Page>;
  const rid = idOf(x.request);
  return (
    <Page>
      <BackHeader href={`${BASE}/crossmatch`} title={<span className="font-mono">{x.crossmatchNumber}</span>} subtitle={fmtDateTime(x.performedAt)}
        right={x.status === "active" && <Btn href={`${BASE}/crossmatch/${crossmatchId}/void`} tone="danger">Void crossmatch</Btn>} />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <GroupBadge group={x.patientGroup} size="lg" /><span className="opacity-50">→</span><GroupBadge group={x.unitGroup} size="lg" />
          <div className="flex gap-2"><Pill value={x.result} /><Pill value={x.status} /></div>
        </div>
        {x.warning && <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#f59e0b1f" }}>{x.warning}</div>}
        <KVGrid>
          <KV label="Patient">{nameOf(x.patient)}</KV>
          <KV label="Request"><Link href={`${BASE}/requests/${rid}`} className="underline">{x.request?.requestNumber || "View request"}</Link></KV>
          <KV label="Unit"><Link href={`${BASE}/inventory/${idOf(x.unit)}`} className="font-mono underline">{x.unitNumber}</Link></KV>
          <KV label="Product">{PRODUCT_LABEL[x.product]}</KV>
          <KV label="Method">{label(x.method)}</KV>
          <KV label="Performed by">{nameOf(x.performedBy)}</KV>
          <KV label="Valid until">{fmtDateTime(x.validUntil)}</KV>
        </KVGrid>
        {x.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{x.notes}</p>}
        {x.status === "active" && x.result === "compatible" && <Btn href={`${BASE}/issue/new?requestId=${rid}`}>Issue this unit</Btn>}
      </Card>
    </Page>
  );
}
