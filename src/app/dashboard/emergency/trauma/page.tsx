"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Plus } from "lucide-react";
import { fetchErTrauma } from "@/api/slices";
import {
  BASE, Btn, Empty, GcsChip, Header, Loader, Page, RowLink, SearchBox, SectionCard, TriageBadge,
  fmtDateTime, rowPatientName, useER,
} from "@/components/emergency/er-ui";

export default function TraumaListPage() {
  const { facilityId, act, emergency, activeFacility } = useER();
  const [q, setQ] = useState("");
  useEffect(() => { if (facilityId) act(fetchErTrauma({ facilityId }), false); }, [facilityId, act]);

  const rows = useMemo(
    () => emergency.trauma.filter((t) => !q.trim() || [rowPatientName(t), t.mechanism, ...(t.injuries || [])].some((x) => (x || "").toLowerCase().includes(q.toLowerCase()))),
    [emergency.trauma, q],
  );

  return (
    <Page>
      <Header icon={<Activity size={22} />} title="Trauma Cases" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/trauma/new`}><Plus size={16} /> Open trauma case</Btn>} />
      <SectionCard title="Trauma cases" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient, mechanism or injury…" />
        {emergency.listLoading && !emergency.trauma.length ? <Loader /> : rows.length === 0 ? <Empty>No trauma cases yet.</Empty> : (
          <div className="space-y-3">
            {rows.map((t) => {
              const reg = typeof t.registration === "string" ? null : t.registration;
              return (
                <RowLink key={t._id} href={`${BASE}/trauma/${t._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <TriageBadge category={reg?.triageCategory} size="md" />
                      <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{rowPatientName(t)}</p><p className="truncate text-xs opacity-50">{t.mechanism || "Mechanism not recorded"}</p></div>
                    </div>
                    <p className="line-clamp-2 text-xs opacity-70">{t.injuries?.length ? t.injuries.join(", ") : "No injuries listed"}</p>
                    <p className="text-xs opacity-60">{fmtDateTime(t.createdAt)}</p>
                    <GcsChip gcs={t.gcs} />
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
