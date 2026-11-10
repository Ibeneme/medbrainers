"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cancelRequest, closeRequest, fetchRequestById, receiveSample, suggestUnits } from "@/api/slices";
import {
  BASE, BackHeader, Bar, Btn, Card, DataTable, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill, PRODUCT_LABEL,
  fmtDate, fmtDateTime, itemsSummary, label, nameOf, useBB, useConfirm, useLoad,
} from "@/components/blood-bank/bb-ui";

export default function RequestDetailPage() {
  const { requestId } = useParams() as { requestId: string };
  const bb = useBB();
  const { facilityId, act, bloodBank } = bb;
  const { ask, node } = useConfirm();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const r: any = bloodBank.activeRequest?._id === requestId ? bloodBank.activeRequest : null;

  const refresh = async () => { const x = await act(fetchRequestById({ facilityId, requestId }), false); setState(x ? "ready" : "missing"); };
  useEffect(() => { if (facilityId) { setState("loading"); refresh(); } /* eslint-disable-next-line */ }, [facilityId, requestId]);

  const grouped = r?.patientGrouping?.status === "confirmed";
  const { data: sug } = useLoad<any>(bb, (f) => suggestUnits({ facilityId: f, requestId }), [requestId, r?.status, grouped]);

  if (state === "loading" || (!r && state === "ready")) return <Page><Loader text="Loading request…" /></Page>;
  if (!r) return <Page><NotFound what="Request" href={`${BASE}/requests`} /></Page>;

  const closed = ["completed", "rejected", "cancelled"].includes(r.status);
  const p = r.progress || { requested: 0, crossmatched: 0, issued: 0, transfused: 0 };
  const act2 = (title: string, message: string, fn: () => Promise<unknown>, tone: "danger" | "primary" = "primary") =>
    ask({ title, message, tone, confirmLabel: title, onConfirm: async () => { await fn(); await refresh(); } });

  return (
    <Page>
      <BackHeader
        href={`${BASE}/requests`}
        title={<span className="font-mono">{r.requestNumber}</span>}
        subtitle={`${nameOf(r.patient)} · ${r.patient?.mrn || ""}`}
        right={!closed && (
          <>
            {r.status === "pending" && <Btn tone="ghost" onClick={() => act2("Receive sample", "Confirm the patient's blood sample has arrived in the lab and is correctly labelled.", () => act(receiveSample({ facilityId, requestId }), "Sample received"))}>Receive sample</Btn>}
            <Btn href={`${BASE}/requests/${requestId}/notes/new`} tone="card">Add note</Btn>
          </>
        )}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2"><Pill value={r.urgency} /><Pill value={r.status} /></div>
          <p className="text-xs opacity-60">{p.crossmatched} crossmatched · {p.issued} issued · {p.transfused} transfused of {p.requested}</p>
        </div>
        <Bar pct={p.requested ? (p.transfused / p.requested) * 100 : 0} />
        <KVGrid>
          <KV label="Products">{itemsSummary(r.items)}</KV>
          <KV label="Required by">{fmtDateTime(r.requiredAt)}</KV>
          <KV label="Location">{r.location}</KV>
          <KV label="Indication">{r.indication}</KV>
          <KV label="Diagnosis">{r.diagnosis}</KV>
          <KV label="Requested by">{nameOf(r.requestedBy)}</KV>
          <KV label="Sample received">{r.sampleReceivedAt ? `${fmtDateTime(r.sampleReceivedAt)} · ${nameOf(r.sampleReceivedBy)}` : "Not yet"}</KV>
          <KV label="Patient file group">{r.patient?.bloodGroup}</KV>
          <KV label="Historical group">{r.historicalGroup}</KV>
        </KVGrid>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Patient blood group</h2>
          <Pill value={r.patientGrouping?.status || "pending"} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <GroupBadge group={r.patientGrouping?.group} size="lg" />
          <p className="text-xs opacity-60">Antibody screen: {label(r.patientGrouping?.antibodyScreen)}</p>
          {!closed && r.status !== "pending" && !grouped && <Btn href={`${BASE}/grouping/requests/${requestId}`} tone="ghost">{r.patientGrouping?.status === "recorded" ? "Confirm grouping" : "Record grouping"}</Btn>}
        </div>
      </Card>

      {!closed && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Next steps</h2>
            <div className="flex flex-wrap gap-2">
              {grouped && <Btn href={`${BASE}/crossmatch/new?requestId=${requestId}`}>Crossmatch units</Btn>}
              <Btn href={`${BASE}/issue/new?requestId=${requestId}`} tone="ghost">Issue units</Btn>
              {r.urgency === "emergency" && <Btn href={`${BASE}/issue/new?requestId=${requestId}&emergency=1`} tone="danger">Emergency release</Btn>}
            </div>
          </div>
          {sug?.items?.length ? sug.items.map((it: any) => (
            <div key={it.product} className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: bb.ui.inner }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{PRODUCT_LABEL[it.product]} · {it.stillNeeded} of {it.requested} still needed</p>
                <p className="text-xs opacity-55">Compatible: {it.compatibleGroups?.join(", ") || "—"}</p>
              </div>
              {it.units.length === 0 ? <p className="text-xs opacity-55">{sug.grouped ? "No compatible units available." : "Confirm the patient group to see compatible units."}</p> : (
                <div className="flex flex-wrap gap-2">
                  {it.units.slice(0, 8).map((u: any) => (
                    <Link key={u._id} href={`${BASE}/crossmatch/new?requestId=${requestId}&unitId=${u._id}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: bb.ui.card }} title={u.compatibility?.warning || ""}>
                      <GroupBadge group={u.bloodGroup} size="sm" /><span className="font-mono">{u.unitNumber}</span><span className="opacity-55">exp {fmtDate(u.expiryDate)}</span>
                      {u.compatibility?.warning && <Pill tone="warn">Note</Pill>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )) : null}
          {!sug?.grouped && sug && <p className="text-xs opacity-60">Patient group not confirmed – crossmatch is not possible yet. For life-threatening bleeding use emergency release.</p>}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Crossmatches</h2>
        <DataTable head={["No.", "Unit", "Method", "Result", "Status"]} empty="None yet." rows={(r.crossmatches || []).map((x: any) => [<Link key="n" href={`${BASE}/crossmatch/${x._id}`} className="font-mono text-xs underline">{x.crossmatchNumber}</Link>, x.unitNumber, label(x.method), <Pill key="r" value={x.result} />, <Pill key="s" value={x.status} />])} />
        <h2 className="pt-2 text-lg font-semibold tracking-tight">Issues</h2>
        <DataTable head={["No.", "Unit", "Issued to", "When", "Status"]} empty="Nothing issued." rows={(r.issues || []).map((x: any) => [<Link key="n" href={`${BASE}/issue/${x._id}`} className="font-mono text-xs underline">{x.issueNumber}</Link>, x.unitNumber, x.issuedTo, fmtDateTime(x.issuedAt), <Pill key="s" value={x.status} />])} />
        <h2 className="pt-2 text-lg font-semibold tracking-tight">Transfusions</h2>
        <DataTable head={["No.", "Unit", "Started", "Status"]} empty="No transfusions yet." rows={(r.transfusions || []).map((x: any) => [<Link key="n" href={`${BASE}/transfusions/${x._id}`} className="font-mono text-xs underline">{x.transfusionNumber}</Link>, x.unitNumber, fmtDateTime(x.startedAt), <Pill key="s" value={x.status} />])} />
      </Card>

      {r.notesList?.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          {r.notesList.map((n: any, i: number) => (
            <div key={i} className="rounded-2xl p-4 text-sm" style={{ backgroundColor: bb.ui.inner }}>
              <p className="whitespace-pre-wrap">{n.text}</p>
              <p className="mt-1 text-[11px] opacity-50">{nameOf(n.author)} · {fmtDateTime(n.createdAt)}</p>
            </div>
          ))}
        </Card>
      )}

      {!closed && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm opacity-65">Finished with this request?</p>
          <div className="flex flex-wrap gap-2">
            {["issued", "partially_issued"].includes(r.status) && <Btn tone="ghost" onClick={() => act2("Close request", "Mark this request as completed. No more units can be crossmatched or issued for it.", () => act(closeRequest({ facilityId, requestId }), "Request closed"))}>Close request</Btn>}
            {r.status === "pending" || r.status === "sample_received" || r.status === "crossmatching" || r.status === "ready" ? <Btn tone="ghost" onClick={() => act2("Cancel request", "Cancel this request? Any reserved units are released back to stock.", () => act(cancelRequest({ facilityId, requestId }), "Request cancelled"), "danger")}>Cancel request</Btn> : null}
            <Btn href={`${BASE}/requests/${requestId}/reject`} tone="danger">Reject request</Btn>
          </div>
        </Card>
      )}
      {node}
    </Page>
  );
}
