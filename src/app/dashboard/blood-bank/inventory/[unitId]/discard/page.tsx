"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { discardUnit, fetchUnitById } from "@/api/slices";
import {
  BASE, ENUMS, Loader, NotFound, Page, SpecForm, clean, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function DiscardUnitPage() {
  const { unitId } = useParams() as { unitId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const u: any = bloodBank.activeUnit?._id === unitId ? bloodBank.activeUnit : null;
  const form = useForm<any>({ reason: "", detail: "", method: "autoclave", witness: "" });

  useEffect(() => {
    if (facilityId) act(fetchUnitById({ facilityId, unitId }), false);
  }, [facilityId, unitId, act]);

  if (!u) return <Page narrow>{bloodBank.detailLoading ? <Loader /> : <NotFound what="Unit" href={`${BASE}/inventory`} />}</Page>;

  const sections: SectionSpec[] = [
    {
      title: "Why is this unit being discarded?",
      cols: 1,
      fields: [
        { key: "reason", label: "Reason", type: "select", required: true, options: toOpts(ENUMS.discardReasons) },
        { key: "detail", label: "Details", type: "textarea" },
        { key: "method", label: "Disposal method", type: "select", options: toOpts(ENUMS.discardMethods) },
        { key: "witness", label: "Witness" },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/inventory/${unitId}`}
      title="Discard unit"
      subtitle={<span className="font-mono">{u.unitNumber}</span>}
      submitLabel="Discard unit"
      danger
      saving={bloodBank.saving}
      confirm={{ title: "Discard this unit?", message: `${u.unitNumber} will be permanently removed from stock and logged as wastage. This cannot be undone.`, label: "Discard unit", tone: "danger" }}
      onSubmit={async (v) => {
        const r = await act(discardUnit({ facilityId, unitId, payload: clean({ reason: v.reason, detail: v.detail, method: v.method, witness: v.witness }) as any }), "Unit discarded");
        if (r) router.push(`${BASE}/inventory`);
      }}
    />
  );
}
