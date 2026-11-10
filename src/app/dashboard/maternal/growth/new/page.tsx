"use client";

import { useSearchParams } from "next/navigation";
import { addGrowthRecord } from "@/api/slices";
import {
  BASE, Card, MPill, SpecForm, Suspended, ageMonthsAt, clean, muacClass, num, patientField, toIso, toLocalInput, useForm, useMat,
  type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ patientId: sp.get("patientId") || "", measuredAt: toLocalInput(), ageMonths: "", weightKg: "", lengthCm: "", headCircumferenceCm: "", muacCm: "", notes: "" });
  const v = form.v;
  const muac = muacClass(num(v.muacCm));
  const age = num(v.ageMonths);

  const sections: SectionSpec[] = [
    {
      fields: [
        patientField("patientId", "Child", {
          span: 2,
          onPick: (p) => {
            const m = ageMonthsAt(p?.dateOfBirth);
            if (m !== undefined) form.set("ageMonths", String(m));
          },
        }),
        { key: "measuredAt", label: "Measured on", type: "datetime" },
        { key: "ageMonths", label: "Age (months)", type: "number", min: 0, max: 240, step: 1, hint: "Filled from the date of birth when known." },
      ],
    },
    {
      title: "Measurements",
      cols: 2,
      fields: [
        { key: "weightKg", label: "Weight (kg)", type: "number", min: 0.3, max: 150, step: 0.01 },
        { key: "lengthCm", label: "Length / height (cm)", type: "number", min: 20, max: 220, step: 0.1 },
        { key: "headCircumferenceCm", label: "Head circumference (cm)", type: "number", min: 15, max: 65, step: 0.1 },
        { key: "muacCm", label: "MUAC (cm)", type: "number", min: 5, max: 40, step: 0.1 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];
  const any = ["weightKg", "lengthCm", "headCircumferenceCm", "muacCm"].some((k) => String(v[k]).trim() !== "");

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/growth${v.patientId ? `?patientId=${v.patientId}` : ""}`} title="Record growth measurement"
      subtitle="Enter at least one measurement"
      top={muac ? (
        <Card className="flex flex-wrap items-center gap-2">
          <span className="text-sm">MUAC {v.muacCm} cm</span><MPill tone={muac.tone}>{muac.key}</MPill>
          <span className="text-[10px] opacity-50">{age !== undefined && (age < 6 || age > 59) ? "MUAC cut-offs apply to children aged 6–59 months." : "6–59 months: <11.5 SAM, 11.5–12.4 MAM."}</span>
        </Card>
      ) : undefined}
      submitLabel="Save measurement" saving={maternity.saving} canSubmit={any}
      onSubmit={async (x) => {
        const payload = clean({
          patientId: x.patientId, measuredAt: toIso(x.measuredAt), ageMonths: num(x.ageMonths), weightKg: num(x.weightKg),
          lengthCm: num(x.lengthCm), headCircumferenceCm: num(x.headCircumferenceCm), muacCm: num(x.muacCm), notes: x.notes,
        }) as any;
        const r = await act(addGrowthRecord({ facilityId, payload }));
        if (r) router.push(`${BASE}/growth?patientId=${x.patientId}`);
      }} />
  );
}

export default function NewGrowthPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
