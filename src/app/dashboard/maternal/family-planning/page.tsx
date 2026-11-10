"use client";

import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { fetchFamilyPlanning } from "@/api/slices";
import {
  BASE, Btn, DataTable, ENUMS, Header, Loader, MPill, Page, PatientCell, Pills, SearchBox, SectionCard, fmtDate, label,
  matchesPatient, useMat,
} from "@/components/maternity/mat-ui";

export default function FamilyPlanningPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("active");
  const [method, setMethod] = useState("all");
  useEffect(() => {
    if (facilityId) act(fetchFamilyPlanning({ facilityId, active: scope === "active" }), false);
  }, [facilityId, act, scope]);
  const rows = maternity.familyPlanning.filter((r) => (method === "all" || r.method === method) && matchesPatient(r.patient, q));
  return (
    <Page>
      <Header icon={<Users size={22} />} title="Family Planning" subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/family-planning/new`}><Plus size={16} /> Record method</Btn>} />
      <>
        <SearchBox value={q} onChange={setQ} placeholder="Search client name or MRN…" />
        <Pills value={scope} onChange={setScope} options={[{ value: "active", label: "Active" }, { value: "all", label: "Include discontinued" }]} />
        <Pills value={method} onChange={setMethod} options={[{ value: "all", label: "All methods" }, ...ENUMS.fpMethods.map((m) => ({ value: m, label: label(m) }))]} />
        {maternity.listLoading && !maternity.familyPlanning.length ? <Loader /> : (
          <DataTable
            head={["Client", "Method", "Started", "Next appointment", "Status", "Notes"]}
            empty="No family planning records."
            rows={rows.map((r) => [
              <PatientCell key="p" p={r.patient} />,
              <span key="m" className="font-semibold">{label(r.method)}</span>,
              fmtDate(r.startDate),
              fmtDate(r.nextAppointment),
              <MPill key="s" tone={r.isActive ? "ok" : "mute"}>{r.isActive ? "Active" : "Discontinued"}</MPill>,
              <span key="n" className="text-xs opacity-75">{r.notes || "—"}</span>,
            ])}
          />
        )}
      </>
    </Page>
  );
}
