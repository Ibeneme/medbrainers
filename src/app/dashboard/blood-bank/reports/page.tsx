"use client";

import { useEffect, useState } from "react";
import { BarChart3, Printer } from "lucide-react";
import { fetchBloodBankReport } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Btn, Card, DataTable, Header, Loader, Page, Pills, Stat, PRODUCT_LABEL, fmtDate, label, useBB,
} from "@/components/blood-bank/bb-ui";

function Bars({ data, fmt = (k: string) => label(k) }: { data: Record<string, number>; fmt?: (k: string) => string }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (!entries.length) return <p className="text-sm opacity-55">No data for this period.</p>;
  return (
    <div className="space-y-2.5">
      {entries.map(([k, n]) => (
        <div key={k} className="grid grid-cols-[minmax(0,160px)_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate opacity-75">{fmt(k)}</span>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(128,128,128,0.15)" }}><div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, backgroundColor: PRIMARY_COLOR }} /></div>
          <span className="font-semibold">{n}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [range, setRange] = useState("30");
  const rep: any = bloodBank.report;

  useEffect(() => {
    if (!facilityId) return;
    const to = new Date();
    const from = new Date(Date.now() - Number(range) * 86400000);
    act(fetchBloodBankReport({ facilityId, from: from.toISOString(), to: to.toISOString() }), false);
  }, [facilityId, act, range]);

  const c = rep?.collection, s = rep?.screening, w = rep?.wastage, d = rep?.demand, u = rep?.utilisation, x = rep?.reactions;

  return (
    <Page>
      <Header icon={<BarChart3 size={22} />} title="Blood Bank Reports" subtitle={rep ? `${fmtDate(rep.period.from)} – ${fmtDate(rep.period.to)} · ${activeFacility?.name}` : activeFacility?.name}
        actions={<Btn tone="card" onClick={() => window.print()}><Printer size={15} /> Print</Btn>} />
      <Pills value={range} onChange={setRange} onCard={false} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "12 months" }]} />
      {!rep ? <Loader text="Building report…" /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Donations" value={c.totalDonations} sub={`${c.completed} complete · ${c.incomplete} incomplete`} />
            <Stat label="Unique donors" value={c.uniqueDonors} sub={`${c.viaDrives} via drives · ${c.walkIn} walk-in`} />
            <Stat label="Deferral rate" value={`${s.deferralRatePct}%`} sub={`${s.screened} screened`} />
            <Stat label="Discard rate" value={`${w.discardRatePct}%`} sub={`${w.discarded} of ${w.collectedUnits} units`} tone={w.discardRatePct > 10 ? "bad" : undefined} />
            <Stat label="Transfusions" value={u.transfusions} sub={`${u.crossmatchedUnits} units crossmatched`} />
            <Stat label="C:T ratio" value={u.crossmatchToTransfusionRatio ?? "—"} sub="crossmatch to transfusion" />
            <Stat label="Reactions" value={x.total} sub={x.per1000Transfusions != null ? `${x.per1000Transfusions} per 1,000` : "no transfusions"} tone={x.total ? "warn" : undefined} />
            <Stat label="Adverse donor events" value={c.adverseReactions} sub="during collection" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Collections by type</h2><Bars data={Object.fromEntries((c.byType || []).map((t: any) => [t.type, t.donations]))} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Screening outcomes</h2><Bars data={s.byOutcome} /><h3 className="pt-2 text-xs font-semibold opacity-70">Top deferral reasons</h3><Bars data={Object.fromEntries((s.topDeferralReasons || []).map((r: any) => [r.reason || r.code, r.count]))} fmt={(k) => k} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Wastage by reason</h2><Bars data={w.byReason} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Requests by status</h2><Bars data={d.requestsByStatus} /><h3 className="pt-2 text-xs font-semibold opacity-70">By urgency</h3><Bars data={d.requestsByUrgency} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Transfusions by product</h2><Bars data={u.transfusionsByProduct} fmt={(k) => PRODUCT_LABEL[k] || label(k)} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Reactions by type</h2><Bars data={x.byType} /><h3 className="pt-2 text-xs font-semibold opacity-70">By severity</h3><Bars data={x.bySeverity} /></Card>
          </div>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Transfusion-transmissible infection rates</h2>
            <DataTable head={["Test", "Tested", "Reactive", "Indeterminate", "Reactivity"]} empty="No tests in this period." rows={Object.entries(rep.tti || {}).map(([k, v]: any) => [label(k), v.tested, v.reactive, v.indeterminate, `${v.reactivityRatePct}%`])} />
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Turnaround: request to first issue</h2>
            <DataTable head={["Urgency", "Average minutes"]} empty="No issues in this period." rows={Object.entries(d.avgMinutesRequestToFirstIssue || {}).map(([k, v]) => [label(k), String(v)])} />
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Red-cell stock now</h2>
            <DataTable head={["Group", "Available", "Reserved", "Minimum", ""]} rows={(rep.stockNow || []).map((g: any) => [<span key="g" className="font-mono font-semibold">{g.group}</span>, g.available, g.reserved, g.minimum, g.low ? <span key="l" className="text-xs font-semibold text-red-500">Low</span> : ""])} />
          </Card>
        </>
      )}
    </Page>
  );
}
