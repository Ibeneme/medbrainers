"use client";

import { useSearchParams } from "next/navigation";
import { enrolNutrition } from "@/api/slices";
import { BASE, NUTRITION_PROGRAMMES, SpecForm, Suspended, clean, patientField, suggestField, useForm, useMat, type SectionSpec } from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ patientId: sp.get("patientId") || "", programme: "", notes: "" });
  const sections: SectionSpec[] = [
    {
      cols: 1,
      fields: [
        patientField("patientId", "Patient"),
        suggestField("programme", "Programme", NUTRITION_PROGRAMMES, { required: true }),
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];
  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/nutrition`} title="Enrol in nutrition programme"
      subtitle="New enrolment" submitLabel="Enrol" saving={maternity.saving}
      onSubmit={async (x) => {
        const r = await act(enrolNutrition({ facilityId, payload: clean({ patientId: x.patientId, programme: x.programme.trim(), notes: x.notes }) as any }));
        if (r) router.push(`${BASE}/nutrition`);
      }} />
  );
}

export default function EnrolNutritionPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
