"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchStorage, updateStorage } from "@/api/slices";
import {
  BASE, ENUMS, Loader, NotFound, Page, SpecForm, clean, num, toDateInput, toIso, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function EditStoragePage() {
  const { storageId } = useParams() as { storageId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const s: any = bloodBank.storage.find((x) => x._id === storageId);
  const form = useForm<any>({});

  useEffect(() => {
    if (facilityId) act(fetchStorage({ facilityId, includeInactive: true }), false);
  }, [facilityId, act]);

  useEffect(() => {
    if (!s) return;
    form.setV({
      code: s.code, name: s.name, type: s.type, location: s.location || "", capacity: String(s.capacity ?? ""),
      minTempC: String(s.minTempC ?? ""), maxTempC: String(s.maxTempC ?? ""), status: s.status, isActive: !!s.isActive,
      lastServiceAt: toDateInput(s.lastServiceAt), nextServiceDue: toDateInput(s.nextServiceDue),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?._id]);

  if (!s || form.v.code === undefined) return <Page narrow>{bloodBank.listLoading ? <Loader /> : <NotFound what="Storage unit" href={`${BASE}/storage`} />}</Page>;

  const sections: SectionSpec[] = [
    {
      title: "Storage unit",
      fields: [
        { key: "code", label: "Code", required: true },
        { key: "name", label: "Name", required: true },
        { key: "type", label: "Type", type: "select", options: toOpts(ENUMS.storageTypes) },
        { key: "location", label: "Location" },
        { key: "capacity", label: "Capacity (units)", type: "number", min: 1, max: 10000 },
        { key: "status", label: "Status", type: "select", options: toOpts(ENUMS.storageStatuses) },
        { key: "isActive", type: "toggle", label: "Active", hint: "Inactive units are hidden from the storage list.", span: 2 },
      ],
    },
    {
      title: "Temperature & servicing",
      fields: [
        { key: "minTempC", label: "Minimum (°C)", type: "number" },
        { key: "maxTempC", label: "Maximum (°C)", type: "number" },
        { key: "lastServiceAt", label: "Last serviced", type: "date" },
        { key: "nextServiceDue", label: "Next service due", type: "date" },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/storage/${storageId}`}
      title="Edit storage unit"
      subtitle={<span className="font-mono">{s.code}</span>}
      submitLabel="Save changes"
      saving={bloodBank.saving}
      confirm={(v) =>
        (v.status !== s.status && v.status !== "operational") || (s.isActive && !v.isActive)
          ? { title: "Take this unit out of service?", message: "Stock stored here will not be reported as usable while the unit is in maintenance, out of service or inactive.", label: "Save changes", tone: "danger" }
          : null
      }
      onSubmit={async (v) => {
        const payload = clean({
          code: v.code.trim(), name: v.name.trim(), type: v.type, location: v.location, capacity: num(v.capacity),
          minTempC: num(v.minTempC), maxTempC: num(v.maxTempC), status: v.status, isActive: v.isActive,
          lastServiceAt: toIso(v.lastServiceAt), nextServiceDue: toIso(v.nextServiceDue),
        }) as any;
        payload.isActive = v.isActive;
        const r = await act(updateStorage({ facilityId, storageId, payload }), "Storage updated");
        if (r) router.push(`${BASE}/storage/${storageId}`);
      }}
    />
  );
}
