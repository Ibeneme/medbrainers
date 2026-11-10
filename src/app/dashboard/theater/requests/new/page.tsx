"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSurgeryRequest } from "@/api/slices/theaterSlice";
import { Loader, Page, SpecForm, TBASE, TH, clean, idOf, opts, toIso, useForm, useTH, type SectionSpec } from "@/components/theater/th-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, theater } = useTH();
  const form = useForm<any>({ patientId: sp.get("patientId") || "", procedureName: "", icdCode: "", diagnosis: "", priority: "elective", preferredDate: "", notes: "" });
  const sections: SectionSpec[] = [
    { title: "Patient", cols: 1, fields: [{ key: "patientId", label: "Patient", type: "patient", required: true }] },
    { title: "Procedure", fields: [
      { key: "procedureName", label: "Procedure requested", required: true, span: 2, placeholder: "e.g. Laparoscopic cholecystectomy" },
      { key: "diagnosis", label: "Diagnosis", span: 2 },
      { key: "icdCode", label: "ICD code", placeholder: "e.g. K80.2" },
      { key: "priority", label: "Priority", type: "select", options: opts(TH.priorities) },
      { key: "preferredDate", label: "Preferred date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea", span: 2 },
    ] },
  ];
  return (
    <SpecForm form={form} sections={sections} backHref={`${TBASE}/requests`} title="New surgery request" subtitle="Ask the theatre team to book a procedure"
      submitLabel="Submit request" saving={theater.saving} danger={form.v.priority === "emergency"}
      confirm={(v) => v.priority === "emergency" ? { title: "Submit as EMERGENCY?", message: "Emergency requests are flagged on the theatre dashboard straight away. Use only when delay threatens life or limb.", label: "Submit emergency request", tone: "danger" } : null}
      onSubmit={async (v) => {
        const payload = clean({ patientId: v.patientId, procedureName: v.procedureName.trim(), icdCode: v.icdCode, diagnosis: v.diagnosis, priority: v.priority, preferredDate: toIso(v.preferredDate), notes: v.notes });
        const r: any = await act(createSurgeryRequest({ facilityId, payload: payload as any }), "Surgery request submitted");
        if (r) router.push(r === true ? `${TBASE}/requests` : `${TBASE}/requests/${idOf(r)}`);
      }} />
  );
}
export default function NewSurgeryRequestPage() { return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>; }
