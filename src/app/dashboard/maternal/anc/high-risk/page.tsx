"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { fetchAncRecords } from "@/api/slices";
import { AncRow } from "@/components/maternity/AncRow";
import {
  BASE, Banner, Btn, Empty, Header, Loader, Page, SearchBox, SectionCard, matchesPatient, useMat,
} from "@/components/maternity/mat-ui";

const ORDER: Record<string, number> = { "very-high": 0, high: 1 };

export default function HighRiskPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");

  // The dashboard counts high AND very-high, so load all active pregnancies and
  // filter here (the /anc/high-risk endpoint only returns "high").
  useEffect(() => {
    if (facilityId) act(fetchAncRecords({ facilityId, status: "active" }), false);
  }, [facilityId, act]);

  const rows = useMemo(
    () =>
      maternity.anc
        .filter((r) => r.riskLevel === "high" || r.riskLevel === "very-high")
        .filter((r) => matchesPatient(r.patient, q))
        .sort((a, b) => ORDER[a.riskLevel] - ORDER[b.riskLevel] || new Date(a.edd || 8.64e15).getTime() - new Date(b.edd || 8.64e15).getTime()),
    [maternity.anc, q],
  );
  const veryHigh = rows.filter((r) => r.riskLevel === "very-high").length;

  return (
    <Page>
      <Header
        icon={<AlertTriangle size={22} />}
        title="High-Risk Pregnancies"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/anc/visits`} tone="card">All pregnancies</Btn>}
      />
      {veryHigh > 0 && (
        <Banner tone="bad">
          <AlertTriangle size={18} className="text-red-500" />
          {veryHigh} very-high-risk pregnanc{veryHigh === 1 ? "y" : "ies"} — closest follow-up needed
        </Banner>
      )}
      <>
        <SearchBox value={q} onChange={setQ} placeholder="Search mother name or MRN…" />
        {maternity.listLoading && maternity.anc.length === 0 ? (
          <Loader text="Loading…" />
        ) : rows.length === 0 ? (
          <Empty>No active high-risk pregnancies.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <AncRow key={r._id} r={r} showFactors />
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
