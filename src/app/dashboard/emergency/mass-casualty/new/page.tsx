"use client";

import { startErMassCasualty } from "@/api/slices";
import { BASE, SpecForm, clean, idOf, num, useER, useForm } from "@/components/emergency/er-ui";

export default function NewMassCasualtyPage() {
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>({ name: "", description: "", expectedCasualties: "", notes: "" });
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/mass-casualty`}
      title="Activate mass-casualty mode"
      subtitle="Only one event can be active at a time"
      submitLabel="Activate"
      danger
      saving={emergency.saving}
      confirm={{ title: "Activate mass-casualty mode?", message: "This marks the department as responding to a major incident. Every patient who arrives from now on is counted against this event.", label: "Activate", tone: "danger" }}
      sections={[
        {
          fields: [
            { key: "name", label: "Incident name", required: true, span: 2, placeholder: "e.g. Bus collision, Lagos–Ibadan expressway" },
            { key: "expectedCasualties", label: "Expected casualties", type: "number", min: 0, step: 1 },
            { key: "description", label: "What is known", type: "textarea", span: 2 },
            { key: "notes", label: "Notes", type: "textarea", span: 2 },
          ],
        },
      ]}
      onSubmit={async (v) => {
        const res: any = await act(startErMassCasualty({ facilityId, payload: clean({ name: v.name.trim(), description: v.description?.trim(), expectedCasualties: num(v.expectedCasualties), notes: v.notes?.trim() }) as any }), "Mass-casualty mode activated");
        if (res) router.push(res === true ? `${BASE}/mass-casualty` : `${BASE}/mass-casualty/${idOf(res)}`);
      }}
    />
  );
}
