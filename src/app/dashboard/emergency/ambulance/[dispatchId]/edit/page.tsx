"use client";

import { useParams } from "next/navigation";
import { fetchErDispatch, updateErDispatch } from "@/api/slices";
import type { ErDispatch } from "@/api/slices/emergencySlice";
import { BASE, Loader, NotFound, Page, SpecForm, dispatchInitial, dispatchPayload, dispatchSections, useER, useForm, useLoad, useRegOptions } from "@/components/emergency/er-ui";

function EditForm({ d }: { d: ErDispatch }) {
  const { facilityId, act, router, emergency } = useER();
  const init = dispatchInitial(d);
  const form = useForm<any>(init);
  const { options } = useRegOptions(init.linkedRegistrationId || undefined);
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/ambulance/${d._id}`}
      title="Edit call"
      subtitle="Assign the vehicle and crew, or link the patient"
      saving={emergency.saving}
      sections={dispatchSections(options)}
      onSubmit={async (v) => {
        const payload: any = { ...dispatchPayload(v) };
        if (v.linkedRegistrationId) payload.linkedRegistrationId = v.linkedRegistrationId;
        const res = await act(updateErDispatch({ facilityId, dispatchId: d._id, payload }), "Dispatch updated");
        if (res) router.push(`${BASE}/ambulance/${d._id}`);
      }}
    />
  );
}

export default function EditDispatchPage() {
  const { dispatchId } = useParams() as { dispatchId: string };
  const er = useER();
  const { data, loading } = useLoad<ErDispatch>(er, (facilityId) => fetchErDispatch({ facilityId, dispatchId }), [dispatchId]);
  if (loading) return <Page narrow><Loader /></Page>;
  if (!data) return <Page><NotFound what="Ambulance call" href={`${BASE}/ambulance`} /></Page>;
  return <EditForm d={data} />;
}
