"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, Plus } from "lucide-react";
import { fetchRequests } from "@/api/slices";
import {
  BASE, Bar, Btn, Empty, ENUMS, Header, Loader, Page, Pill, Pills, RowLink, SearchBox, SectionCard,
  fmtDateTime, itemsSummary, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function RequestsPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [scope, setScope] = useState("open");
  const [urgency, setUrgency] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!facilityId) return;
    const load = () =>
      act(fetchRequests({ facilityId, openOnly: scope === "open" || undefined, status: scope !== "open" && scope !== "all" ? scope : undefined, urgency: urgency === "all" ? undefined : urgency, limit: 200 }), false);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [facilityId, act, scope, urgency]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bloodBank.requests.filter((r: any) => !s || nameOf(r.patient).toLowerCase().includes(s) || String(r.patient?.mrn || "").toLowerCase().includes(s) || r.requestNumber.toLowerCase().includes(s));
  }, [bloodBank.requests, q]);

  return (
    <Page>
      <Header icon={<Droplets size={22} />} title="Blood Requests" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/requests/new`}><Plus size={16} /> New request</Btn>} />
      <SectionCard title="Requests" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient, MRN or request no…" />
        <Pills value={scope} onChange={setScope} options={[{ value: "open", label: "Open" }, { value: "all", label: "All" }, ...ENUMS.requestStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        <Pills value={urgency} onChange={setUrgency} options={[{ value: "all", label: "Any urgency" }, ...ENUMS.urgencies.map((s) => ({ value: s, label: label(s) }))]} />
        {bloodBank.listLoading && rows.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No blood requests found.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((r: any) => {
              const p = r.progress || { requested: 0, crossmatched: 0, issued: 0, transfused: 0 };
              return (
                <RowLink key={r._id} href={`${BASE}/requests/${r._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{nameOf(r.patient)}</p>
                      <p className="truncate font-mono text-xs opacity-50">{r.requestNumber}{r.patient?.mrn ? ` · ${r.patient.mrn}` : ""}</p>
                    </div>
                    <div className="text-xs opacity-60">
                      <p>{itemsSummary(r.items)}</p>
                      <p>{r.location || fmtDateTime(r.createdAt)}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs opacity-60">{p.crossmatched} matched · {p.issued} issued · {p.transfused} given / {p.requested}</p>
                      <Bar pct={p.requested ? (p.transfused / p.requested) * 100 : 0} />
                    </div>
                    <div className="flex items-center gap-2"><Pill value={r.urgency} /><Pill value={r.status} /></div>
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
