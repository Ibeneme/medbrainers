"use client";

import { useEffect, useState } from "react";
import { Apple, Plus } from "lucide-react";
import { fetchNutrition } from "@/api/slices";
import {
  BASE, Btn, DataTable, ENUMS, Header, Loader, MPill, Page, PatientCell, Pills, SearchBox, SectionCard, fmtDate, label, matchesPatient, useMat,
} from "@/components/maternity/mat-ui";

export default function NutritionPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");
  useEffect(() => {
    if (facilityId) act(fetchNutrition({ facilityId, status: status === "all" ? undefined : (status as any) }), false);
  }, [facilityId, act, status]);
  const rows = maternity.nutrition.filter((n) => matchesPatient(n.patient, q));
  return (
    <Page>
      <Header icon={<Apple size={22} />} title="Nutrition Programme" subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/nutrition/new`}><Plus size={16} /> Enrol patient</Btn>} />
      <SectionCard title="Enrolments" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient name or MRN…" />
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, ...ENUMS.nutritionStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        {maternity.listLoading && !maternity.nutrition.length ? <Loader /> : (
          <DataTable
            head={["Patient", "Programme", "Enrolled", "Discharged", "Status", "Notes"]}
            empty="No enrolments."
            rows={rows.map((n) => [
              <PatientCell key="p" p={n.patient} />, <span key="g" className="font-semibold">{n.programme}</span>,
              fmtDate(n.enrolledAt), fmtDate(n.dischargedAt), <MPill key="s" value={n.status} />,
              <span key="n" className="text-xs opacity-75">{n.notes || "—"}</span>,
            ])}
          />
        )}
      </SectionCard>
    </Page>
  );
}
