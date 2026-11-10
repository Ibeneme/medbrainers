"use client";

import { useEffect, useState } from "react";
import { Plus, Stethoscope } from "lucide-react";
import { fetchPaediatricVisits } from "@/api/slices";
import {
  BASE, Btn, DataTable, Header, Loader, Page, PatientCell, SearchBox, SectionCard, fmtDate, fmtDateTime, matchesPatient, useMat,
} from "@/components/maternity/mat-ui";

export default function PaediatricsPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");
  useEffect(() => {
    if (facilityId) act(fetchPaediatricVisits({ facilityId }), false);
  }, [facilityId, act]);
  const rows = maternity.paediatrics.filter((v) => matchesPatient(v.patient, q));
  return (
    <Page>
      <Header icon={<Stethoscope size={22} />} title="Paediatric Clinic" subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/paediatrics/new`}><Plus size={16} /> New visit</Btn>} />
      <SectionCard title="Visits" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search child name or MRN…" />
        {maternity.listLoading && !maternity.paediatrics.length ? <Loader /> : (
          <DataTable
            head={["Visit", "Child", "Complaint", "Diagnosis", "Treatment", "Follow-up"]}
            empty="No paediatric visits recorded."
            rows={rows.map((v) => [
              fmtDateTime(v.visitDate), <PatientCell key="p" p={v.patient} />,
              <span key="c" className="text-xs">{v.chiefComplaint || "—"}</span>,
              <span key="d" className="text-xs font-semibold">{v.diagnosis || "—"}</span>,
              <span key="t" className="text-xs opacity-75">{v.treatment || "—"}</span>,
              fmtDate(v.followUpDate),
            ])}
          />
        )}
      </SectionCard>
    </Page>
  );
}
