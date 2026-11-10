"use client";

import { useParams } from "next/navigation";
import { completeTransfusion } from "@/api/slices";
import { BASE, SpecForm, clean, num, pickVitals, toIso, toLocalInput, useBB, useForm, vitalsFields } from "@/components/blood-bank/bb-ui";

export default function CompleteTransfusionPage() {
  const { transfusionId } = useParams() as { transfusionId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ volumeTransfusedMl: "", endedAt: toLocalInput(), notes: "" });
  return (
    <SpecForm form={form} backHref={`${BASE}/transfusions/${transfusionId}`} title="Complete transfusion" subtitle="Record post-transfusion details"
      sections={[
        { fields: [{ key: "volumeTransfusedMl", label: "Volume transfused (mL)", type: "number", min: 0, max: 5000 }, { key: "endedAt", label: "Ended at", type: "datetime" }] },
        { title: "Post-transfusion vitals", cols: 3, fields: vitalsFields("post_") },
        { cols: 1, fields: [{ key: "notes", label: "Notes", type: "textarea" }] },
      ]}
      submitLabel="Complete transfusion" saving={bloodBank.saving}
      confirm={{ title: "Complete this transfusion?", message: "The unit is marked as transfused and the record is closed.", label: "Complete", tone: "primary" }}
      onSubmit={async (v) => {
        const post = pickVitals(v, "post_");
        const payload: any = clean({ volumeTransfusedMl: num(v.volumeTransfusedMl), endedAt: toIso(v.endedAt), notes: v.notes });
        if (Object.keys(post).length) payload.postVitals = post;
        const r = await act(completeTransfusion({ facilityId, transfusionId, payload }), "Transfusion completed");
        if (r) router.push(`${BASE}/transfusions/${transfusionId}`);
      }} />
  );
}
