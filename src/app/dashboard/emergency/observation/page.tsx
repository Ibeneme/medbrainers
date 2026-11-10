"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { fetchErActive } from "@/api/slices";
import {
  BASE, Btn, Empty, Header, Loader, Page, RegistrationRow, SearchBox, SectionCard, regName, sortByPriority, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

export default function ObservationPage() {
  const { facilityId, act, emergency, activeFacility } = useER();
  const [q, setQ] = useState("");
  useTick();
  const load = useCallback(() => { if (facilityId) act(fetchErActive({ facilityId }), false); }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId, 30000);

  const rows = useMemo(
    () => sortByPriority(emergency.active.filter((r) => r.status === "observation")).filter((r) => !q.trim() || regName(r).toLowerCase().includes(q.toLowerCase()) || r.chiefComplaint.toLowerCase().includes(q.toLowerCase())),
    [emergency.active, q],
  );

  return (
    <Page>
      <Header icon={<Eye size={22} />} title="Observation Unit" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/tracker`} tone="card">All patients</Btn>} />
      <SectionCard title="Under observation" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name or complaint…" />
        {emergency.listLoading && !emergency.active.length ? <Loader /> : rows.length === 0 ? (
          <Empty>No patients under observation. Move a patient here from their page with “Update status”.</Empty>
        ) : (
          <div className="space-y-3">{rows.map((r) => <RegistrationRow key={r._id} r={r} />)}</div>
        )}
      </SectionCard>
    </Page>
  );
}
