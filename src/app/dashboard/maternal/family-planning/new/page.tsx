"use client";

import { useSearchParams } from "next/navigation";
import { recordFamilyPlanning } from "@/api/slices";
import {
  BASE, ENUMS, SpecForm, Suspended, clean, patientField, quickDateField, todayLocal, toOpts, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ patientId: sp.get("patientId") || "", method: "", startDate: todayLocal(), nextAppointment: "", notes: "" });
  const sections: SectionSpec[] = [
    {
      fields: [
        patientField("patientId", "Client", { span: 2 }),
        { key: "method", label: "Method", type: "select", required: true, options: toOpts(ENUMS.fpMethods) },
        { key: "startDate", label: "Start date", type: "date" },
        quickDateField("nextAppointment", "Next appointment", [["+1 month", 30], ["+3 months", 90], ["+6 months", 180], ["+1 year", 365]], {
          from: (x) => x.startDate, span: 2,
          hint: "Injectables are usually repeated every 3 months, pills monthly.",
        }),
        { key: "notes", label: "Counselling / notes", type: "textarea", span: 2 },
      ],
    },
  ];
  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/family-planning`} title="Record family planning"
      subtitle="New method" submitLabel="Save" saving={maternity.saving}
      onSubmit={async (x) => {
        const r = await act(recordFamilyPlanning({ facilityId, payload: clean({ patientId: x.patientId, method: x.method, startDate: x.startDate, nextAppointment: x.nextAppointment, notes: x.notes }) as any }));
        if (r) router.push(`${BASE}/family-planning`);
      }} />
  );
}

export default function NewFamilyPlanningPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
