"use client";

import { addPreOp } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, TH, clean, opts, plain, useTH } from "@/components/theater/th-ui";

/**
 * The server has one pre-operative assessment record (POST /cases/:id/pre-op). The anaesthetist's review is saved
 * through it and tagged "Anaesthetic review" in the notes so the two lists can be told apart.
 */
export default function NewAnaesthesiaReviewPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Anaesthesia review" subtitle="Anaesthetist's pre-operative assessment" backHref={`${TBASE}/anaesthesia`} submitLabel="Save review" statuses={["scheduled", "pre-op"]}
      initial={{ asaGrade: "", airway: "", medications: "", allergies: "", plan: "General", fasted: false, fitnessForSurgery: "fit", notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField] },
        { title: "Review", fields: [
          { key: "asaGrade", label: "ASA grade", type: "select", options: plain(TH.asa) },
          { key: "airway", label: "Airway assessment", type: "select", options: plain(TH.airway) },
          { key: "plan", label: "Planned anaesthesia", type: "select", options: plain(TH.anaesthesiaTypes) },
          { key: "fasted", type: "toggle", label: "Fasting confirmed", hint: "Solids 6 hours, clear fluids 2 hours" },
          { key: "medications", label: "Medications to hold / continue", type: "textarea", span: 2 },
          { key: "allergies", label: "Allergies", type: "textarea", span: 2 },
        ] },
        { title: "Decision", fields: [
          { key: "fitnessForSurgery", label: "Fitness for anaesthesia", type: "select", required: true, options: opts(TH.fitness) },
          { key: "notes", label: "Additional notes", type: "textarea", span: 2 },
        ] },
      ]}
      confirm={(v) => v.fitnessForSurgery === "unfit" ? { title: "Mark patient UNFIT?", message: "The patient should not be anaesthetised until optimised and reviewed again.", label: "Mark unfit", tone: "danger" } : null}
      submit={async (v) => {
        const notes = `Anaesthetic review. Plan: ${v.plan}. Fasting ${v.fasted ? "confirmed" : "not confirmed"}.${v.notes ? ` ${v.notes}` : ""}`;
        const r = await act(addPreOp({ facilityId, caseId: v.caseId, payload: clean({ asaGrade: v.asaGrade, airway: v.airway, medications: v.medications, allergies: v.allergies, fitnessForSurgery: v.fitnessForSurgery, notes }) as any }), "Anaesthesia review saved");
        if (r) router.push(`${TBASE}/schedule/${v.caseId}`);
      }} />
  );
}
