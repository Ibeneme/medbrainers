"use client";

import { useParams } from "next/navigation";
import { recordTransfusionVitals } from "@/api/slices";
import { BASE, SpecForm, clean, pickVitals, useBB, useForm, vitalsFields } from "@/components/blood-bank/bb-ui";

export default function TransfusionVitalsPage() {
  const { transfusionId } = useParams() as { transfusionId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ notes: "" });
  const any = Object.keys(pickVitals(form.v)).length > 0;
  return (
    <SpecForm form={form} backHref={`${BASE}/transfusions/${transfusionId}`} title="Record observations" subtitle="Enter at least one vital sign"
      sections={[{ cols: 3, fields: vitalsFields() }, { cols: 1, fields: [{ key: "notes", label: "Notes", type: "textarea" }] }]}
      submitLabel="Save observations" saving={bloodBank.saving} canSubmit={any}
      onSubmit={async (v) => { const r = await act(recordTransfusionVitals({ facilityId, transfusionId, payload: { vitals: pickVitals(v), ...clean({ notes: v.notes }) } as any }), "Vitals recorded"); if (r) router.push(`${BASE}/transfusions/${transfusionId}`); }} />
  );
}
