"use client";

import { useParams } from "next/navigation";
import { completeRetrospectiveCrossmatch } from "@/api/slices";
import { BASE, ENUMS, SpecForm, clean, toOpts, useBB, useForm } from "@/components/blood-bank/bb-ui";

export default function RetroCrossmatchPage() {
  const { issueId } = useParams() as { issueId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ result: "compatible", notes: "" });
  return (
    <SpecForm form={form} backHref={`${BASE}/issue/${issueId}`} title="Retrospective crossmatch" subtitle="Complete the test after an emergency release"
      sections={[{ cols: 1, fields: [
        { key: "result", label: "Result", type: "select", options: toOpts(ENUMS.crossmatchResults) },
        { key: "notes", label: "Notes", type: "textarea" },
      ] }]}
      submitLabel="Save result" saving={bloodBank.saving} danger={form.v.result === "incompatible"}
      confirm={(v) => v.result === "incompatible" ? { title: "Incompatible result", message: "An incompatible retrospective crossmatch means the patient may have received incompatible blood. Notify the treating clinician immediately and report a reaction if symptomatic.", label: "Record incompatible", tone: "danger" } : null}
      onSubmit={async (v) => { const r = await act(completeRetrospectiveCrossmatch({ facilityId, issueId, payload: clean({ result: v.result, notes: v.notes }) as any }), "Retrospective crossmatch completed"); if (r) router.push(`${BASE}/issue/${issueId}`); }} />
  );
}
