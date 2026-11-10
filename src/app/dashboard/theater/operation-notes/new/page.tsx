"use client";

import { addOperationNote } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, clean, num, useTH } from "@/components/theater/th-ui";

export default function NewOperationNotePage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Operation note" subtitle="Surgeon's record of the procedure" backHref={`${TBASE}/operation-notes`} submitLabel="Save operation note" statuses={["pre-op", "in-theatre", "recovery", "completed"]}
      initial={{ procedurePerformed: "", findings: "", technique: "", specimens: "", estimatedBloodLoss: "", complications: "", postoperativeOrders: "" }}
      sections={({ caseField, selected }) => [
        { cols: 1, fields: [caseField, { key: "procedurePerformed", label: "Procedure performed", required: true, placeholder: selected ? selected.procedureName : "What was done", hint: "Edit if the procedure changed during surgery." }] },
        { title: "Findings & technique", cols: 1, fields: [
          { key: "findings", label: "Operative findings", type: "textarea", rows: 4 },
          { key: "technique", label: "Technique", type: "textarea", rows: 4 },
          { key: "specimens", label: "Specimens sent", type: "textarea", rows: 2, placeholder: "e.g. Gallbladder to histology" },
        ] },
        { title: "Outcome", fields: [
          { key: "estimatedBloodLoss", label: "Estimated blood loss (mL)", type: "number", min: 0, max: 20000 },
          { key: "complications", label: "Complications (if any)", type: "textarea", span: 2 },
          { key: "postoperativeOrders", label: "Post-operative orders", type: "textarea", span: 2, rows: 4 },
        ] },
      ]}
      submit={async (v) => { const r = await act(addOperationNote({ facilityId, caseId: v.caseId, payload: clean({ procedurePerformed: v.procedurePerformed.trim(), findings: v.findings, technique: v.technique, specimens: v.specimens, estimatedBloodLoss: num(v.estimatedBloodLoss), complications: v.complications, postoperativeOrders: v.postoperativeOrders }) as any }), "Operation note saved"); if (r) router.push(`${TBASE}/schedule/${v.caseId}`); }} />
  );
}
