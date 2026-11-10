"use client";

import { addConsent } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, clean, useTH } from "@/components/theater/th-ui";

export default function NewConsentPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Consent form" subtitle="Informed consent for the procedure" backHref={`${TBASE}/consent`} submitLabel="Record consent" statuses={["scheduled", "pre-op", "in-theatre"]}
      initial={{ procedureDescription: "", risksExplained: false, alternativesDiscussed: false, consentGiven: true, witness: "", notes: "" }}
      sections={({ caseField, selected }) => [
        { cols: 1, fields: [caseField, {
          key: "procedureDescription", label: "Procedure explained to the patient", type: "textarea", required: true,
          placeholder: selected ? `e.g. ${selected.procedureName}, including site, side and expected outcome` : "Describe the procedure in plain language",
          hint: selected ? `Booked procedure: ${selected.procedureName}` : undefined,
        }] },
        { title: "Discussion", cols: 1, fields: [
          { key: "risksExplained", type: "toggle", label: "Risks and complications explained" },
          { key: "alternativesDiscussed", type: "toggle", label: "Alternatives discussed (including doing nothing)" },
          { key: "consentGiven", type: "toggle", label: "Patient (or guardian) gives consent", hint: "Switch off to record that the patient DECLINED." },
        ] },
        { fields: [{ key: "witness", label: "Witness name" }, { key: "notes", label: "Notes", type: "textarea", span: 2 }] },
      ]}
      confirm={(v) => !v.consentGiven ? { title: "Record consent as DECLINED?", message: "Surgery must not proceed without valid consent (except documented life-saving emergencies).", label: "Record declined", tone: "danger" } : !v.risksExplained ? { title: "Risks not ticked", message: "Valid consent needs the risks explained. Save anyway?", label: "Save anyway", tone: "primary" } : null}
      submit={async (v) => { const r = await act(addConsent({ facilityId, caseId: v.caseId, payload: clean({ procedureDescription: v.procedureDescription.trim(), risksExplained: v.risksExplained, alternativesDiscussed: v.alternativesDiscussed, consentGiven: v.consentGiven, witness: v.witness, notes: v.notes }) as any }), "Consent recorded"); if (r) router.push(`${TBASE}/schedule/${v.caseId}`); }} />
  );
}
