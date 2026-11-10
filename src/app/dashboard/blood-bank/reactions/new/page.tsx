"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchTransfusions, reportReaction } from "@/api/slices";
import {
  BASE, ENUMS, Loader, Page, SpecForm, clean, fmtDateTime, idOf, label, nameOf, num, pickVitals, toIso, toOpts, useBB, useForm, vitalsFields, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

const SYMPTOMS = ["Fever", "Chills / rigors", "Rash / urticaria", "Itching", "Shortness of breath", "Wheeze", "Hypotension", "Chest / back pain", "Haemoglobinuria", "Nausea / vomiting", "Flushing", "Headache"];

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({
    transfusionId: sp.get("transfusionId") || "", onsetAt: "", type: "", severity: "", imputability: "", symptoms: [] as string[], extraSymptom: "",
    actionsTaken: "", transfusionStopped: true, volumeTransfusedMl: "", reportedToAuthority: false, notes: "", ...Object.fromEntries(vitalsFields("rx_").map((f) => [f.key, ""])),
  });
  useEffect(() => { if (facilityId) act(fetchTransfusions({ facilityId, limit: 100 }), false); }, [facilityId, act]);
  const severe = ["severe", "life_threatening"].includes(form.v.severity);

  const sections: SectionSpec[] = [
    { title: "Transfusion", cols: 1, fields: [{ key: "transfusionId", label: "Transfusion", type: "select", required: true, searchable: true, options: bloodBank.transfusions.map((t: any) => ({ value: t._id, label: `${t.transfusionNumber} · ${nameOf(t.patient)} · ${t.unitNumber} · ${fmtDateTime(t.startedAt)}` })) }] },
    {
      title: "Reaction",
      fields: [
        { key: "type", label: "Type", type: "select", required: true, options: toOpts(ENUMS.reactionTypes) },
        { key: "severity", label: "Severity", type: "select", required: true, options: toOpts(ENUMS.severities) },
        { key: "onsetAt", label: "Onset", type: "datetime" },
        { key: "imputability", label: "Imputability to transfusion", type: "select", options: [{ value: "", label: "Not assessed" }, ...toOpts(ENUMS.imputability)] },
        { key: "symptoms", label: "Symptoms", type: "chips", span: 2, options: SYMPTOMS.map((s) => ({ value: s, label: s })) },
        { key: "extraSymptom", label: "Other symptom", placeholder: "Type another symptom" },
      ],
    },
    { title: "Vitals at reaction", cols: 3, fields: vitalsFields("rx_") },
    {
      title: "Response",
      fields: [
        { key: "actionsTaken", label: "Actions taken", type: "textarea", span: 2 },
        { key: "transfusionStopped", type: "toggle", label: "Transfusion stopped" },
        { key: "reportedToAuthority", type: "toggle", label: "Reported to haemovigilance authority" },
        { key: "volumeTransfusedMl", label: "Volume transfused before reaction (mL)", type: "number", min: 0, max: 5000 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/reactions`} title="Report transfusion reaction" subtitle="Record suspected adverse reaction"
      submitLabel="Report reaction" saving={bloodBank.saving} danger={severe}
      top={severe ? <div className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#ef44441f", color: "#ef4444" }}>Severe reaction: stop the transfusion, keep IV access with saline, call the doctor and return the unit and paperwork to the blood bank.</div> : undefined}
      confirm={(v) => ["severe", "life_threatening"].includes(v.severity) ? { title: `Report ${label(v.severity).toLowerCase()} reaction?`, message: "This alerts the blood bank team and opens an investigation. Confirm the transfusion has been stopped.", label: "Report reaction", tone: "danger" } : null}
      onSubmit={async (v) => {
        const symptoms = [...v.symptoms, ...(v.extraSymptom.trim() ? [v.extraSymptom.trim()] : [])];
        const vit = pickVitals(v, "rx_");
        const payload: any = clean({
          transfusionId: v.transfusionId, onsetAt: toIso(v.onsetAt), type: v.type, severity: v.severity, imputability: v.imputability,
          symptoms: symptoms.length ? symptoms : undefined, actionsTaken: v.actionsTaken, transfusionStopped: v.transfusionStopped,
          volumeTransfusedMl: num(v.volumeTransfusedMl), reportedToAuthority: v.reportedToAuthority, notes: v.notes,
        });
        if (Object.keys(vit).length) payload.vitalsAtReaction = vit;
        const res: any = await act(reportReaction({ facilityId, payload }), "Reaction reported");
        if (res) router.push(res === true ? `${BASE}/reactions` : `${BASE}/reactions/${idOf(res)}`);
      }} />
  );
}

export default function NewReactionPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
