"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { fetchErActive } from "@/api/slices";
import {
  BASE, Btn, ER, Empty, Header, Loader, Page, Pills, RegistrationRow, SearchBox, SectionCard, TRIAGE, TRIAGE_ORDER,
  erLabel, regName, sortByPriority, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, emergency, activeFacility } = useER();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [triage, setTriage] = useState(sp.get("triage") || "all");
  useTick();

  const load = useCallback(() => { if (facilityId) act(fetchErActive({ facilityId }), false); }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId);

  const rows = useMemo(
    () =>
      sortByPriority(emergency.active).filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        if (triage === "untriaged" ? !!r.triageCategory : triage !== "all" && r.triageCategory !== triage) return false;
        const s = q.trim().toLowerCase();
        return !s || regName(r).toLowerCase().includes(s) || r.chiefComplaint.toLowerCase().includes(s) || (r.location || "").toLowerCase().includes(s);
      }),
    [emergency.active, q, status, triage],
  );

  return (
    <Page>
      <Header icon={<Users size={22} />} title="ER Patient Tracker" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/register`}>Register arrival</Btn>} />
      <SectionCard title="In the department" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name, complaint or location…" />
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All stages" }, ...ER.activeStatuses.map((s) => ({ value: s, label: erLabel(s) }))]} />
        <Pills value={triage} onChange={setTriage} options={[{ value: "all", label: "Any triage" }, { value: "untriaged", label: "Untriaged" }, ...TRIAGE_ORDER.map((k) => ({ value: k, label: `${k} · ${TRIAGE[k].label}` }))]} />
        {emergency.listLoading && !emergency.active.length ? <Loader text="Loading patients…" /> : rows.length === 0 ? (
          <Empty>No patients match. New arrivals appear here as soon as they are registered.</Empty>
        ) : (
          <div className="space-y-3">{rows.map((r) => <RegistrationRow key={r._id} r={r} />)}</div>
        )}
      </SectionCard>
    </Page>
  );
}

export default function TrackerPage() {
  return <Suspense fallback={<Page><Loader /></Page>}><Inner /></Suspense>;
}
