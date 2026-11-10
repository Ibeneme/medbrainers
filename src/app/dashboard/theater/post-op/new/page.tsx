"use client";

import { addOperationNote } from "@/api/slices/theaterSlice";
import { Banner, CaseFormPage, TBASE, clean, useTH } from "@/components/theater/th-ui";

/** The server stores post-op orders on the operation note (field postoperativeOrders), so this form saves one. */
export default function NewPostOpOrdersPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Post-operative orders" subtitle="Instructions for ward and recovery staff" backHref={`${TBASE}/post-op`} submitLabel="Save orders" statuses={["in-theatre", "recovery", "completed"]}
      initial={{ procedurePerformed: "", postoperativeOrders: "" }}
      top={<Banner tone="info">Post-op orders are saved on the operation note for this case.</Banner>}
      sections={({ caseField, selected }) => [
        { cols: 1, fields: [caseField,
          { key: "procedurePerformed", label: "Procedure performed", required: true, placeholder: selected ? selected.procedureName : "What was done" },
          { key: "postoperativeOrders", label: "Orders", type: "textarea", rows: 8, required: true, placeholder: "Observations, fluids, analgesia, antibiotics, diet, mobilisation, drains, DVT prophylaxis, when to call the surgeon" }] },
      ]}
      submit={async (v) => { const r = await act(addOperationNote({ facilityId, caseId: v.caseId, payload: clean({ procedurePerformed: v.procedurePerformed.trim(), postoperativeOrders: v.postoperativeOrders.trim() }) as any }), "Post-op orders saved"); if (r) router.push(`${TBASE}/post-op`); }} />
  );
}
