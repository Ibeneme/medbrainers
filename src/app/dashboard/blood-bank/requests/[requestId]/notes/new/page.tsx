"use client";

import { useParams } from "next/navigation";
import { addBloodRequestNote } from "@/api/slices";
import { BASE, SpecForm, useBB, useForm } from "@/components/blood-bank/bb-ui";

export default function NewRequestNotePage() {
  const { requestId } = useParams() as { requestId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ text: "" });
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/requests/${requestId}`}
      title="Add note"
      subtitle="Visible on the request"
      sections={[{ cols: 1, fields: [{ key: "text", label: "Note", type: "textarea", rows: 5, required: true }] }]}
      submitLabel="Add note"
      saving={bloodBank.saving}
      onSubmit={async (v) => {
        const r = await act(addBloodRequestNote({ facilityId, requestId, payload: { text: v.text.trim() } }), "Note added");
        if (r) router.push(`${BASE}/requests/${requestId}`);
      }}
    />
  );
}
