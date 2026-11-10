"use client";

import { useEffect, useState } from "react";
import { Plus, Stethoscope } from "lucide-react";
import { fetchPostnatalVisits } from "@/api/slices";
import {
  BASE, Btn, DataTable, Header, Loader, Page, PatientCell, SearchBox, SectionCard, fmtDate, fmtDateTime, matchesPatient, useMat,
} from "@/components/maternity/mat-ui";

export default function PostnatalPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");
  useEffect(() => {
    if (facilityId) act(fetchPostnatalVisits({ facilityId }), false);
  }, [facilityId, act]);
  const rows = maternity.postnatal.filter((v) => matchesPatient(v.patient, q));
  return (
    <Page>
      <Header icon={<Stethoscope size={22} />} title="Postnatal Visits" subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/postnatal/new`}><Plus size={16} /> Record visit</Btn>} />
      <>
        <SearchBox value={q} onChange={setQ} placeholder="Search mother name or MRN…" />
        {maternity.listLoading && !maternity.postnatal.length ? <Loader /> : (
          <DataTable
            head={["Visit", "Mother", "Day", "Findings", "Advice", "Next visit"]}
            empty="No postnatal visits recorded."
            rows={rows.map((v) => [
              fmtDateTime(v.visitDate),
              <PatientCell key="p" p={v.patient} />,
              v.daysPostpartum ?? "—",
              <span key="f" className="text-xs">{v.findings || "—"}</span>,
              <span key="a" className="text-xs opacity-75">{v.advice || "—"}</span>,
              fmtDate(v.nextVisitDate),
            ])}
          />
        )}
      </>
    </Page>
  );
}
