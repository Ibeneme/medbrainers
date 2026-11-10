"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { fetchLabourBoard } from "@/api/slices";
import { Cervicograph, LineChart, cervicographState } from "@/components/maternity/mat-charts";
import {
  BASE, Banner, Btn, Card, DataTable, Empty, Flag, Header, KV, KVGrid, Loader, MPill, Page, Pills, SectionCard, bpFlag,
  fmtDateTime, nameOf, useMat,
} from "@/components/maternity/mat-ui";
import { CustomDropdown } from "@/components/ui/items";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, maternity, activeFacility, ui, isDark, colors } = useMat();
  const [scope, setScope] = useState("current");
  const [labourId, setLabourId] = useState(sp.get("labourId") || "");

  useEffect(() => {
    if (facilityId) act(fetchLabourBoard({ facilityId, status: scope === "current" ? undefined : "delivered" }), false);
  }, [facilityId, act, scope]);

  const rows = maternity.labour;
  const l = rows.find((x) => x._id === labourId) || null;
  const obs = [...(l?.partograph || [])].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const cg = cervicographState(obs);
  const t0 = obs[0] ? new Date(obs[0].time).getTime() : 0;
  const hrs = (t: string) => (new Date(t).getTime() - t0) / 3600000;
  const fhr = obs.filter((o) => o.fetalHeartRate !== undefined).map((o) => ({ x: hrs(o.time), y: o.fetalHeartRate as number }));
  const lastX = Math.max(1, Math.ceil(Math.max(0, ...obs.map((o) => hrs(o.time)))));

  return (
    <Page>
      <Header
        icon={<Activity size={22} />}
        title="Partograph"
        subtitle={activeFacility?.name}
        actions={l ? <Btn href={`${BASE}/labour/partograph/record?labourId=${l._id}`}>Record observation</Btn> : undefined}
      />
      <>
        <Pills onCard value={scope} onChange={(v) => { setScope(v); setLabourId(""); }} options={[{ value: "current", label: "In labour now" }, { value: "delivered", label: "Delivered" }]} />
        <div className="max-w-xl">
          <CustomDropdown
            value={labourId}
            options={rows.map((x) => ({ value: x._id, label: `${nameOf(x.patient)}${x.bedCode ? ` · bed ${x.bedCode}` : ""} · ${x.partograph?.length || 0} obs` }))}
            onChange={setLabourId}
            placeholder={maternity.listLoading ? "Loading…" : "Select a woman…"}
            searchable
            isDark={isDark}
            colors={colors}
            border={ui.border}
          />
        </div>
      </>

      {!l ? (
        <Empty>Select a labour record to see its cervicograph and observations.</Empty>
      ) : maternity.listLoading && !rows.length ? (
        <Loader />
      ) : (
        <>
          {cg.crossedAction && (
            <Banner tone="bad">
              Cervical progress is to the right of the action line — {cg.lastDilatation} cm at {cg.hours?.toFixed(1)} h into the active phase. Review for delay and consider intervention.
            </Banner>
          )}
          {!cg.crossedAction && cg.crossedAlert && (
            <Banner tone="warn">Progress has crossed the alert line (slower than 1 cm/hour). Reassess and watch closely.</Banner>
          )}

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{nameOf(l.patient)}</p>
                <p className="text-xs opacity-55">Admitted {fmtDateTime(l.admissionTime)}</p>
              </div>
              <MPill value={l.status} tone={l.status === "admitted" ? "warn" : undefined} />
            </div>
            <KVGrid cols={4}>
              <KV label="Bed">{l.bedCode}</KV>
              <KV label="Onset">{fmtDateTime(l.onsetOfLabour)}</KV>
              <KV label="Membranes ruptured">{fmtDateTime(l.membranesRupturedAt)}</KV>
              <KV label="Liquor">{l.liquor}</KV>
            </KVGrid>
            {!cg.active && obs.some((o) => o.cervicalDilatation !== undefined) && (
              <p className="text-xs opacity-60">Active phase (≥ 4 cm) not reached yet — alert and action lines start once dilatation reaches 4 cm.</p>
            )}
            <Cervicograph obs={obs} />
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Fetal heart rate</h2>
            {fhr.length === 0 ? (
              <p className="text-sm opacity-55">No fetal heart rate recorded yet.</p>
            ) : (
              <LineChart
                points={fhr}
                xMin={0}
                xMax={Math.max(4, lastX)}
                yMin={80}
                yMax={200}
                band={[110, 160]}
                xFmt={(v) => `${Math.round(v)}h`}
                xTitle="Hours since first observation"
                yTitle="bpm"
                height={200}
              />
            )}
            <p className="text-[10px] opacity-50">Shaded band = normal 110–160 bpm.</p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Observations</h2>
            <DataTable
              head={["Time", "Cervix", "Descent", "FHR", "Contractions", "BP", "Pulse", "Temp", "Urine", "Drugs / notes"]}
              empty="No observations recorded."
              rows={[...obs].reverse().map((o) => {
                const f = bpFlag(o.bpSystolic, o.bpDiastolic);
                const fb = o.fetalHeartRate !== undefined && (o.fetalHeartRate < 110 || o.fetalHeartRate > 160);
                return [
                  fmtDateTime(o.time),
                  o.cervicalDilatation !== undefined ? `${o.cervicalDilatation} cm` : "—",
                  o.descentOfHead !== undefined ? `${o.descentOfHead}/5` : "—",
                  o.fetalHeartRate !== undefined ? <Flag key="f" tone={fb ? "bad" : undefined}>{o.fetalHeartRate}</Flag> : "—",
                  o.contractionsPer10Min !== undefined ? `${o.contractionsPer10Min}/10 min${o.durationOfContraction ? ` · ${o.durationOfContraction}` : ""}` : "—",
                  o.bpSystolic !== undefined ? <Flag key="b" tone={f}>{o.bpSystolic}/{o.bpDiastolic ?? "—"}</Flag> : "—",
                  o.pulse ?? "—",
                  o.temperature !== undefined ? <Flag key="t" tone={o.temperature >= 38 ? "bad" : undefined}>{o.temperature}°</Flag> : "—",
                  [o.urineVolume !== undefined && `${o.urineVolume} mL`, o.urineProtein && `P ${o.urineProtein}`, o.urineAcetone && `A ${o.urineAcetone}`].filter(Boolean).join(" · ") || "—",
                  <span key="n" className="text-xs opacity-75">{[o.drugsGiven, o.notes].filter(Boolean).join(" — ") || "—"}</span>,
                ];
              })}
            />
          </Card>
        </>
      )}
    </Page>
  );
}

export default function PartographPage() {
  return (
    <Suspense fallback={<Page><Loader /></Page>}>
      <Inner />
    </Suspense>
  );
}
