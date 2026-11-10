"use client";

import { discardExpired } from "@/api/slices";
import { BASE, ENUMS, SpecForm, clean, toOpts, useBB, useForm, type SectionSpec } from "@/components/blood-bank/bb-ui";

export default function DiscardExpiredPage() {
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({ method: "autoclave", witness: "" });
  const sections: SectionSpec[] = [
    {
      title: "Disposal record",
      desc: "Every expired unit still in stock is logged as discarded with reason “expired”.",
      cols: 1,
      fields: [
        { key: "method", label: "Disposal method", type: "select", options: toOpts(ENUMS.discardMethods) },
        { key: "witness", label: "Witness" },
      ],
    },
  ];
  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/expiry`}
      title="Discard all expired units"
      subtitle="Bulk disposal"
      submitLabel="Discard expired units"
      danger
      saving={bloodBank.saving}
      confirm={{ title: "Discard every expired unit?", message: "All expired units currently in stock will be removed and logged as wastage. This cannot be undone.", label: "Discard expired", tone: "danger" }}
      onSubmit={async (v) => {
        const r: any = await act(discardExpired({ facilityId, payload: clean({ method: v.method, witness: v.witness }) as any }), "Expired units discarded");
        if (r) {
          router.push(`${BASE}/expiry`);
        }
      }}
    />
  );
}
