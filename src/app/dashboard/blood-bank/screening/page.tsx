"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { fetchScreenings } from "@/api/slices";
import {
  BASE, Btn, Empty, Header, Loader, Page, Pill, Pills, RowLink, SearchBox, SectionCard,
  ENUMS, fmtDateTime, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function ScreeningListPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [outcome, setOutcome] = useState("all");
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!facilityId) return;
    act(
      fetchScreenings({
        facilityId,
        outcome: outcome === "all" ? undefined : outcome,
        readyOnly: ready || undefined,
        limit: 200,
      }),
      false
    );
  }, [facilityId, act, outcome, ready]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bloodBank.screenings.filter((x: any) => {
      if (!s) return true;
      const d = x.donor || {};
      return (
        nameOf(d).toLowerCase().includes(s) ||
        String(d.donorNumber || "").toLowerCase().includes(s) ||
        String(x.screeningNumber || "").toLowerCase().includes(s)
      );
    });
  }, [bloodBank.screenings, q]);

  return (
    <Page>
      <Header
        icon={<ClipboardCheck size={22} />}
        title="Donor Screening"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/screening/new`}><Plus size={16} /> New screening</Btn>}
      />
      <SectionCard title="Screenings" count={rows.length}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search donor or screening no…" />
          <Pills
            value={ready ? "ready" : "any"}
            onChange={(v) => setReady(v === "ready")}
            options={[{ value: "any", label: "All screenings" }, { value: "ready", label: "Ready to donate" }]}
          />
        </div>
        <Pills
          value={outcome}
          onChange={setOutcome}
          options={[{ value: "all", label: "Any outcome" }, ...ENUMS.screeningOutcomes.map((o) => ({ value: o, label: label(o) }))]}
        />
        {bloodBank.listLoading && rows.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No screenings found.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((s: any) => (
              <RowLink key={s._id} href={`${BASE}/screening/${s._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{nameOf(s.donor)}</p>
                    <p className="truncate font-mono text-xs opacity-50">{s.screeningNumber}{s.donor?.donorNumber ? ` · ${s.donor.donorNumber}` : ""}</p>
                  </div>
                  <p className="text-xs opacity-60">{fmtDateTime(s.screenedAt)}</p>
                  <p className="text-xs opacity-60">
                    Hb {s.vitals?.hemoglobin} · BP {s.vitals?.systolic}/{s.vitals?.diastolic} · {s.vitals?.weightKg} kg
                  </p>
                  <div className="flex items-center gap-2">
                    {s.outcome === "eligible" && (s.used ? <Pill tone="mute">Used</Pill> : <Pill tone="info">Ready</Pill>)}
                    <Pill value={s.outcome} />
                  </div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
