"use client";

import { useEffect } from "react";
import { Plus, Scissors } from "lucide-react";
import { fetchCaesareans } from "@/api/slices";
import {
  BASE, Btn, DataTable, Header, Loader, MPill, Page, PatientCell, SectionCard, Stat, fmtDateTime, fmtDuration, minutesBetween, useMat,
} from "@/components/maternity/mat-ui";

export default function CaesareanLogPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  useEffect(() => {
    if (facilityId) act(fetchCaesareans({ facilityId }), false);
  }, [facilityId, act]);
  const rows = maternity.caesareans;
  const count = (u: string) => rows.filter((r) => r.urgency === u).length;

  return (
    <Page>
      <Header icon={<Scissors size={22} />} title="Caesarean Section Log" subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/delivery/caesarean/new`}><Plus size={16} /> Log caesarean</Btn>} />
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Elective" value={count("elective")} />
        <Stat label="Urgent" value={count("urgent")} tone={count("urgent") ? "warn" : undefined} />
        <Stat label="Emergency" value={count("emergency")} tone={count("emergency") ? "bad" : undefined} />
      </div>
      <>
        {maternity.listLoading && !rows.length ? <Loader /> : (
          <DataTable
            head={["Date", "Mother", "Urgency", "Indication", "Incision", "Duration"]}
            empty="No caesarean sections logged."
            rows={rows.map((c) => [
              fmtDateTime(c.startTime || c.createdAt),
              <PatientCell key="p" p={c.patient} />,
              <MPill key="u" value={c.urgency} />,
              <span key="i" className="text-xs">{c.indication}</span>,
              c.incision || "—",
              c.startTime && c.endTime ? fmtDuration(minutesBetween(c.startTime, c.endTime)) : "—",
            ])}
          />
        )}
      </>
    </Page>
  );
}
