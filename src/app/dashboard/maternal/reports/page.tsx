"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  fetchAncRecords, fetchCaesareans, fetchDeliveries, fetchImmunizations, fetchNewborns, fetchNicu,
} from "@/api/slices";
import {
  Bar, Card, Empty, ENUMS, Header, MODE_LABEL, Page, Pills, SectionCard, Stat, isOverdue, label, useMat,
} from "@/components/maternity/mat-ui";

const RANGES: Record<string, number | null> = { "30": 30, "90": 90, "365": 365, all: null };
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

function Dist({ title, items }: { title: string; items: Array<{ k: string; n: number }> }) {
  const total = items.reduce((s, i) => s + i.n, 0);
  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {total === 0 ? <p className="text-sm opacity-50">No data in this period.</p> : items.map((i) => (
        <div key={i.k} className="space-y-1">
          <div className="flex justify-between text-xs"><span>{i.k}</span><span className="opacity-60">{i.n} · {pct(i.n, total)}%</span></div>
          <Bar pct={pct(i.n, total)} />
        </div>
      ))}
    </Card>
  );
}

export default function MaternityReportsPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [range, setRange] = useState("90");

  useEffect(() => {
    if (!facilityId) return;
    act(fetchAncRecords({ facilityId }), false);
    act(fetchDeliveries({ facilityId }), false);
    act(fetchNewborns({ facilityId }), false);
    act(fetchImmunizations({ facilityId }), false);
    act(fetchCaesareans({ facilityId }), false);
    act(fetchNicu({ facilityId }), false);
  }, [facilityId, act]);

  const m = maternity;
  const from = RANGES[range] ? Date.now() - (RANGES[range] as number) * 86400000 : 0;
  const inRange = (d?: string) => !from || (!!d && new Date(d).getTime() >= from);

  const r = useMemo(() => {
    const del = m.deliveries.filter((d) => inRange(d.deliveryDateTime));
    const nb = m.newborns.filter((n) => inRange(n.birthDateTime));
    const anc = m.anc.filter((a) => inRange(a.bookingDate));
    const imm = m.immunizations.filter((i) => inRange(i.scheduledDate));
    const cs = del.filter((d) => d.mode === "caesarean").length;
    const pph = del.filter((d) => (d.bloodLossMl ?? 0) >= 500).length;
    const lbw = nb.filter((n) => n.birthWeightGrams < 2500).length;
    const lowApgar = nb.filter((n) => n.apgar5 !== undefined && n.apgar5 < 7).length;
    const given = imm.filter((i) => i.status === "given").length;
    const overdue = imm.filter((i) => isOverdue(i.scheduledDate, i.status)).length;
    const weights = nb.map((n) => n.birthWeightGrams);
    return { del, nb, anc, imm, cs, pph, lbw, lowApgar, given, overdue, meanBw: weights.length ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.deliveries, m.newborns, m.anc, m.immunizations, range]);

  const count = <T,>(list: T[], key: (x: T) => string, keys: readonly string[], fmt: (k: string) => string = label) =>
    keys.map((k) => ({ k: fmt(k), n: list.filter((x) => key(x) === k).length }));
  const capped = m.deliveries.length >= 300 || m.newborns.length >= 300 || m.anc.length >= 500;

  return (
    <Page>
      <Header icon={<BarChart3 size={22} />} title="Maternal & Child Reports" subtitle={activeFacility?.name} />
      <Pills onCard={false} value={range} onChange={setRange} options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "12 months" }, { value: "all", label: "All loaded" }]} />
      {capped && <p className="text-[11px] opacity-55">The server returns the latest 300 deliveries / newborns and 500 pregnancies, so very long ranges may be truncated.</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Deliveries" value={r.del.length} sub="in period" />
        <Stat label="Caesarean rate" value={`${pct(r.cs, r.del.length)}%`} sub={`${r.cs} of ${r.del.length}`} />
        <Stat label="PPH (≥ 500 mL)" value={r.pph} sub="recorded blood loss" tone={r.pph ? "warn" : undefined} />
        <Stat label="Live births registered" value={r.nb.length} sub={`mean ${r.meanBw || "—"} g`} />
        <Stat label="Low birth weight" value={`${pct(r.lbw, r.nb.length)}%`} sub={`${r.lbw} under 2500 g`} tone={r.lbw ? "warn" : undefined} />
        <Stat label="Apgar-5 below 7" value={r.lowApgar} tone={r.lowApgar ? "bad" : undefined} />
        <Stat label="NICU / SCBU now" value={m.nicu.length} sub="currently admitted" />
        <Stat label="New ANC bookings" value={r.anc.length} sub="in period" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Dist title="Mode of delivery" items={count(r.del, (d) => d.mode, ENUMS.deliveryModes, (k) => MODE_LABEL[k].split(" (")[0])} />
        <Dist title="Newborn status" items={count(r.nb, (n) => n.status, ENUMS.newbornStatuses)} />
        <Dist title="ANC bookings by risk" items={count(r.anc, (a) => a.riskLevel, ENUMS.riskLevels)} />
        <Dist title="Pregnancy outcome status" items={count(r.anc, (a) => a.status, ENUMS.pregnancyStatuses)} />
      </div>

      <SectionCard title="Immunization">
        {r.imm.length === 0 ? <Empty>No scheduled doses in this period.</Empty> : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span>Doses given</span><span className="font-semibold">{r.given} / {r.imm.length} · {pct(r.given, r.imm.length)}%</span></div>
            <Bar pct={pct(r.given, r.imm.length)} />
            <p className="text-xs opacity-60">{r.overdue} overdue · {r.imm.filter((i) => i.status === "missed").length} marked missed</p>
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
