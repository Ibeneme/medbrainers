"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { fetchDonationById } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, DataTable, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill,
  fmtDateTime, idOf, label, nameOf, useBB, PRODUCT_LABEL,
} from "@/components/blood-bank/bb-ui";

export default function DonationDetailPage() {
  const { donationId } = useParams() as { donationId: string };
  const { facilityId, act, bloodBank } = useBB();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  useEffect(() => {
    if (!facilityId) return;
    setState("loading");
    act(fetchDonationById({ facilityId, donationId }), false).then((r) => setState(r ? "ready" : "missing"));
  }, [facilityId, donationId, act]);

  const d: any = bloodBank.activeDonation?._id === donationId ? bloodBank.activeDonation : null;
  if (state === "loading" || (!d && state === "ready")) return <Page><Loader text="Loading donation…" /></Page>;
  if (!d) return <Page><NotFound what="Donation" href={`${BASE}/donations`} /></Page>;

  const g = d.grouping || {};
  const t = d.tti || {};

  return (
    <Page>
      <BackHeader
        href={`${BASE}/donations`}
        title={<span className="font-mono">{d.donationNumber}</span>}
        subtitle={fmtDateTime(d.collectedAt)}
        right={<Btn href={`${BASE}/donations/${d._id}/edit`} tone="card"><Pencil size={14} /> Edit notes</Btn>}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`${BASE}/donors/${idOf(d.donor)}`} className="text-lg font-semibold hover:underline">{nameOf(d.donor)}</Link>
            <p className="font-mono text-xs opacity-50">{d.donor?.donorNumber}</p>
          </div>
          <div className="flex gap-2">
            {d.outcome === "incomplete" && <Pill value="incomplete" />}
            <Pill value={d.status} />
          </div>
        </div>
        <KVGrid cols={4}>
          <KV label="Type">{label(d.donationType)}</KV>
          <KV label="Volume">{d.volumeMl} mL</KV>
          <KV label="Bag">{label(d.bagType)}</KV>
          <KV label="Arm">{label(d.armUsed)}</KV>
          <KV label="Collected by">{nameOf(d.collectedBy)}</KV>
          <KV label="Drive">{d.drive ? <Link href={`${BASE}/drives/${idOf(d.drive)}`} className="underline">{d.drive.name}</Link> : "Walk-in"}</KV>
          <KV label="Screening"><Link href={`${BASE}/screening/${idOf(d.screening)}`} className="underline">View screening</Link></KV>
        </KVGrid>
        {d.adverseReaction?.occurred && (
          <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#f59e0b1f" }}>
            <p className="font-semibold">Donor adverse reaction: {label(d.adverseReaction.type)} ({d.adverseReaction.severity})</p>
            {d.adverseReaction.notes && <p className="mt-1 text-xs opacity-75">{d.adverseReaction.notes}</p>}
          </div>
        )}
        {d.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{d.notes}</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Blood grouping</h2>
            <Pill value={g.status} />
          </div>
          <div className="flex items-center gap-4">
            <GroupBadge group={g.group} size="lg" />
            <div className="text-xs opacity-65">
              <p>Method: {label(g.method)}</p>
              <p>Antibody screen: {label(g.antibodyScreen)}</p>
              <p>Performed by {nameOf(g.performedBy)}</p>
              {g.confirmedBy && <p>Confirmed by {nameOf(g.confirmedBy)}</p>}
            </div>
          </div>
          {g.status !== "confirmed" && <Btn href={`${BASE}/grouping/donations/${d._id}`} tone="ghost" full>{g.status === "pending" ? "Record grouping" : "Review / confirm grouping"}</Btn>}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">TTI screening</h2>
            <Pill value={t.status} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(t.results || []).length === 0 && <p className="text-xs opacity-55">No results recorded yet.</p>}
            {(t.results || []).map((r: any) => (
              <span key={r.test} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "rgba(128,128,128,0.12)" }}>
                {label(r.test)} <Pill value={r.result} />
              </span>
            ))}
          </div>
          {t.status !== "cleared" && <Btn href={`${BASE}/testing/${d._id}`} tone="ghost" full>Record / update TTI results</Btn>}
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Units produced</h2>
        <DataTable
          head={["Unit", "Product", "Status", ""]}
          empty="No units were produced from this donation."
          rows={(d.units || []).map((u: any) => [
            <span key="n" className="font-mono text-xs">{u.unitNumber}</span>,
            PRODUCT_LABEL[u.product] || label(u.product),
            <Pill key="s" value={u.status} />,
            <Link key="l" href={`${BASE}/inventory/${u._id}`} className="text-xs font-semibold underline">View</Link>,
          ])}
        />
      </Card>
    </Page>
  );
}
