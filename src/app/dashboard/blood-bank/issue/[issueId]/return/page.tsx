"use client";

import { useParams } from "next/navigation";
import { returnIssue } from "@/api/slices";
import { BASE, SpecForm, clean, num, toIso, toLocalInput, useBB, useForm } from "@/components/blood-bank/bb-ui";

export default function ReturnIssuePage() {
  const { issueId } = useParams() as { issueId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ reason: "", coldChainIntact: true, temperatureC: "", returnedAt: toLocalInput() });
  return (
    <SpecForm form={form} backHref={`${BASE}/issue/${issueId}`} title="Return issued unit" subtitle="Unit coming back unused"
      sections={[{ fields: [
        { key: "reason", label: "Reason for return", type: "textarea", required: true, span: 2 },
        { key: "coldChainIntact", type: "toggle", label: "Cold chain intact", hint: "Untick if the unit was out of the cooler beyond the return window – it will be discarded.", span: 2 },
        { key: "temperatureC", label: "Unit temperature (°C)", type: "number" },
        { key: "returnedAt", label: "Returned at", type: "datetime" },
      ] }]}
      submitLabel="Return unit" saving={bloodBank.saving}
      confirm={(v) => !v.coldChainIntact ? { title: "Cold chain broken", message: "A unit returned outside the cold chain cannot be restocked and will be discarded.", label: "Return & discard", tone: "danger" } : null}
      onSubmit={async (v) => {
        const r = await act(returnIssue({ facilityId, issueId, payload: clean({ reason: v.reason.trim(), coldChainIntact: v.coldChainIntact, temperatureC: num(v.temperatureC), returnedAt: toIso(v.returnedAt) }) as any }), "Unit returned");
        if (r) router.push(`${BASE}/issue/${issueId}`);
      }} />
  );
}
