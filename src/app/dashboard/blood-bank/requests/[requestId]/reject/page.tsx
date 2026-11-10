"use client";

import { useParams } from "next/navigation";
import { rejectRequest } from "@/api/slices";
import { BASE, SpecForm, useBB, useForm } from "@/components/blood-bank/bb-ui";

export default function RejectRequestPage() {
  const { requestId } = useParams() as { requestId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ reason: "" });
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/requests/${requestId}`}
      title="Reject blood request"
      subtitle="Tell the requesting team why"
      sections={[{ cols: 1, fields: [{ key: "reason", label: "Reason for rejection", type: "textarea", required: true, placeholder: "e.g. Sample mislabelled – please redraw" }] }]}
      submitLabel="Reject request"
      danger
      saving={bloodBank.saving}
      confirm={{ title: "Reject this request?", message: "The requesting team will see the rejection and any reserved units are released.", label: "Reject request", tone: "danger" }}
      onSubmit={async (v) => {
        const r = await act(rejectRequest({ facilityId, requestId, payload: { reason: v.reason.trim() } }), "Request rejected");
        if (r) router.push(`${BASE}/requests/${requestId}`);
      }}
    />
  );
}
