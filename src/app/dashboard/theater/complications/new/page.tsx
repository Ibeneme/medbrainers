"use client";

import { addComplication } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, TH, clean, label, opts, useTH } from "@/components/theater/th-ui";

export default function NewComplicationPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Report surgical complication" subtitle="Adverse event during or after surgery" backHref={`${TBASE}/complications`} submitLabel="Report complication"
      initial={{ description: "", severity: "minor", actionTaken: "", notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField] },
        { title: "Event", fields: [
          { key: "description", label: "What happened", type: "textarea", required: true, span: 2, rows: 4 },
          { key: "severity", label: "Severity", type: "select", options: opts(TH.severities) },
          { key: "actionTaken", label: "Action taken", type: "textarea", span: 2 },
          { key: "notes", label: "Notes", type: "textarea", span: 2 },
        ] },
      ]}
      danger={false}
      confirm={(v) => ["major", "death"].includes(v.severity) ? { title: `Report a ${label(v.severity).toLowerCase()} complication?`, message: "This is a serious event. Inform the surgeon-in-charge and the medical director, and complete an incident report.", label: "Report complication", tone: "danger" } : null}
      submit={async (v) => { const r = await act(addComplication({ facilityId, caseId: v.caseId, payload: clean({ description: v.description.trim(), severity: v.severity, actionTaken: v.actionTaken, notes: v.notes }) as any }), "Complication recorded"); if (r) router.push(`${TBASE}/complications`); }} />
  );
}
