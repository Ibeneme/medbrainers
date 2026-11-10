"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { fetchDriveById, updateDrive } from "@/api/slices";
import {
  BASE, BackHeader, Bar, Btn, Card, DataTable, KV, KVGrid, Loader, NotFound, Page, Pill, Ring, Stat,
  fmtDateTime, idOf, label, nameOf, useBB, useConfirm, useLoad,
} from "@/components/blood-bank/bb-ui";

export default function DriveDetailPage() {
  const { driveId } = useParams() as { driveId: string };
  const bb = useBB();
  const { act, facilityId } = bb;
  const { data: d, status, reload } = useLoad<any>(bb, (f) => fetchDriveById({ facilityId: f, driveId }), [driveId]);
  const { ask, node } = useConfirm();

  if (status === "loading" && !d) return <Page><Loader text="Loading drive…" /></Page>;
  if (!d) return <Page><NotFound what="Drive" href={`${BASE}/drives`} /></Page>;

  const setStatus = (next: string, title: string, message: string, tone: "danger" | "primary" = "primary") =>
    ask({
      title, message, tone, confirmLabel: title,
      onConfirm: async () => {
        const r = await act(updateDrive({ facilityId, driveId, payload: { status: next } }), `Drive ${label(next).toLowerCase()}`);
        if (r) reload(true);
      },
    });

  const collected = d.stats?.collected ?? 0;
  const pct = d.targetUnits ? Math.round((collected / d.targetUnits) * 100) : 0;
  const open = d.status === "planned" || d.status === "ongoing";

  return (
    <Page>
      <BackHeader
        href={`${BASE}/drives`}
        title={d.name}
        subtitle={<span className="font-mono">{d.driveNumber}</span>}
        right={
          open && (
            <>
              <Btn href={`${BASE}/drives/${driveId}/edit`} tone="card"><Pencil size={14} /> Edit</Btn>
              <Btn href={`${BASE}/screening/new?driveId=${driveId}`} tone="ghost">Screen a donor</Btn>
            </>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 flex items-center gap-5 rounded-3xl p-5 lg:col-span-1" style={{ backgroundColor: bb.ui.card, boxShadow: bb.softShadow }}>
          <Ring pct={pct} size={72} stroke={6} />
          <div>
            <p className="text-xs font-medium opacity-55">Target</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight">{collected}<span className="text-base font-normal opacity-50">/{d.targetUnits || 0}</span></p>
            <p className="text-[11px] opacity-45">units collected</p>
          </div>
        </div>
        <Stat label="Screened" value={d.stats?.screened ?? 0} sub="donors assessed" />
        <Stat label="Deferred" value={d.stats?.deferred ?? 0} sub="not eligible" />
        <Stat label="Collected" value={collected} sub="donations" />
      </div>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill value={d.status} />
          <div className="flex flex-wrap gap-2">
            {d.status === "planned" && <Btn tone="ghost" onClick={() => setStatus("ongoing", "Start drive", "Mark this drive as under way? Screenings and donations can then be linked to it.")}>Start drive</Btn>}
            {d.status === "ongoing" && <Btn tone="ghost" onClick={() => setStatus("completed", "Complete drive", "Mark this drive as completed? This closes it to new screenings.")}>Complete drive</Btn>}
            {open && <Btn tone="danger" onClick={() => setStatus("cancelled", "Cancel drive", "Cancel this blood drive? Planned collections will no longer be linked to it.", "danger")}>Cancel drive</Btn>}
          </div>
        </div>
        <KVGrid>
          <KV label="Location">{d.location}</KV>
          <KV label="Starts">{fmtDateTime(d.scheduledAt)}</KV>
          <KV label="Ends">{fmtDateTime(d.endsAt)}</KV>
          <KV label="Organizer">{d.organizer}</KV>
          <KV label="Contact">{[d.contactPerson, d.contactPhone].filter(Boolean).join(" · ")}</KV>
          <KV label="Created by">{nameOf(d.createdBy)}</KV>
          <KV label="Team">{(d.team || []).map((t: any) => nameOf(t)).join(", ")}</KV>
        </KVGrid>
        {d.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{d.notes}</p>}
        <Bar pct={pct} />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Donations at this drive</h2>
        <DataTable
          head={["Donation", "Donor", "Collected", "Outcome", ""]}
          empty="No donations recorded for this drive yet."
          rows={(d.donations || []).map((x: any) => [
            <span key="n" className="font-mono text-xs">{x.donationNumber}</span>,
            nameOf(x.donor),
            fmtDateTime(x.collectedAt),
            <Pill key="o" value={x.outcome} />,
            <Link key="l" href={`${BASE}/donations/${idOf(x)}`} className="text-xs font-semibold underline">View</Link>,
          ])}
        />
      </Card>
      {node}
    </Page>
  );
}
