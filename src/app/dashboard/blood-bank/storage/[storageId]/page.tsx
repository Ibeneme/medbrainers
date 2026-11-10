"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { fetchStorage, fetchTemperatures } from "@/api/slices";
import {
  BASE, BackHeader, Bar, Btn, Card, DataTable, KV, KVGrid, Loader, NotFound, Page, Pill,
  fmtDate, fmtDateTime, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";
import { PRIMARY_COLOR } from "@/constants/colors";

function Trend({ points, min, max }: { points: number[]; min: number; max: number }) {
  if (points.length < 2) return <p className="text-xs opacity-55">Log at least two readings to see a trend.</p>;
  const lo = Math.min(min, ...points) - 1;
  const hi = Math.max(max, ...points) + 1;
  const W = 600, H = 120;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" preserveAspectRatio="none">
      <rect x="0" y={y(max)} width={W} height={Math.max(1, y(min) - y(max))} fill="#10b981" opacity="0.12" />
      <polyline fill="none" stroke={PRIMARY_COLOR} strokeWidth="2.5" strokeLinejoin="round" points={points.map((p, i) => `${x(i)},${y(p)}`).join(" ")} />
      {points.map((p, i) => (p < min || p > max ? <circle key={i} cx={x(i)} cy={y(p)} r="4" fill="#ef4444" /> : null))}
    </svg>
  );
}

export default function StorageDetailPage() {
  const { storageId } = useParams() as { storageId: string };
  const { facilityId, act, bloodBank } = useBB();

  useEffect(() => {
    if (!facilityId) return;
    act(fetchStorage({ facilityId, includeInactive: true }), false);
    act(fetchTemperatures({ facilityId, storageId, limit: 60 }), false);
  }, [facilityId, storageId, act]);

  const s = bloodBank.storage.find((x) => x._id === storageId);
  if (!s) return <Page>{bloodBank.listLoading || !facilityId ? <Loader /> : <NotFound what="Storage unit" href={`${BASE}/storage`} />}</Page>;

  const temps = [...bloodBank.temperatures].filter((t) => t.storageUnit === storageId || !t.storageUnit);
  const ordered = [...temps].sort((a, b) => +new Date(a.recordedAt) - +new Date(b.recordedAt));
  const t = s.lastTemperature;

  return (
    <Page>
      <BackHeader
        href={`${BASE}/storage`}
        title={s.name}
        subtitle={<span><span className="font-mono uppercase">{s.code}</span> · {label(s.type)}</span>}
        right={
          <>
            <Btn href={`${BASE}/storage/${storageId}/edit`} tone="card"><Pencil size={14} /> Edit</Btn>
            <Btn href={`${BASE}/storage/${storageId}/log`}>Log temperature</Btn>
            <Btn href={`${BASE}/storage/${storageId}/quarantine`} tone="danger">Quarantine contents</Btn>
          </>
        }
      />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold tracking-tight" style={t && !t.inRange ? { color: "#ef4444" } : undefined}>{t ? `${t.valueC}°C` : "—"}</p>
            <p className="text-xs opacity-55">{t ? `Last reading ${fmtDateTime(t.at)}` : "No readings yet"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill value={s.status} />
            {!s.isActive && <Pill value="inactive" />}
            {s.alarm && <Pill value="reactive">Out of range</Pill>}
            {s.readingOverdue && <Pill tone="warn">Reading overdue</Pill>}
          </div>
        </div>
        <KVGrid>
          <KV label="Safe range">{s.minTempC}° to {s.maxTempC}°C</KV>
          <KV label="Location">{s.location}</KV>
          <KV label="Contents">{s.unitsStored ?? 0} / {s.capacity} units</KV>
          <KV label="Last serviced">{fmtDate((s as any).lastServiceAt)}</KV>
          <KV label="Next service due">{fmtDate((s as any).nextServiceDue)}</KV>
        </KVGrid>
        <Bar pct={s.capacity ? ((s.unitsStored ?? 0) / s.capacity) * 100 : 0} />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Temperature trend</h2>
        <Trend points={ordered.map((x) => x.temperatureC)} min={s.minTempC} max={s.maxTempC} />
        <p className="text-[11px] opacity-50">Green band is the safe range. Red dots are excursions.</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Readings</h2>
        <DataTable
          head={["When", "Temp", "In range", "Source", "By", "Action taken"]}
          empty="No temperature readings."
          rows={temps.map((x) => [fmtDateTime(x.recordedAt), `${x.temperatureC}°C`, <Pill key="i" value={x.inRange ? "compatible" : "incompatible"}>{x.inRange ? "OK" : "Excursion"}</Pill>, label(x.source), nameOf(x.recordedBy), x.actionTaken || "—"])}
        />
      </Card>
    </Page>
  );
}
