"use client";

import { addPreOp } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, TH, clean, opts, plain, useTH } from "@/components/theater/th-ui";

export default function NewPreOpPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Pre-op assessment" subtitle="Is the patient fit for surgery?" backHref={`${TBASE}/pre-op`} submitLabel="Save assessment" statuses={["scheduled", "pre-op"]}
      initial={{ asaGrade: "", airway: "", comorbidities: "", medications: "", allergies: "", investigations: "", fitnessForSurgery: "fit", notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField] },
        { title: "Anaesthetic risk", fields: [
          { key: "asaGrade", label: "ASA grade", type: "select", options: plain(TH.asa), hint: "I healthy … V moribund" },
          { key: "airway", label: "Airway assessment", type: "select", options: plain(TH.airway) },
        ] },
        { title: "History", cols: 1, fields: [
          { key: "comorbidities", label: "Comorbidities", type: "textarea", placeholder: "e.g. Hypertension, type 2 diabetes" },
          { key: "medications", label: "Current medications", type: "textarea" },
          { key: "allergies", label: "Allergies", type: "textarea", placeholder: "Drug, latex or food allergies" },
          { key: "investigations", label: "Investigations / results", type: "textarea", placeholder: "e.g. Hb 12.1, ECG normal, CXR clear" },
        ] },
        { title: "Decision", fields: [
          { key: "fitnessForSurgery", label: "Fitness for surgery", type: "select", required: true, options: opts(TH.fitness) },
          { key: "notes", label: "Notes", type: "textarea", span: 2 },
        ] },
      ]}
      danger={false}
      confirm={(v) => v.fitnessForSurgery === "unfit" ? { title: "Mark patient UNFIT for surgery?", message: "Surgery should not go ahead until the patient is optimised and reassessed.", label: "Mark unfit", tone: "danger" } : null}
      submit={async (v, c) => { const r = await act(addPreOp({ facilityId, caseId: v.caseId, payload: clean({ asaGrade: v.asaGrade, airway: v.airway, comorbidities: v.comorbidities, medications: v.medications, allergies: v.allergies, investigations: v.investigations, fitnessForSurgery: v.fitnessForSurgery, notes: v.notes }) as any }), "Pre-op assessment saved"); if (r) router.push(`${TBASE}/schedule/${v.caseId}`); }} />
  );
}
