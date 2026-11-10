"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchStorage, logTemperature } from "@/api/slices";
import {
  BASE, Loader, NotFound, Page, SpecForm, clean, num, toIso, toLocalInput, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function LogTemperaturePage() {
  const { storageId } = useParams() as { storageId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const s = bloodBank.storage.find((x) => x._id === storageId);
  const form = useForm<any>({ temperatureC: "", recordedAt: toLocalInput(), source: "manual", actionTaken: "" });

  useEffect(() => {
    if (facilityId) act(fetchStorage({ facilityId, includeInactive: true }), false);
  }, [facilityId, act]);

  if (!s) return <Page narrow>{bloodBank.listLoading ? <Loader /> : <NotFound what="Storage unit" href={`${BASE}/storage`} />}</Page>;

  const t = num(form.v.temperatureC);
  const out = t !== undefined && (t < s.minTempC || t > s.maxTempC);

  const sections: SectionSpec[] = [
    {
      cols: 2,
      fields: [
        { key: "temperatureC", label: "Temperature (°C)", type: "number", required: true, min: -100, max: 60, step: 0.1, hint: `Safe range ${s.minTempC}° to ${s.maxTempC}°C` },
        { key: "recordedAt", label: "Recorded at", type: "datetime" },
        { key: "source", label: "Source", type: "select", options: toOpts(["manual", "sensor"]) },
        {
          key: "actionTaken", label: out ? "Corrective action taken" : "Action taken (optional)", type: "textarea", span: 2,
          hint: out ? "This reading is outside the safe range – describe what was done." : undefined,
        },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/storage/${storageId}`}
      title="Log temperature"
      subtitle={`${s.name} (${s.code})`}
      submitLabel="Save reading"
      saving={bloodBank.saving}
      confirm={() =>
        out
          ? { title: "Temperature out of range", message: `${t}°C is outside ${s.minTempC}° to ${s.maxTempC}°C. This raises a cold-chain alarm on the storage unit. Save the reading?`, label: "Save reading", tone: "danger" }
          : null
      }
      onSubmit={async (v) => {
        const r = await act(logTemperature({ facilityId, storageId, payload: clean({ temperatureC: num(v.temperatureC), recordedAt: toIso(v.recordedAt), source: v.source, actionTaken: v.actionTaken }) as any }), "Temperature logged");
        if (r) router.push(`${BASE}/storage/${storageId}`);
      }}
    />
  );
}
