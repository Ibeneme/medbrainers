"use client";

import { useEffect, useMemo, useState } from "react";
import { FileWarning, Plus } from "lucide-react";
import { fetchErMedicoLegal } from "@/api/slices";
import { BASE, Btn, Empty, ErPill, Header, Loader, Page, Pills, RowLink, SearchBox, SectionCard, TriageBadge, fmtDateTime, rowPatientName, useER } from "@/components/emergency/er-ui";

export default function MedicoLegalListPage() {
  const { facilityId, act, emergency, activeFacility } = useER();
  const [q, setQ] = useState("");
  const [police, setPolice] = useState("all");
  useEffect(() => { if (facilityId) act(fetchErMedicoLegal({ facilityId }), false); }, [facilityId, act]);

  const rows = useMemo(
    () => emergency.medicoLegal.filter((m) => (police === "all" || (police === "yes") === m.policeNotified) && (!q.trim() || [rowPatientName(m), m.caseType, m.crimeNumber, m.policeStation].some((x) => (x || "").toLowerCase().includes(q.toLowerCase())))),
    [emergency.medicoLegal, q, police],
  );

  return (
    <Page>
      <Header icon={<FileWarning size={22} />} title="Medico-Legal Cases" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/medico-legal/new`}><Plus size={16} /> Open case</Btn>} />
      <SectionCard title="Cases" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient, case type, crime no…" />
        <Pills value={police} onChange={setPolice} options={[{ value: "all", label: "All" }, { value: "yes", label: "Police notified" }, { value: "no", label: "Police not notified" }]} />
        {emergency.listLoading && !emergency.medicoLegal.length ? <Loader /> : rows.length === 0 ? <Empty>No medico-legal cases.</Empty> : (
          <div className="space-y-3">
            {rows.map((m) => {
              const reg = typeof m.registration === "string" ? null : m.registration;
              return (
                <RowLink key={m._id} href={`${BASE}/medico-legal/${m._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <TriageBadge category={reg?.triageCategory} size="md" />
                      <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{rowPatientName(m)}</p><p className="truncate text-xs opacity-50">{m.caseType}</p></div>
                    </div>
                    <p className="text-xs opacity-65">{m.policeStation || "No station recorded"}{m.crimeNumber ? <><br />Ref {m.crimeNumber}</> : null}</p>
                    <p className="text-xs opacity-60">{fmtDateTime(m.createdAt)}</p>
                    <ErPill tone={m.policeNotified ? "ok" : "warn"}>{m.policeNotified ? "Police notified" : "Not notified"}</ErPill>
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
