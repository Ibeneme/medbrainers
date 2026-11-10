"use client";

import { useParams } from "next/navigation";
import { dischargeRecovery } from "@/api/slices/theaterSlice";
import { Card, SpecForm, TBASE, clean, fmtDateTime, num, patientLabel, useForm, useTH } from "@/components/theater/th-ui";

export default function DischargeRecoveryPage() {
  const { recoveryId } = useParams() as { recoveryId: string };
  const { facilityId, act, router, theater } = useTH();
  const rec: any = (theater.records.recovery || []).find((r: any) => r._id === recoveryId);
  const form = useForm<any>({ aldreteScore: "", painScore: "", notes: "" });
  const low = num(form.v.aldreteScore) !== undefined && num(form.v.aldreteScore)! < 9;

  return (
    <SpecForm form={form} backHref={`${TBASE}/recovery`} title="Discharge from recovery" subtitle={rec ? patientLabel(rec.patient) : "Record discharge scores"}
      top={rec ? <Card className="text-sm opacity-80">Arrived {fmtDateTime(rec.arrivedAt)}{rec.theatreCase?.procedureName ? ` · ${rec.theatreCase.procedureName}` : ""}</Card> : undefined}
      sections={[{ title: "Discharge criteria", desc: "Aldrete score of 9 or more usually means the patient is ready to return to the ward.", fields: [
        { key: "aldreteScore", label: "Aldrete score (0–10)", type: "number", min: 0, max: 10, required: true },
        { key: "painScore", label: "Pain score (0–10)", type: "number", min: 0, max: 10 },
        { key: "notes", label: "Handover to ward", type: "textarea", span: 2, placeholder: "Orders, observations frequency, analgesia plan, drains" },
      ] }]}
      submitLabel="Discharge to ward" saving={theater.saving}
      confirm={() => low ? { title: "Aldrete score below 9", message: "The patient may not be ready to leave recovery. Discharge anyway?", label: "Discharge anyway", tone: "danger" } : { title: "Discharge this patient?", message: "The recovery record is closed with the time of discharge.", label: "Discharge", tone: "primary" }}
      onSubmit={async (v) => { const r = await act(dischargeRecovery({ facilityId, recoveryId, payload: clean({ aldreteScore: num(v.aldreteScore), painScore: num(v.painScore), notes: v.notes }) as any }), "Patient discharged from recovery"); if (r) router.push(`${TBASE}/recovery`); }} />
  );
}
