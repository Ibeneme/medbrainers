"use client";

import { createErDispatch } from "@/api/slices";
import { BASE, SpecForm, dispatchInitial, dispatchPayload, dispatchSections, idOf, useER, useForm } from "@/components/emergency/er-ui";

export default function NewDispatchPage() {
  const { facilityId, act, router, emergency, activeFacility } = useER();
  const form = useForm<any>(dispatchInitial(null, activeFacility?.name || ""));
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/ambulance`}
      title="Log ambulance call"
      subtitle="Record the call, then assign a vehicle and dispatch"
      submitLabel="Log call"
      saving={emergency.saving}
      sections={dispatchSections()}
      onSubmit={async (v) => {
        const res: any = await act(createErDispatch({ facilityId, payload: dispatchPayload(v) }), "Ambulance request logged");
        if (res) router.push(res === true ? `${BASE}/ambulance` : `${BASE}/ambulance/${idOf(res)}`);
      }}
    />
  );
}
