"use client";

import { useEffect, useState } from "react";
import { BarChart3, Printer } from "lucide-react";
import { fetchErReport } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { BASE, Btn, Card, DISPOSITION_LABEL, DataTable, Header, Loader, Page, Pills, Stat, TRIAGE, erLabel, fmtDate, fmtMins, useER } from "@/components/emergency/er-ui";

function Bars({ data, fmt = erLabel, colors }: { data: Record<string, number>; fmt?: (k: string) => string; colors?: (k: string) => string | undefined }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (!entries.length) return <p className="text-sm opacity-55">No data for this period.</p>;
  return (
    <div className="space-y-2.5">
      {entries.map(([k, n]) => (
        <div key={k} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate opacity-75">{fmt(k)}</span>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(128,128,128,0.15)" }}><div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, backgroundColor: colors?.(k) || PRIMARY_COLOR }} /></div>
          <span className="font-semibold">{n}</span>
        </div>
      ))}
    </div>
  );
}

export default function ErReportsPage() {
  const { facilityId, act, emergency, activeFacility } = useER();
  const [range, setRange] = useState("30");
  const rep = emergency.report;

  useEffect(() => {
    if (!facilityId) return;
    const to = new Date();
    const from = new Date(Date.now() - Number(range) * 86400000);
    act(fetchErReport({ facilityId, from: from.toISOString(), to: to.toISOString() }), false);
  }, [facilityId, act, range]);

  const triageOrder = (o: Record<string, number>) => Object.fromEntries([...Object.keys(TRIAGE), "untriaged"].filter((k) => k in o).map((k) => [k, o[k]]));

  return (
    <Page>
      <Header icon={<BarChart3 size={22} />} title="ER Reports" subtitle={rep ? `${fmtDate(rep.period.from)} – ${fmtDate(rep.period.to)} · ${activeFacility?.name}` : activeFacility?.name} actions={<Btn tone="card" onClick={() => window.print()}><Printer size={15} /> Print</Btn>} />
      <Pills value={range} onChange={setRange} onCard={false} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "12 months" }]} />
      {!rep ? <Loader text="Building report…" /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Arrivals" value={rep.totals.arrivals} sub={`${rep.totals.stillInDepartment} still in department`} href={`${BASE}/tracker`} />
            <Stat label="Left the department" value={rep.totals.dispositions} sub={`${rep.totals.deaths} death${rep.totals.deaths === 1 ? "" : "s"}`} />
            <Stat label="Avg. time to triage" value={fmtMins(rep.timing.avgMinutesToTriage)} sub="arrival to first triage" />
            <Stat label="Avg. length of stay" value={fmtMins(rep.timing.avgLengthOfStayMinutes)} sub="arrival to disposition" />
            <Stat label="Left against advice" value={`${rep.timing.leftAgainstAdviceRatePct}%`} sub="of all dispositions" tone={rep.timing.leftAgainstAdviceRatePct > 5 ? "warn" : undefined} />
            <Stat label="Ambulance calls" value={rep.ambulance.calls} sub={`${rep.ambulance.byStatus.completed || 0} completed`} href={`${BASE}/ambulance`} />
            <Stat label="Avg. call to dispatch" value={fmtMins(rep.ambulance.avgMinutesToDispatch)} sub="response time" />
            <Stat label="Avg. call to scene" value={fmtMins(rep.ambulance.avgMinutesToScene)} sub="arrival on scene" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Arrivals by triage category</h2><Bars data={triageOrder(rep.byTriage)} fmt={(k) => (k in TRIAGE ? `${k} · ${TRIAGE[k as keyof typeof TRIAGE].label}` : "Untriaged")} colors={(k) => TRIAGE[k as keyof typeof TRIAGE]?.color} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Arrival mode</h2><Bars data={rep.byArrivalMode} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Outcomes</h2><Bars data={rep.byDisposition} fmt={(k) => DISPOSITION_LABEL[k] || erLabel(k)} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Ambulance calls by priority</h2><Bars data={rep.ambulance.byPriority} /><h3 className="pt-2 text-xs font-semibold opacity-70">By status</h3><Bars data={rep.ambulance.byStatus} /></Card>
          </div>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Length of stay by outcome</h2>
            <DataTable head={["Outcome", "Average"]} empty="No dispositions in this period." rows={Object.entries(rep.timing.avgLengthOfStayByDisposition).map(([k, v]) => [DISPOSITION_LABEL[k] || erLabel(k), fmtMins(v)])} />
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Arrivals per day</h2>
            <DataTable head={["Date", "Arrivals"]} empty="No arrivals in this period." rows={Object.entries(rep.byDay).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 31).map(([k, v]) => [fmtDate(k), v])} />
          </Card>
        </>
      )}
    </Page>
  );
}
