"use client";

import { useSearchParams } from "next/navigation";
import { scheduleImmunization } from "@/api/slices";
import {
  BASE, SpecForm, Suspended, VACCINES, clean, num, patientField, suggestField, todayLocal, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ patientId: sp.get("patientId") || "", vaccineName: "", doseNumber: "", scheduledDate: todayLocal(), notes: "" });
  const sections: SectionSpec[] = [
    {
      fields: [
        patientField("patientId", "Child / patient", { span: 2 }),
        suggestField("vaccineName", "Vaccine", VACCINES, { required: true, span: 2, hint: "Pick a common vaccine or type your own." }),
        { key: "doseNumber", label: "Dose number", type: "number", min: 1, max: 10, step: 1 },
        { key: "scheduledDate", label: "Scheduled date", type: "date" },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];
  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/immunization`} title="Schedule vaccine"
      subtitle="Immunization schedule" submitLabel="Schedule" saving={maternity.saving}
      onSubmit={async (x) => {
        const r = await act(scheduleImmunization({ facilityId, payload: clean({ patientId: x.patientId, vaccineName: x.vaccineName.trim(), doseNumber: num(x.doseNumber), scheduledDate: x.scheduledDate, notes: x.notes }) as any }));
        if (r) router.push(`${BASE}/immunization`);
      }} />
  );
}

export default function ScheduleVaccinePage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
