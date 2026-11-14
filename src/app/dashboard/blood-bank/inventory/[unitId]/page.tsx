"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchUnitById, releaseUnit } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, DataTable, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill, PRODUCT_LABEL,
  daysLeft, fmtDate, fmtDateTime, idOf, label, nameOf, useBB, useConfirm,
} from "@/components/blood-bank/bb-ui";

export default function UnitDetailPage() {
  const { unitId } = useParams() as { unitId: string };
  const { facilityId, act, bloodBank } = useBB();
  const { ask, node } = useConfirm();
  const u: any = bloodBank.activeUnit?._id === unitId ? bloodBank.activeUnit : null;

  useEffect(() => {
    if (facilityId) act(fetchUnitById({ facilityId, unitId }), false);
  }, [facilityId, unitId, act]);

  if (!u) return <Page>{bloodBank.detailLoading ? <Loader text="Loading unit…" /> : <NotFound what="Unit" href={`${BASE}/inventory`} />}</Page>;

  const dl = daysLeft(u.expiryDate);
  const inStock = ["quarantine", "available", "reserved"].includes(u.status);
  const trace = u.trace || {};
  const storage = u.storageUnit;

  return (
    <Page>
      <BackHeader
        href={`${BASE}/inventory`}
        title={<span className="font-mono">{u.unitNumber}</span>}
        subtitle={PRODUCT_LABEL[u.product] || label(u.product)}
        right={
          inStock && (
            <>
              <Btn href={`${BASE}/inventory/${unitId}/storage`} tone="card">Assign storage</Btn>
              {u.status === "quarantine" && (
                <Btn
                  tone="ghost"
                  onClick={() =>
                    ask({
                      title: "Release from quarantine",
                      message: "Release only works when grouping is confirmed and TTI is cleared. The system will refuse if the unit is not yet eligible.",
                      confirmLabel: "Release unit",
                      tone: "primary",
                      onConfirm: async () => { await act(releaseUnit({ facilityId, unitId }), "Unit released"); },
                    })
                  }
                >
                  Release
                </Btn>
              )}
              <Btn href={`${BASE}/inventory/${unitId}/discard`} tone="danger">Discard</Btn>
            </>
          )
        }
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <GroupBadge group={u.bloodGroup} size="lg" />
          <div className="flex flex-wrap gap-2">
            <Pill value={u.status} />
            {u.qcHold?.active && <Pill value="discrepancy">QC hold</Pill>}
            {u.ttiStatus && <Pill tone="mute">TTI</Pill>}
            {u.ttiStatus && <Pill value={u.ttiStatus} />}
          </div>
        </div>
        {u.qcHold?.active && (
          <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#ef44441f" }}>
            <p className="font-semibold">On quality-control hold</p>
            <p className="mt-1 text-xs opacity-75">{u.qcHold.reason} · {nameOf(u.qcHold.by)} · {fmtDateTime(u.qcHold.at)}</p>
          </div>
        )}
        <KVGrid>
          <KV label="Volume">{u.volumeMl} mL</KV>
          <KV label="Collected">{fmtDateTime(u.collectedAt)}</KV>
          <KV label="Expires"><span style={dl !== null && dl <= 3 ? { color: "#ef4444", fontWeight: 600 } : undefined}>{fmtDate(u.expiryDate)}{dl !== null ? ` (${dl < 0 ? "expired" : `${dl} days`})` : ""}</span></KV>
          <KV label="Storage">{storage?.name ? `${storage.name} (${storage.code})` : "Not assigned"}</KV>
          <KV label="Shelf location">{u.location}</KV>
          <KV label="Grouping">{label(u.groupingStatus)}</KV>
          {u.reservedFor?.until && <KV label="Reserved until">{fmtDateTime(u.reservedFor.until)}</KV>}
          {u.donation && <KV label="Donation"><Link href={`${BASE}/donations/${idOf(u.donation)}`} className="underline">{u.donation.donationNumber}</Link></KV>}
          {u.parent && <KV label="Parent unit"><Link href={`${BASE}/inventory/${idOf(u.parent)}`} className="underline">View parent</Link></KV>}
        </KVGrid>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Traceability</h2>
        <DataTable
          head={["Crossmatch", "Patient", "Result", "Status"]}
          empty="Not crossmatched."
          rows={(trace.crossmatches || []).map((x: any) => [
            <Link key="n" href={`${BASE}/crossmatch/${x._id}`} className="font-mono text-xs underline">{x.crossmatchNumber}</Link>,
            nameOf(x.patient), <Pill key="r" value={x.result} />, <Pill key="s" value={x.status} />,
          ])}
        />
        <DataTable
          head={["Issue", "Issued to", "When", "Status"]}
          empty="Not issued."
          rows={(trace.issues || []).map((x: any) => [
            <Link key="n" href={`${BASE}/issue/${x._id}`} className="font-mono text-xs underline">{x.issueNumber}</Link>,
            x.issuedTo, fmtDateTime(x.issuedAt), <Pill key="s" value={x.status} />,
          ])}
        />
        {trace.transfusion && (
          <p className="text-sm">
            Transfused to {nameOf(trace.transfusion.patient)} ·{" "}
            <Link href={`${BASE}/transfusions/${trace.transfusion._id}`} className="font-mono text-xs underline">{trace.transfusion.transfusionNumber}</Link>
          </p>
        )}
        {trace.discard && (
          <p className="text-sm text-red-500">
            Discarded {fmtDateTime(trace.discard.discardedAt)} · {label(trace.discard.reason)} ({trace.discard.discardNumber})
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">History</h2>
        <DataTable
          head={["Status", "When", "By", "Note"]}
          empty="No history."
          rows={[...(u.history || [])].reverse().map((h: any) => [<Pill key="s" value={h.status} />, fmtDateTime(h.at), nameOf(h.by), h.note || "—"])}
        />
      </Card>
      {node}
    </Page>
  );
}
