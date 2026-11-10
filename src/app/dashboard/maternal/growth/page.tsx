"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Ruler } from "lucide-react";
import { fetchGrowth } from "@/api/slices";
import { LineChart } from "@/components/maternity/mat-charts";
import {
  BASE, Btn, Card, DataTable, Empty, Header, Loader, MPill, Page, PatientPicker, SectionCard, fmtDate, muacClass, useMat,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [pid, setPid] = useState(sp.get("patientId") || "");
  useEffect(() => {
    if (facilityId && pid) act(fetchGrowth({ facilityId, patientId: pid }), false);
  }, [facilityId, pid, act]);

  const rows = pid ? maternity.growth : [];
  const series = (k: "weightKg" | "lengthCm" | "headCircumferenceCm") =>
    rows.filter((r) => r[k] !== undefined && r.ageMonths !== undefined).map((r) => ({ x: r.ageMonths as number, y: r[k] as number }));
  const chart = (title: string, k: "weightKg" | "lengthCm" | "headCircumferenceCm", unit: string) => {
    const pts = series(k);
    if (pts.length < 2) return null;
    const ys = pts.map((p) => p.y), xs = pts.map((p) => p.x);
    const pad = (Math.max(...ys) - Math.min(...ys)) * 0.15 || 1;
    return (
      <Card key={k} className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <LineChart points={pts} xMin={Math.min(...xs)} xMax={Math.max(...xs) + 1} yMin={Math.max(0, Math.floor(Math.min(...ys) - pad))} yMax={Math.ceil(Math.max(...ys) + pad)} xTitle="Age (months)" yTitle={unit} height={180} />
      </Card>
    );
  };
  const latestMuac = [...rows].reverse().find((r) => r.muacCm !== undefined);
  const mc = muacClass(latestMuac?.muacCm);

  return (
    <Page>
      <Header icon={<Ruler size={22} />} title="Growth Monitoring" subtitle={activeFacility?.name}
        actions={pid ? <Btn href={`${BASE}/growth/new?patientId=${pid}`}>Record measurement</Btn> : undefined} />
      <SectionCard title="Child">
        <div className="max-w-xl"><PatientPicker value={pid} onChange={setPid} placeholder="Search child by name or MRN…" /></div>
      </SectionCard>
      {!pid ? <Empty>Select a child to see growth measurements and trends.</Empty> : maternity.listLoading && !rows.length ? <Loader /> : (
        <>
          {mc && <Card className="flex items-center gap-3"><span className="text-sm">Latest MUAC {latestMuac?.muacCm} cm</span><MPill tone={mc.tone}>{mc.key}</MPill></Card>}
          <div className="grid gap-4 lg:grid-cols-2">
            {chart("Weight", "weightKg", "kg")}
            {chart("Length / height", "lengthCm", "cm")}
            {chart("Head circumference", "headCircumferenceCm", "cm")}
          </div>
          <SectionCard title="Measurements" count={rows.length}>
            <DataTable
              head={["Date", "Age (mo)", "Weight", "Length", "Head circ.", "MUAC", "Notes"]}
              empty="No measurements recorded."
              rows={[...rows].reverse().map((r) => {
                const m = muacClass(r.muacCm);
                return [
                  fmtDate(r.measuredAt), r.ageMonths ?? "—",
                  r.weightKg !== undefined ? `${r.weightKg} kg` : "—", r.lengthCm !== undefined ? `${r.lengthCm} cm` : "—",
                  r.headCircumferenceCm !== undefined ? `${r.headCircumferenceCm} cm` : "—",
                  r.muacCm !== undefined ? <span key="m">{r.muacCm} cm {m && m.key !== "Normal" && <MPill tone={m.tone}>{m.key}</MPill>}</span> : "—",
                  <span key="n" className="text-xs opacity-75">{r.notes || "—"}</span>,
                ];
              })}
            />
          </SectionCard>
        </>
      )}
    </Page>
  );
}

export default function GrowthPage() {
  return (
    <Suspense fallback={<Page><Loader /></Page>}>
      <Inner />
    </Suspense>
  );
}
