"use client";

import { useParams } from "next/navigation";
import { stopTransfusion } from "@/api/slices";
import { BASE, SpecForm, clean, num, pickVitals, toIso, toLocalInput, useBB, useForm, vitalsFields } from "@/components/blood-bank/bb-ui";

export default function StopTransfusionPage() {
  const { transfusionId } = useParams() as { transfusionId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ reason: "", volumeTransfusedMl: "", endedAt: toLocalInput(), notes: "" });
  return (
    <SpecForm form={form} backHref={`${BASE}/transfusions/${transfusionId}`} title="Stop transfusion" subtitle="Ending early, e.g. suspected reaction"
      sections={[
        { cols: 1, fields: [{ key: "reason", label: "Reason for stopping", type: "textarea", required: true }] },
        { fields: [{ key: "volumeTransfusedMl", label: "Volume given so far (mL)", type: "number", min: 0, max: 5000 }, { key: "endedAt", label: "Stopped at", type: "datetime" }] },
        { title: "Vitals at stop", cols: 3, fields: vitalsFields("post_") },
      ]}
      submitLabel="Stop transfusion" danger saving={bloodBank.saving}
      confirm={{ title: "Stop this transfusion?", message: "Keep the IV line open with saline, recheck identity, and report a reaction if the patient is unwell.", label: "Stop transfusion", tone: "danger" }}
      onSubmit={async (v) => {
        const post = pickVitals(v, "post_");
        const payload: any = clean({ reason: v.reason.trim(), volumeTransfusedMl: num(v.volumeTransfusedMl), endedAt: toIso(v.endedAt), notes: v.notes });
        if (Object.keys(post).length) payload.postVitals = post;
        const r = await act(stopTransfusion({ facilityId, transfusionId, payload }), "Transfusion stopped");
        if (r) router.push(`${BASE}/reactions/new?transfusionId=${transfusionId}`);
      }} />
  );
}
