"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createLabRequest, fetchErRegistration } from "@/api/slices";
import type { ErRegistrationDetail } from "@/api/slices/emergencySlice";
import LabTestPicker from "@/components/ui/Labtestpicker";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useLabCatalog } from "@/hooks/useLabCatalog";
import { BASE, Loader, NotFound, Page, RegContext, SpecForm, clean, refId, useER, useForm, useLoad } from "@/components/emergency/er-ui";

function LabForm({ r }: { r: ErRegistrationDetail }) {
  const { facilityId, act, router, ui, emergency } = useER();
  const { catalog, loading } = useLabCatalog({ facilityId });
  const form = useForm<any>({ testCatalogIds: [] as string[], priority: "stat", clinicalNotes: r.chiefComplaint });
  const patientId = refId(r.patient);

  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/tracker/${r._id}`}
      title="Order laboratory tests"
      subtitle="Goes to the lab queue"
      submitLabel="Send to laboratory"
      saving={emergency.saving}
      canSubmit={!!patientId && form.v.testCatalogIds.length > 0}
      top={<><RegContext r={r} />{!patientId && <p className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#f59e0b1f", color: "#d97706" }}>This patient is unidentified. Link a patient record before ordering tests.</p>}</>}
      sections={[
        {
          title: "Tests",
          cols: 1,
          fields: [{ key: "testCatalogIds", type: "custom", render: (v, set) => <LabTestPicker catalog={catalog} loading={loading} selectedIds={v.testCatalogIds} onChange={(ids) => set("testCatalogIds", ids)} ui={ui} accent={PRIMARY_COLOR} /> }],
        },
        {
          fields: [
            { key: "priority", label: "Priority", type: "select", options: [{ value: "stat", label: "STAT" }, { value: "urgent", label: "Urgent" }, { value: "routine", label: "Routine" }] },
            { key: "clinicalNotes", label: "Clinical notes", type: "textarea", span: 2 },
          ],
        },
      ]}
      onSubmit={async (v) => {
        const res = await act(createLabRequest({ facilityId, payload: { patientId, testCatalogIds: v.testCatalogIds, priority: v.priority, ...clean({ clinicalNotes: v.clinicalNotes?.trim() }) } }), "Lab request sent");
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
  return <LabForm r={data} />;
}

export default function ErLabOrderPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
