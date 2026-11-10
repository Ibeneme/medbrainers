"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { openErTrauma } from "@/api/slices";
import { BASE, ER, Loader, Page, RegContext, SpecForm, clean, idOf, num, useER, useForm, useRegOptions } from "@/components/emergency/er-ui";

const PRIMARY_TEMPLATE = "A – Airway: \nB – Breathing: \nC – Circulation: \nD – Disability: \nE – Exposure: ";

function Inner() {
  const pre = useSearchParams().get("registrationId") || "";
  const { facilityId, act, router, emergency } = useER();
  const { options, byId } = useRegOptions(pre || undefined);
  const form = useForm<any>({ registrationId: pre, mechanism: "", injuries: [], gcs: "", primarySurvey: PRIMARY_TEMPLATE, notes: "" });
  const gcs = num(form.v.gcs);

  return (
    <SpecForm
      form={form}
      backHref={pre ? `${BASE}/tracker/${pre}` : `${BASE}/trauma`}
      title="Open trauma case"
      subtitle="Primary survey and mechanism"
      submitLabel="Open trauma case"
      saving={emergency.saving}
      canSubmit={gcs === undefined || (gcs >= 3 && gcs <= 15)}
      top={<RegContext r={byId(form.v.registrationId)} />}
      sections={[
        { cols: 1, fields: [{ key: "registrationId", label: "ER patient", type: "select", required: true, searchable: true, options }] },
        {
          title: "Mechanism & injuries",
          fields: [
            { key: "mechanism", label: "Mechanism of injury", type: "select", searchable: true, options: ER.mechanisms.map((m) => ({ value: m, label: m })) },
            { key: "gcs", label: "Glasgow Coma Scale (3–15)", type: "number", min: 3, max: 15, step: 1 },
            { key: "injuries", label: "Injured regions", type: "chips", span: 2, options: ER.injuryRegions.map((i) => ({ value: i, label: i })) },
          ],
        },
        { title: "Primary survey", cols: 1, fields: [{ key: "primarySurvey", type: "textarea", rows: 6 }, { key: "notes", label: "Notes", type: "textarea" }] },
      ]}
      onSubmit={async (v) => {
        const payload: any = clean({ registrationId: v.registrationId, mechanism: v.mechanism, injuries: v.injuries?.length ? v.injuries : undefined, gcs: num(v.gcs), primarySurvey: v.primarySurvey?.trim() === PRIMARY_TEMPLATE.trim() ? undefined : v.primarySurvey?.trim(), notes: v.notes?.trim() });
        const res: any = await act(openErTrauma({ facilityId, payload }), "Trauma case opened");
        if (res) router.push(res === true ? `${BASE}/trauma` : `${BASE}/trauma/${idOf(res)}`);
      }}
    />
  );
}

export default function NewTraumaPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
