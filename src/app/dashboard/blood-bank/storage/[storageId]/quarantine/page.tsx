"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchStorage, quarantineStorage } from "@/api/slices";
import { BASE, Loader, NotFound, Page, SpecForm, useBB, useForm, type SectionSpec } from "@/components/blood-bank/bb-ui";

export default function QuarantineStoragePage() {
  const { storageId } = useParams() as { storageId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const s = bloodBank.storage.find((x) => x._id === storageId);
  const form = useForm<any>({ reason: "" });

  useEffect(() => {
    if (facilityId) act(fetchStorage({ facilityId, includeInactive: true }), false);
  }, [facilityId, act]);

  if (!s) return <Page narrow>{bloodBank.listLoading ? <Loader /> : <NotFound what="Storage unit" href={`${BASE}/storage`} />}</Page>;

  const sections: SectionSpec[] = [
    { cols: 1, fields: [{ key: "reason", label: "Reason for quarantine", type: "textarea", required: true, placeholder: "e.g. Compressor failure – temperature excursion for 3 hours", hint: "At least 3 characters." }] },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/storage/${storageId}`}
      title="Quarantine contents"
      subtitle={`${s.name} (${s.code}) · ${s.unitsStored ?? 0} units inside`}
      submitLabel="Quarantine all units"
      danger
      saving={bloodBank.saving}
      confirm={{ title: "Quarantine every unit in this storage?", message: `All ${s.unitsStored ?? 0} units in ${s.name} will be put on hold and cannot be crossmatched or issued until reviewed.`, label: "Quarantine units", tone: "danger" }}
      onSubmit={async (v) => {
        const r = await act(quarantineStorage({ facilityId, storageId, payload: { reason: v.reason.trim() } }), "Units quarantined");
        if (r) router.push(`${BASE}/storage/${storageId}`);
      }}
    />
  );
}
