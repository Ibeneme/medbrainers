"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { Plus, Syringe } from "lucide-react";
import { fetchImmunizations } from "@/api/slices";
import {
  BASE, Banner, Btn, DataTable, ENUMS, Flag, Header, Loader, MPill, Page, PatientCell, Pills, SearchBox, SectionCard, fmtDate, isOverdue,
  label, matchesPatient, useMat,
} from "@/components/maternity/mat-ui";

export default function ImmunizationPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("scheduled");
  useEffect(() => {
    if (facilityId) act(fetchImmunizations({ facilityId }), false);
  }, [facilityId, act]);
  const all = maternity.immunizations;
  const overdue = all.filter((r) => isOverdue(r.scheduledDate, r.status)).length;
  const rows = all.filter((r) => (status === "all" || r.status === status) && matchesPatient(r.patient, q));
  return (
    <Page>
      <Header icon={<Syringe size={22} />} title="Immunization Schedule" subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/immunization/new`}><Plus size={16} /> Schedule vaccine</Btn>} />
      {overdue > 0 && (
        <Banner tone="bad">
          {overdue} scheduled dose{overdue === 1 ? " is" : "s are"} overdue — trace and recall the children.
        </Banner>
      )}
      <SectionCard title="Doses" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient name or MRN…" />
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, ...ENUMS.immunizationStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        {maternity.listLoading && !all.length ? <Loader /> : (
          <DataTable
            head={["Patient", "Vaccine", "Dose", "Scheduled", "Given", "Status", ""]}
            empty="No immunization records match."
            rows={rows.map((r) => {
              const od = isOverdue(r.scheduledDate, r.status);
              return [
                <PatientCell key="p" p={r.patient} />,
                <span key="v" className="font-semibold">{r.vaccineName}</span>,
                r.doseNumber ?? "—",
                <Flag key="s" tone={od ? "bad" : undefined}>{fmtDate(r.scheduledDate)}{od ? " · overdue" : ""}</Flag>,
                r.administeredDate ? `${fmtDate(r.administeredDate)}${r.batchNumber ? ` · batch ${r.batchNumber}` : ""}` : "—",
                <MPill key="st" value={r.status} />,
                r.status === "scheduled" ? <Link key="a" className="text-xs font-semibold underline" href={`${BASE}/immunization/${r._id}/administer`}>Administer</Link> : null,
              ];
            })}
          />
        )}
      </SectionCard>
    </Page>
  );
}
