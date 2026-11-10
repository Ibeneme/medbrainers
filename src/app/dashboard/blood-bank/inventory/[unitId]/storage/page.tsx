"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { assignStorage, fetchStorage, fetchUnitById } from "@/api/slices";
import {
  BASE, Loader, NotFound, Page, SpecForm, idOf, label, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function AssignStoragePage() {
  const { unitId } = useParams() as { unitId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const u: any = bloodBank.activeUnit?._id === unitId ? bloodBank.activeUnit : null;
  const form = useForm<any>({ storageUnitId: "", location: "" });

  useEffect(() => {
    if (!facilityId) return;
    act(fetchUnitById({ facilityId, unitId }), false);
    act(fetchStorage({ facilityId }), false);
  }, [facilityId, unitId, act]);

  useEffect(() => {
    if (u) form.setV({ storageUnitId: idOf(u.storageUnit), location: u.location || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u?._id]);

  if (!u) return <Page narrow>{bloodBank.detailLoading ? <Loader /> : <NotFound what="Unit" href={`${BASE}/inventory`} />}</Page>;

  const sections: SectionSpec[] = [
    {
      cols: 1,
      fields: [
        {
          key: "storageUnitId", label: "Storage unit", type: "select",
          options: [{ value: "", label: "Unassigned" }, ...bloodBank.storage.filter((s) => s.status === "operational").map((s) => ({ value: s._id, label: `${s.code} · ${s.name} (${label(s.type)})` }))],
          hint: "Products must go to a suitable unit, e.g. platelets to an agitator, plasma to a freezer.",
        },
        { key: "location", label: "Shelf / position", placeholder: "e.g. Shelf 2, Tray B" },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/inventory/${unitId}`}
      title="Assign storage"
      subtitle={<span className="font-mono">{u.unitNumber}</span>}
      submitLabel="Save location"
      saving={bloodBank.saving}
      onSubmit={async (v) => {
        const r = await act(assignStorage({ facilityId, unitId, payload: { storageUnitId: v.storageUnitId || null, location: v.location || undefined } }), "Storage assigned");
        if (r) router.push(`${BASE}/inventory/${unitId}`);
      }}
    />
  );
}
