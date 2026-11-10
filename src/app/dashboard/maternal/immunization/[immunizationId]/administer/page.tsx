"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { administerImmunization, fetchImmunizations } from "@/api/slices";
import {
  BASE, Card, INJECTION_SITES, KV, KVGrid, Loader, MPill, NotFound, Page, SpecForm, SuggestInput, clean, fmtDate, nameOf, useForm, useMat,
  type SectionSpec,
} from "@/components/maternity/mat-ui";

export default function AdministerPage() {
  const { immunizationId } = useParams() as { immunizationId: string };
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ batchNumber: "", site: "", notes: "" });
  useEffect(() => {
    if (facilityId) act(fetchImmunizations({ facilityId }), false);
  }, [facilityId, act]);
  const r = maternity.immunizations.find((x) => x._id === immunizationId);

  if (!r) return maternity.listLoading ? <Page narrow><Loader /></Page> : <Page narrow><NotFound what="Immunization record" href={`${BASE}/immunization`} /></Page>;

  const sections: SectionSpec[] = [
    {
      cols: 1,
      fields: [
        { key: "batchNumber", label: "Vaccine batch number", placeholder: "Batch / lot number" },
        { key: "site", label: "Site", type: "custom", render: (v, set) => <SuggestInput value={v.site} onChange={(x) => set("site", x)} presets={INJECTION_SITES} placeholder="Site of administration" /> },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];
  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/immunization`} title="Administer vaccine"
      subtitle={`${r.vaccineName}${r.doseNumber ? ` · dose ${r.doseNumber}` : ""}`}
      top={
        <Card className="space-y-3">
          <KVGrid cols={3}>
            <KV label="Patient">{nameOf(r.patient)}</KV>
            <KV label="Scheduled">{fmtDate(r.scheduledDate)}</KV>
            <KV label="Status"><MPill value={r.status} /></KV>
          </KVGrid>
          <p className="text-[10px] opacity-50">The administration time and your name are recorded automatically.</p>
        </Card>
      }
      submitLabel="Record as given" saving={maternity.saving} canSubmit={r.status === "scheduled"}
      confirm={{ title: "Record vaccine as given?", message: `${r.vaccineName} will be marked as administered to ${nameOf(r.patient)} now.`, label: "Record as given" }}
      onSubmit={async (x) => {
        const res = await act(administerImmunization({ facilityId, id: immunizationId, payload: clean({ batchNumber: x.batchNumber, site: x.site, notes: x.notes }) as any }));
        if (res) router.push(`${BASE}/immunization`);
      }} />
  );
}
