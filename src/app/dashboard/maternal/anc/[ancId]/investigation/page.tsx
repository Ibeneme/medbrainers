"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { addAncInvestigation, fetchAncById } from "@/api/slices";
import {
  BASE, ENUMS, INVESTIGATION_PRESETS, SpecForm, clean, label, nameOf, suggestField, todayLocal, toOpts, useForm, useMat,
  type SectionSpec,
} from "@/components/maternity/mat-ui";

export default function AncInvestigationPage() {
  const { ancId } = useParams() as { ancId: string };
  const { facilityId, act, router, maternity } = useMat();
  const r = maternity.activeAnc?._id === ancId ? maternity.activeAnc : null;
  const form = useForm<any>({ type: "lab", name: "", requestedDate: todayLocal(), result: "", notes: "" });

  useEffect(() => {
    if (facilityId && !r) act(fetchAncById({ facilityId, id: ancId }), false);
  }, [facilityId, ancId, r, act]);

  const sections: SectionSpec[] = [
    {
      cols: 2,
      fields: [
        { key: "type", label: "Type", type: "select", required: true, options: toOpts(ENUMS.investigationTypes) },
        { key: "requestedDate", label: "Requested on", type: "date" },
        suggestField("name", "Test / scan", (x) => INVESTIGATION_PRESETS[x.type] || [], { required: true, span: 2, placeholder: "Name of the test or scan" }),
        { key: "result", label: "Result (if available now)", type: "textarea", span: 2, hint: "Results cannot be added later from this screen, so enter it now if you already have it." },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/anc/${ancId}`}
      title="Order scan / lab"
      subtitle={r ? `${nameOf(r.patient)} · ${label(r.riskLevel)} risk` : undefined}
      submitLabel="Save investigation"
      saving={maternity.saving}
      onSubmit={async (x) => {
        const res = await act(addAncInvestigation({ facilityId, id: ancId, payload: clean({ type: x.type, name: x.name.trim(), requestedDate: x.requestedDate, result: x.result, notes: x.notes }) as any }));
        if (res) router.push(`${BASE}/anc/${ancId}`);
      }}
    />
  );
}
