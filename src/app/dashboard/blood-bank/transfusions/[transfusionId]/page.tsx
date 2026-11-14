"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchBloodBankSetup, fetchTransfusionById } from "@/api/slices";
import {
  BASE, BackHeader, Btn, Card, DataTable, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill, PRODUCT_LABEL,
  fmtDateTime, fmtDuration, idOf, label, minutesBetween, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

const vRow = (l: string, v: any, by?: any) => [l, v?.temperatureC ?? "—", v?.pulse ?? "—", v?.systolic != null ? `${v.systolic}/${v.diastolic ?? "—"}` : "—", v?.respRate ?? "—", v?.spo2 ?? "—", by ? nameOf(by) : "—"];

export default function TransfusionDetailPage() {
  const { transfusionId } = useParams() as { transfusionId: string };
  const { facilityId, act, bloodBank } = useBB();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [, tick] = useState(0);
  useEffect(() => {
    if (!facilityId) return;
    setState("loading");
    act(fetchTransfusionById({ facilityId, transfusionId }), false).then((r) => setState(r ? "ready" : "missing"));
    act(fetchBloodBankSetup({ facilityId }), false);
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [facilityId, transfusionId, act]);

  const t: any = bloodBank.activeTransfusion?._id === transfusionId ? bloodBank.activeTransfusion : null;
  if (state === "loading" || (!t && state === "ready")) return <Page><Loader text="Loading transfusion…" /></Page>;
  if (!t) return <Page><NotFound what="Transfusion" href={`${BASE}/transfusions`} /></Page>;

  const running = t.status === "in_progress";
  const elapsed = minutesBetween(t.startedAt, t.endedAt);
  const maxH = bloodBank.setup?.settings?.transfusionMaxHours ?? 4;
  const over = running && elapsed > maxH * 60;
  const bc = t.bedsideCheck || {};

  return (
    <Page>
      <BackHeader href={`${BASE}/transfusions`} title={<span className="font-mono">{t.transfusionNumber}</span>} subtitle={`${nameOf(t.patient)} · ${t.patient?.mrn || ""}`}
        right={running ? (<><Btn href={`${BASE}/transfusions/${transfusionId}/vitals`} tone="ghost">Record vitals</Btn><Btn href={`${BASE}/transfusions/${transfusionId}/complete`}>Complete</Btn><Btn href={`${BASE}/transfusions/${transfusionId}/stop`} tone="danger">Stop</Btn></>) : <Btn href={`${BASE}/reactions/new?transfusionId=${transfusionId}`} tone="ghost">Report reaction</Btn>} />

      {over && <div className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#ef44441f", color: "#ef4444" }}>This unit has been running longer than {maxH} hours. Complete or stop the transfusion now.</div>}
      {running && <Btn href={`${BASE}/reactions/new?transfusionId=${transfusionId}`} tone="danger">Patient reacting? Report a reaction</Btn>}

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <GroupBadge group={t.bloodGroup} size="lg" />
          <Pill value={t.status} />
          <p className="text-sm opacity-65">{running ? `Running ${fmtDuration(elapsed)}` : `Duration ${fmtDuration(t.durationMinutes ?? elapsed)}`}</p>
        </div>
        <KVGrid>
          <KV label="Unit"><Link href={`${BASE}/inventory/${idOf(t.unit)}`} className="font-mono underline">{t.unitNumber}</Link></KV>
          <KV label="Product">{PRODUCT_LABEL[t.product]}</KV>
          <KV label="Request"><Link href={`${BASE}/requests/${idOf(t.request)}`} className="underline">{t.request?.requestNumber || "View"}</Link></KV>
          <KV label="Issue"><Link href={`${BASE}/issue/${idOf(t.issue)}`} className="underline">{t.issue?.issueNumber || "View"}</Link></KV>
          <KV label="Started">{fmtDateTime(t.startedAt)} · {nameOf(t.startedBy)}</KV>
          <KV label="Ended">{t.endedAt ? fmtDateTime(t.endedAt) : "—"}</KV>
          <KV label="Volume given">{t.volumeTransfusedMl != null ? `${t.volumeTransfusedMl} mL` : "—"}</KV>
          <KV label="Checked by">{nameOf(bc.firstChecker)} & {nameOf(bc.secondChecker)}</KV>
        </KVGrid>
        {t.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{t.notes}</p>}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Observations</h2>
        <DataTable head={["When", "Temp °C", "Pulse", "BP", "RR", "SpO₂", "By"]} rows={[
          ...(t.preVitals ? [vRow("Baseline", t.preVitals)] : []),
          ...(t.vitals || []).map((x: any) => vRow(fmtDateTime(x.at), x, x.by)),
          ...(t.postVitals ? [vRow("Post", t.postVitals)] : []),
        ]} />
      </Card>

      {t.reactions?.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Reactions</h2>
          {t.reactions.map((r: any) => (
            <Link key={r._id} href={`${BASE}/reactions/${r._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
              <span><span className="font-mono text-xs">{r.reactionNumber}</span> · {label(r.type)}</span><span className="flex gap-2"><Pill value={r.severity} /><Pill value={r.status} /></span>
            </Link>
          ))}
        </Card>
      )}
    </Page>
  );
}
