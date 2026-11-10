"use client";

import { useSearchParams } from "next/navigation";
import { addPaediatricVisit } from "@/api/slices";
import { BASE, SpecForm, Suspended, clean, patientField, quickDateField, useForm, useMat, type SectionSpec } from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ patientId: sp.get("patientId") || "", chiefComplaint: "", examination: "", diagnosis: "", treatment: "", followUpDate: "", notes: "" });
  const sections: SectionSpec[] = [
    {
      cols: 1,
      fields: [
        patientField("patientId", "Child"),
        { key: "chiefComplaint", label: "Presenting complaint", type: "textarea", rows: 2 },
        { key: "examination", label: "Examination", type: "textarea" },
        { key: "diagnosis", label: "Diagnosis" },
        { key: "treatment", label: "Treatment", type: "textarea", rows: 2 },
        quickDateField("followUpDate", "Follow-up", [["+3 days", 3], ["+1 week", 7], ["+2 weeks", 14], ["+1 month", 30]]),
        { key: "notes", label: "Notes", type: "textarea", rows: 2 },
      ],
    },
  ];
  const ok = !!(form.v.chiefComplaint?.trim() || form.v.diagnosis?.trim());
  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/paediatrics`} title="Paediatric visit"
      subtitle="Enter a complaint or diagnosis" submitLabel="Save visit" saving={maternity.saving} canSubmit={ok}
      onSubmit={async (x) => {
        const r = await act(addPaediatricVisit({ facilityId, payload: clean({ patientId: x.patientId, chiefComplaint: x.chiefComplaint, examination: x.examination, diagnosis: x.diagnosis, treatment: x.treatment, followUpDate: x.followUpDate, notes: x.notes }) as any }));
        if (r) router.push(`${BASE}/paediatrics`);
      }} />
  );
}

export default function NewPaediatricVisitPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
