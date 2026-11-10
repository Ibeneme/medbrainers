"use client";

import { startRecovery } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, clean, useTH } from "@/components/theater/th-ui";

export default function StartRecoveryPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Move patient to recovery" subtitle="Start the PACU record" backHref={`${TBASE}/recovery`} submitLabel="Move to recovery" statuses={["in-theatre", "pre-op"]}
      initial={{ notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField, { key: "notes", label: "Handover notes", type: "textarea", rows: 4, placeholder: "Airway, analgesia given, lines and drains, anything the recovery nurse must know" }] },
      ]}
      confirm={{ title: "Move this patient to recovery?", message: "The case status changes to “recovery” and a recovery record is opened. Make sure the sign-out checklist and counts are done.", label: "Move to recovery", tone: "primary" }}
      submit={async (v) => { const r = await act(startRecovery({ facilityId, caseId: v.caseId, payload: clean({ notes: v.notes }) as any }), "Patient moved to recovery"); if (r) router.push(`${TBASE}/recovery`); }} />
  );
}
