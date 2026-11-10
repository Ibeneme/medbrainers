"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchDriveById, updateDrive } from "@/api/slices";
import { CustomSearchableMultiStaffDropdown } from "@/components/ui/items";
import {
  BASE, Loader, Page, SpecForm, clean, idOf, num, toIso, toLocalInput, useBB, useForm, useLoad, useMembers, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function EditDrivePage() {
  const { driveId } = useParams() as { driveId: string };
  const bb = useBB();
  const { act, facilityId, router, bloodBank, ui, isDark, colors } = bb;
  const members = useMembers();
  const { data: d } = useLoad<any>(bb, (f) => fetchDriveById({ facilityId: f, driveId }), [driveId]);
  const form = useForm<any>({});

  useEffect(() => {
    if (!d) return;
    form.setV({
      name: d.name || "", location: d.location || "", scheduledAt: d.scheduledAt ? toLocalInput(d.scheduledAt) : "",
      endsAt: d.endsAt ? toLocalInput(d.endsAt) : "", organizer: d.organizer || "", contactPerson: d.contactPerson || "",
      contactPhone: d.contactPhone || "", targetUnits: d.targetUnits ?? "", team: (d.team || []).map((t: any) => idOf(t)), notes: d.notes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?._id]);

  if (!d || form.v.name === undefined) return <Page narrow><Loader /></Page>;

  const sections: SectionSpec[] = [
    {
      title: "Drive details",
      fields: [
        { key: "name", label: "Drive name", required: true, span: 2 },
        { key: "location", label: "Location", required: true, span: 2 },
        { key: "scheduledAt", label: "Starts", type: "datetime", required: true },
        { key: "endsAt", label: "Ends", type: "datetime" },
        { key: "targetUnits", label: "Target units", type: "number", min: 0, max: 100000 },
        { key: "organizer", label: "Organizer" },
        { key: "contactPerson", label: "Contact person" },
        { key: "contactPhone", label: "Contact phone", type: "tel" },
      ],
    },
    {
      title: "Collection team & notes",
      cols: 1,
      fields: [
        {
          key: "team", type: "custom", label: "Team members",
          render: (v, set) => <CustomSearchableMultiStaffDropdown value={v.team} members={members} onChange={(x) => set("team", x)} isDark={isDark} colors={colors} border={ui.border} />,
        },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/drives/${driveId}`}
      title="Edit blood drive"
      subtitle={<span className="font-mono">{d.driveNumber}</span>}
      submitLabel="Save changes"
      saving={bloodBank.saving}
      onSubmit={async (v) => {
        const payload = clean({
          name: v.name.trim(), location: v.location.trim(), scheduledAt: toIso(v.scheduledAt), endsAt: toIso(v.endsAt),
          organizer: v.organizer, contactPerson: v.contactPerson, contactPhone: v.contactPhone,
          targetUnits: num(v.targetUnits), team: v.team, notes: v.notes,
        });
        const r = await act(updateDrive({ facilityId, driveId, payload }), "Drive updated");
        if (r) router.push(`${BASE}/drives/${driveId}`);
      }}
    />
  );
}
