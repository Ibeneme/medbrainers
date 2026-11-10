"use client";

import { addAnaesthesiaRecord } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, TH, clean, plain, toIso, toLocalInput, useTH } from "@/components/theater/th-ui";

export default function NewAnaesthesiaRecordPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Anaesthesia record" subtitle="Intra-operative anaesthetic chart" backHref={`${TBASE}/anaesthesia-record`} submitLabel="Save record" statuses={["pre-op", "in-theatre", "recovery", "completed"]}
      initial={{ anaesthesiaType: "General", agents: "", airwayManagement: "", monitoring: "", fluids: "", events: "", startTime: toLocalInput(), endTime: "", notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField] },
        { title: "Technique", fields: [
          { key: "anaesthesiaType", label: "Anaesthesia type", type: "select", required: true, options: plain(TH.anaesthesiaTypes) },
          { key: "airwayManagement", label: "Airway management", placeholder: "e.g. ETT 7.5 oral, grade 1 view" },
          { key: "agents", label: "Agents & drugs", type: "textarea", span: 2, placeholder: "Induction, maintenance, relaxants, analgesia, reversal" },
          { key: "monitoring", label: "Monitoring", type: "textarea", span: 2, placeholder: "e.g. ECG, SpO₂, NIBP, EtCO₂, temperature" },
          { key: "fluids", label: "Fluids & blood given", type: "textarea", span: 2 },
        ] },
        { title: "Timing & events", fields: [
          { key: "startTime", label: "Anaesthesia start", type: "datetime" }, { key: "endTime", label: "Anaesthesia end", type: "datetime" },
          { key: "events", label: "Critical events", type: "textarea", span: 2, placeholder: "e.g. Hypotension at 40 min, treated with ephedrine" },
          { key: "notes", label: "Notes", type: "textarea", span: 2 },
        ] },
      ]}
      submit={async (v) => { const r = await act(addAnaesthesiaRecord({ facilityId, caseId: v.caseId, payload: clean({ anaesthesiaType: v.anaesthesiaType, agents: v.agents, airwayManagement: v.airwayManagement, monitoring: v.monitoring, fluids: v.fluids, events: v.events, startTime: toIso(v.startTime), endTime: toIso(v.endTime), notes: v.notes }) as any }), "Anaesthesia record saved"); if (r) router.push(`${TBASE}/schedule/${v.caseId}`); }} />
  );
}
