"use client";

import { useParams } from "next/navigation";
import { fetchErTraumaById, updateErTrauma } from "@/api/slices";
import type { ErTrauma } from "@/api/slices/emergencySlice";
import { BASE, ER, Loader, NotFound, Page, SpecForm, num, useER, useForm, useLoad } from "@/components/emergency/er-ui";

function EditForm({ t }: { t: ErTrauma }) {
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>({
    mechanism: t.mechanism || "", injuries: t.injuries || [], gcs: t.gcs ?? "", primarySurvey: t.primarySurvey || "",
    secondarySurvey: t.secondarySurvey || "", interventions: t.interventions || "", disposition: t.disposition || "", notes: t.notes || "",
  });
  const gcs = num(form.v.gcs);
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/trauma/${t._id}`}
      title="Update trauma case"
      subtitle="Secondary survey, interventions and plan"
      saving={emergency.saving}
      canSubmit={gcs === undefined || (gcs >= 3 && gcs <= 15)}
      sections={[
        {
          fields: [
            { key: "mechanism", label: "Mechanism of injury", type: "select", searchable: true, options: ER.mechanisms.map((m) => ({ value: m, label: m })) },
            { key: "gcs", label: "Glasgow Coma Scale (3–15)", type: "number", min: 3, max: 15, step: 1 },
            { key: "injuries", label: "Injured regions", type: "chips", span: 2, options: ER.injuryRegions.map((i) => ({ value: i, label: i })) },
          ],
        },
        {
          cols: 1,
          fields: [
            { key: "primarySurvey", label: "Primary survey (ABCDE)", type: "textarea", rows: 5 },
            { key: "secondarySurvey", label: "Secondary survey (head-to-toe)", type: "textarea", rows: 5 },
            { key: "interventions", label: "Interventions performed", type: "textarea", rows: 4, placeholder: "e.g. Chest drain, pelvic binder, 2 units blood, intubation" },
            { key: "disposition", label: "Disposition plan", placeholder: "e.g. Theatre, ICU, observation" },
            { key: "notes", label: "Notes", type: "textarea" },
          ],
        },
      ]}
      onSubmit={async (v) => {
        const payload: any = { mechanism: v.mechanism || undefined, injuries: v.injuries, gcs: num(v.gcs), primarySurvey: v.primarySurvey?.trim() || undefined, secondarySurvey: v.secondarySurvey?.trim() || undefined, interventions: v.interventions?.trim() || undefined, disposition: v.disposition?.trim() || undefined, notes: v.notes?.trim() || undefined };
        const res = await act(updateErTrauma({ facilityId, traumaId: t._id, payload }), "Trauma case updated");
        if (res) router.push(`${BASE}/trauma/${t._id}`);
      }}
    />
  );
}

export default function EditTraumaPage() {
  const { traumaId } = useParams() as { traumaId: string };
  const er = useER();
  const { data, loading } = useLoad<ErTrauma>(er, (facilityId) => fetchErTraumaById({ facilityId, traumaId }), [traumaId]);
  if (loading) return <Page narrow><Loader /></Page>;
  if (!data) return <Page><NotFound what="Trauma case" href={`${BASE}/trauma`} /></Page>;
  return <EditForm t={data} />;
}
