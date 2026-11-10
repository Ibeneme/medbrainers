"use client";

import { createStorage } from "@/api/slices";
import {
  BASE, DEFAULT_TEMP, ENUMS, SpecForm, clean, idOf, num, toIso, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function NewStoragePage() {
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({
    code: "", name: "", type: "refrigerator", location: "", capacity: "100",
    minTempC: String(DEFAULT_TEMP.refrigerator.min), maxTempC: String(DEFAULT_TEMP.refrigerator.max),
    lastServiceAt: "", nextServiceDue: "",
  });

  const sections: SectionSpec[] = [
    {
      title: "Storage unit",
      fields: [
        { key: "code", label: "Code", required: true, placeholder: "e.g. FR-01" },
        { key: "name", label: "Name", required: true, placeholder: "e.g. Blood fridge 1" },
        {
          key: "type", label: "Type", type: "select",
          options: toOpts(ENUMS.storageTypes),
          hint: "Changing the type fills in the standard temperature range.",
        },
        { key: "location", label: "Location", placeholder: "Room / bay" },
        { key: "capacity", label: "Capacity (units)", type: "number", min: 1, max: 10000 },
      ],
    },
    {
      title: "Operating temperature",
      fields: [
        { key: "minTempC", label: "Minimum (°C)", type: "number", min: -100, max: 40 },
        { key: "maxTempC", label: "Maximum (°C)", type: "number", min: -100, max: 40 },
      ],
    },
    {
      title: "Servicing",
      fields: [
        { key: "lastServiceAt", label: "Last serviced", type: "date" },
        { key: "nextServiceDue", label: "Next service due", type: "date" },
      ],
    },
  ];

  // keep the temp range in step with the chosen type
  const onType = form.v.type;
  const withTypeSync = (
    <TypeSync type={onType} apply={(t) => form.patch({ minTempC: String(DEFAULT_TEMP[t].min), maxTempC: String(DEFAULT_TEMP[t].max) })} />
  );

  return (
    <SpecForm
      form={form}
      sections={sections}
      top={withTypeSync}
      backHref={`${BASE}/storage`}
      title="Add storage unit"
      subtitle="Fridge, freezer or platelet agitator"
      submitLabel="Create storage unit"
      saving={bloodBank.saving}
      onSubmit={async (v) => {
        const payload = clean({
          code: v.code.trim(), name: v.name.trim(), type: v.type, location: v.location, capacity: num(v.capacity),
          minTempC: num(v.minTempC), maxTempC: num(v.maxTempC), lastServiceAt: toIso(v.lastServiceAt), nextServiceDue: toIso(v.nextServiceDue),
        });
        const res: any = await act(createStorage({ facilityId, payload }), "Storage unit created");
        if (res) router.push(res === true ? `${BASE}/storage` : `${BASE}/storage/${idOf(res)}`);
      }}
    />
  );
}

import { useEffect, useRef } from "react";
function TypeSync({ type, apply }: { type: string; apply: (t: string) => void }) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    apply(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  return null;
}
