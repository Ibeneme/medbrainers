"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchUnitById, processComponents } from "@/api/slices";
import {
  BASE, Card, GroupBadge, KV, KVGrid, Loader, NotFound, Page, PRODUCT_LABEL, SpecForm, DERIVATIONS,
  fmtDate, label, num, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function ProcessComponentPage() {
  const { unitId } = useParams() as { unitId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const u: any = bloodBank.activeUnit?._id === unitId ? bloodBank.activeUnit : null;
  const form = useForm<any>({ outputs: [] as string[] });

  useEffect(() => {
    if (facilityId) act(fetchUnitById({ facilityId, unitId }), false);
  }, [facilityId, unitId, act]);

  if (!u) return <Page narrow>{bloodBank.detailLoading ? <Loader /> : <NotFound what="Unit" href={`${BASE}/components`} />}</Page>;

  const options = DERIVATIONS[u.product] || [];
  const chosen: string[] = form.v.outputs;

  const sections: SectionSpec[] = [
    {
      title: "Components to prepare",
      desc: "Pick up to three. The parent unit is consumed and cannot be used again.",
      cols: 1,
      fields: [
        {
          key: "outputs", type: "chips", required: true,
          options: options.map((p) => ({ value: p, label: PRODUCT_LABEL[p] })),
        },
        ...chosen.map((p) => ({ key: `vol_${p}`, label: `${PRODUCT_LABEL[p]} volume (mL, optional)`, type: "number" as const, min: 5, max: 1000 })),
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/components`}
      title="Process into components"
      subtitle={<span className="font-mono">{u.unitNumber}</span>}
      submitLabel="Prepare components"
      saving={bloodBank.saving}
      canSubmit={chosen.length > 0 && chosen.length <= 3}
      top={
        <Card className="flex flex-wrap items-center gap-5">
          <GroupBadge group={u.bloodGroup} size="lg" />
          <KVGrid cols={3}>
            <KV label="Product">{PRODUCT_LABEL[u.product] || label(u.product)}</KV>
            <KV label="Volume">{u.volumeMl} mL</KV>
            <KV label="Expires">{fmtDate(u.expiryDate)}</KV>
          </KVGrid>
        </Card>
      }
      confirm={() => ({
        title: "Consume this unit?",
        message: `${u.unitNumber} will be turned into ${chosen.map((p) => PRODUCT_LABEL[p]).join(", ")}. The original unit is marked as processed and cannot be restored.`,
        label: "Prepare components",
        tone: "primary",
      })}
      onSubmit={async (v) => {
        const outputs = (v.outputs as string[]).map((p) => ({ product: p, volumeMl: num(v[`vol_${p}`]) }));
        const r = await act(processComponents({ facilityId, payload: { unitId, outputs: outputs as any } }), "Components prepared");
        if (r) router.push(`${BASE}/components`);
      }}
    />
  );
}
