"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createImagingRequest, fetchErRegistration } from "@/api/slices";
import type { ErRegistrationDetail } from "@/api/slices/emergencySlice";
import { BASE, Loader, NotFound, Page, RegContext, SpecForm, erLabel, refId, useER, useForm, useLoad } from "@/components/emergency/er-ui";

const MODALITIES = ["xray", "ct", "mri", "ultrasound", "fluoroscopy", "other"];

function ImagingForm({ r }: { r: ErRegistrationDetail }) {
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>({ modality: "xray", procedureName: "", bodyPart: "", clinicalIndication: r.chiefComplaint, priority: "stat" });
  const patientId = refId(r.patient);

  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/tracker/${r._id}`}
      title="Order imaging"
      subtitle="Goes to the radiology worklist"
      submitLabel="Send to radiology"
      saving={emergency.saving}
      canSubmit={!!patientId}
      top={<><RegContext r={r} />{!patientId && <p className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#f59e0b1f", color: "#d97706" }}>This patient is unidentified. Link a patient record before ordering imaging.</p>}</>}
      sections={[
        {
          fields: [
            { key: "modality", label: "Modality", type: "select", required: true, options: MODALITIES.map((m) => ({ value: m, label: m === "xray" ? "X-ray" : m === "ct" ? "CT" : m === "mri" ? "MRI" : erLabel(m) })) },
            { key: "priority", label: "Priority", type: "select", options: [{ value: "stat", label: "STAT" }, { value: "urgent", label: "Urgent" }, { value: "routine", label: "Routine" }] },
            { key: "procedureName", label: "Study", required: true, placeholder: "e.g. Chest X-ray PA, CT head without contrast" },
            { key: "bodyPart", label: "Body part", required: true, placeholder: "e.g. Chest, Head, Abdomen" },
            { key: "clinicalIndication", label: "Clinical indication", type: "textarea", required: true, span: 2 },
          ],
        },
      ]}
      onSubmit={async (v) => {
        const res = await act(createImagingRequest({ facilityId, payload: { patientId, modality: v.modality, procedureName: v.procedureName.trim(), bodyPart: v.bodyPart.trim(), clinicalIndication: v.clinicalIndication.trim(), priority: v.priority } }), "Imaging request sent");
        if (res) router.push(`${BASE}/tracker/${r._id}`);
      }}
    />
  );
}

function Inner() {
  const id = useSearchParams().get("registrationId") || "";
  const er = useER();
  const { data, loading } = useLoad<ErRegistrationDetail>(er, (facilityId) => (id ? fetchErRegistration({ facilityId, registrationId: id }) : null), [id]);
  if (loading) return <Page narrow><Loader /></Page>;
  if (!data) return <Page><NotFound what="ER visit" href={`${BASE}/orders`} /></Page>;
  return <ImagingForm r={data} />;
}

export default function ErImagingOrderPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
