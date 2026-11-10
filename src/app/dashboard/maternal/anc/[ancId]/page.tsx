"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAncById, fetchAncInvestigations, fetchAncVisits } from "@/api/slices";
import {
  BASE, BackHeader, Banner, Bar, Btn, Card, DataTable, Flag, KV, KVGrid, Loader, MPill, NotFound, Page, bmi,
  bpFlag, daysToEdd, fmtDate, fmtDateTime, gaLabel, gestationDays, label, nameOf, trimester, useMat,
} from "@/components/maternity/mat-ui";

export default function AncDetailPage() {
  const { ancId } = useParams() as { ancId: string };
  const { facilityId, act, maternity } = useMat();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!facilityId) return;
    setState("loading");
    Promise.all([
      act(fetchAncById({ facilityId, id: ancId }), false),
      act(fetchAncVisits({ facilityId, id: ancId }), false),
      act(fetchAncInvestigations({ facilityId, id: ancId }), false),
    ]).then(([r]) => setState(r ? "ready" : "missing"));
  }, [facilityId, ancId, act]);

  const r = maternity.activeAnc?._id === ancId ? maternity.activeAnc : null;
  const visits = maternity.ancVisits.filter((v) => v.antenatalRecord === ancId);
  const invs = maternity.investigations.filter((i) => i.antenatalRecord === ancId);

  if (state === "loading" || (!r && state === "ready")) return <Page><Loader text="Loading antenatal record…" /></Page>;
  if (!r) return <Page><NotFound what="Antenatal record" href={`${BASE}/anc/visits`} /></Page>;

  const pt: any = r.patient;
  const active = r.status === "active";
  const days = gestationDays(r);
  const toEdd = daysToEdd(r.edd);
  const latest = visits[0]; // server sorts newest first
  const latestBp = bpFlag(latest?.bpSystolic, latest?.bpDiastolic);
  const rhNeg = (r.rhesus || "").toLowerCase().startsWith("neg");

  return (
    <Page>
      <BackHeader
        href={`${BASE}/anc/visits`}
        title={nameOf(r.patient)}
        subtitle={<span className="font-mono">{[r.registrationNo, pt?.mrn].filter(Boolean).join(" · ")}</span>}
        right={
          <>
            <Btn href={`${BASE}/anc/${ancId}/risk`} tone="card">Risk & status</Btn>
            <Btn href={`${BASE}/anc/${ancId}/investigation`} tone="card">Order scan / lab</Btn>
            {active && <Btn href={`${BASE}/labour/admit?patientId=${pt?._id || ""}&ancId=${ancId}`} tone="ghost">Admit to labour</Btn>}
            {active && <Btn href={`${BASE}/anc/${ancId}/visit`}>Record visit</Btn>}
          </>
        }
      />

      {active && latestBp && (r.riskLevel === "low" || r.riskLevel === "moderate") && (
        <Banner tone={latestBp === "bad" ? "bad" : "warn"} href={`${BASE}/anc/${ancId}/risk`} cta="Update risk">
          Latest visit BP was {latest?.bpSystolic}/{latest?.bpDiastolic} mmHg while risk is {label(r.riskLevel)} — consider raising the risk level.
        </Banner>
      )}

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <MPill value={r.riskLevel} />
          <MPill value={r.status} />
          {r.riskFactors?.map((f) => (
            <span key={f} className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-500">{f}</span>
          ))}
        </div>
        <KVGrid cols={4}>
          <KV label="Gestational age">{active ? `${gaLabel(days)} · T${trimester(days) ?? "—"}` : "—"}</KV>
          <KV label="EDD">
            {fmtDate(r.edd)}
            {active && toEdd !== undefined && (
              <span className="ml-1 text-xs opacity-60">
                ({toEdd < 0 ? <Flag tone="bad">{-toEdd} d overdue</Flag> : `${toEdd} d to go`})
              </span>
            )}
          </KV>
          <KV label="LMP">{fmtDate(r.lmp)}</KV>
          <KV label="Booked">{fmtDate(r.bookingDate)}{r.gestationalAgeAtBooking ? ` · ${r.gestationalAgeAtBooking}` : ""}</KV>
          <KV label="Obstetric history">G{r.gravida} P{r.para} A{r.abortions ?? 0} · {r.livingChildren ?? 0} living</KV>
          <KV label="Blood group">
            {r.bloodGroup || pt?.bloodGroup ? <>{r.bloodGroup || pt?.bloodGroup} {r.rhesus && (rhNeg ? <Flag tone="bad">Rh negative</Flag> : "Rh positive")}</> : undefined}
          </KV>
          <KV label="Height / weight / BMI">
            {r.heightCm ? `${r.heightCm} cm` : "—"} · {r.weightKg ? `${r.weightKg} kg` : "—"}
            {bmi(r.weightKg, r.heightCm) ? ` · BMI ${bmi(r.weightKg, r.heightCm)}` : ""}
          </KV>
          <KV label="Registered by">{nameOf(r.registeredBy)}</KV>
        </KVGrid>
        {r.notes && <p className="text-sm opacity-75">{r.notes}</p>}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs opacity-60">
            <span>ANC contacts</span>
            <span>{visits.length} of 8 recommended (WHO)</span>
          </div>
          <Bar pct={(visits.length / 8) * 100} />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Visits</h2>
        <DataTable
          head={["Date", "GA", "BP", "Weight", "Fundal ht", "FHR", "Hb", "Urine", "Next visit", "Advice"]}
          empty="No visits recorded yet."
          rows={visits.map((v) => {
            const f = bpFlag(v.bpSystolic, v.bpDiastolic);
            const hbLow = v.haemoglobin !== undefined && v.haemoglobin < 11;
            const fhr = v.fetalHeartRate;
            const fhrBad = fhr !== undefined && (fhr < 110 || fhr > 160);
            return [
              fmtDateTime(v.visitDate),
              v.gestationalAge || "—",
              v.bpSystolic !== undefined ? <Flag key="bp" tone={f}>{v.bpSystolic}/{v.bpDiastolic ?? "—"}</Flag> : "—",
              v.weightKg ? `${v.weightKg} kg` : "—",
              v.fundalHeightCm ? `${v.fundalHeightCm} cm` : "—",
              fhr !== undefined ? <Flag key="f" tone={fhrBad ? "bad" : undefined}>{fhr}</Flag> : "—",
              v.haemoglobin !== undefined ? <Flag key="h" tone={hbLow ? "bad" : undefined}>{v.haemoglobin}</Flag> : "—",
              [v.urineProtein && `Prot ${v.urineProtein}`, v.urineSugar && `Sug ${v.urineSugar}`].filter(Boolean).join(" · ") || "—",
              fmtDate(v.nextVisitDate),
              <span key="a" className="text-xs opacity-75">{v.advice || v.findings || "—"}</span>,
            ];
          })}
        />
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Scans & labs</h2>
          <Btn href={`${BASE}/anc/${ancId}/investigation`} tone="ghost">Order</Btn>
        </div>
        <DataTable
          head={["Requested", "Type", "Test", "Result"]}
          empty="No investigations ordered."
          rows={invs.map((i) => [
            fmtDate(i.requestedDate),
            <MPill key="t" value={i.type} />,
            <span key="n" className="font-semibold">{i.name}</span>,
            i.result || <span key="p" className="opacity-50">Awaiting result</span>,
          ])}
        />
      </Card>
    </Page>
  );
}
