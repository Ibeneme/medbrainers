"use client";

import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchScreeningById } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, KV, KVGrid, Loader, NotFound, Page, Pill, RISKS,
  fmtDate, fmtDateTime, idOf, nameOf, useBB, useLoad, label,
} from "@/components/blood-bank/bb-ui";

export default function ScreeningDetailPage() {
  const { screeningId } = useParams() as { screeningId: string };
  const bb = useBB();
  const { data: s, status } = useLoad<any>(bb, (facilityId) => fetchScreeningById({ facilityId, screeningId }), [screeningId]);

  if (status === "loading") return <Page><Loader text="Loading screening…" /></Page>;
  if (!s) return <Page><NotFound what="Screening" href={`${BASE}/screening`} /></Page>;

  const donor = s.donor || {};
  const riskLabel = (k: string) => RISKS.find((r) => r.key === k)?.label || label(k);
  const eligibleAndFree = s.outcome === "eligible" && !s.used;

  return (
    <Page>
      <BackHeader
        href={`${BASE}/screening`}
        title={<span className="font-mono">{s.screeningNumber}</span>}
        subtitle={fmtDateTime(s.screenedAt)}
        right={eligibleAndFree && <Btn href={`${BASE}/donations/new?screeningId=${s._id}`}>Record donation</Btn>}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`${BASE}/donors/${idOf(donor)}`} className="text-lg font-semibold hover:underline">{nameOf(donor)}</Link>
            <p className="font-mono text-xs opacity-50">{donor.donorNumber}</p>
          </div>
          <div className="flex gap-2">
            <Pill value={s.outcome} />
            {s.outcome === "eligible" && (s.used ? <Pill tone="mute">Used</Pill> : <Pill tone="info">Ready to donate</Pill>)}
          </div>
        </div>
        {s.outcome !== "eligible" && (
          <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#f59e0b1f" }}>
            <p className="font-semibold">{s.outcome === "deferred_permanent" ? "Permanently deferred" : `Deferred until ${fmtDate(s.deferralUntil)}`}</p>
            {s.deferralReason && <p className="mt-1 text-xs opacity-75">{s.deferralReason}</p>}
          </div>
        )}
        <KVGrid cols={4}>
          <KV label="Weight">{s.vitals?.weightKg} kg</KV>
          <KV label="Height">{s.vitals?.heightCm ? `${s.vitals.heightCm} cm` : "—"}</KV>
          <KV label="Haemoglobin">{s.vitals?.hemoglobin} g/dL</KV>
          <KV label="Blood pressure">{s.vitals?.systolic}/{s.vitals?.diastolic} mmHg</KV>
          <KV label="Pulse">{s.vitals?.pulse} bpm</KV>
          <KV label="Temperature">{s.vitals?.temperatureC} °C</KV>
          <KV label="Screened by">{nameOf(s.screenedBy)}</KV>
          <KV label="Drive">{s.drive ? (
            <Link href={`${BASE}/drives/${idOf(s.drive)}`} className="underline">{s.drive.name || s.drive.driveNumber}</Link>
          ) : "Walk-in"}</KV>
        </KVGrid>
      </Card>

      {s.flags?.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Flags raised</h2>
          <ul className="space-y-1.5 text-sm">
            {s.flags.map((f: any, i: number) => (
              <li key={i} className="flex items-start gap-2"><Pill tone="warn">{f.code}</Pill><span className="opacity-80">{f.message}</span></li>
            ))}
          </ul>
        </Card>
      )}
      {s.riskFactors?.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Risk factors reported</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm opacity-80">{s.riskFactors.map((r: string) => <li key={r}>{riskLabel(r)}</li>)}</ul>
        </Card>
      )}
      {s.notes && (
        <Card className="space-y-2"><h2 className="text-sm font-semibold">Notes</h2><p className="whitespace-pre-wrap text-sm opacity-80">{s.notes}</p></Card>
      )}
    </Page>
  );
}
