"use client";

import { useParams } from "next/navigation";
import { voidCrossmatch } from "@/api/slices";
import { BASE, SpecForm, useBB, useForm } from "@/components/blood-bank/bb-ui";

export default function VoidCrossmatchPage() {
  const { crossmatchId } = useParams() as { crossmatchId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ reason: "" });
  return (
    <SpecForm form={form} backHref={`${BASE}/crossmatch/${crossmatchId}`} title="Void crossmatch" subtitle="The reserved unit returns to stock"
      sections={[{ cols: 1, fields: [{ key: "reason", label: "Reason", type: "textarea", required: true }] }]}
      submitLabel="Void crossmatch" danger saving={bloodBank.saving}
      confirm={{ title: "Void this crossmatch?", message: "The unit will no longer be reserved for this patient. This cannot be undone.", label: "Void crossmatch", tone: "danger" }}
      onSubmit={async (v) => { const r = await act(voidCrossmatch({ facilityId, crossmatchId, payload: { reason: v.reason.trim() } }), "Crossmatch voided"); if (r) router.push(`${BASE}/crossmatch`); }} />
  );
}
