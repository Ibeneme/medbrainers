"use client";

import { createDrive } from "@/api/slices";
import { CustomSearchableMultiStaffDropdown } from "@/components/ui/items";
import {
  BASE, SpecForm, clean, idOf, num, toIso, useBB, useForm, useMembers, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function NewDrivePage() {
  const { facilityId, act, router, bloodBank, ui, isDark, colors } = useBB();
  const members = useMembers();
  const form = useForm<any>({
    name: "", location: "", scheduledAt: "", endsAt: "", organizer: "", contactPerson: "", contactPhone: "",
    targetUnits: "", team: [] as string[], notes: "",
  });

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
          render: (v, set) => (
            <CustomSearchableMultiStaffDropdown value={v.team} members={members} onChange={(x) => set("team", x)} isDark={isDark} colors={colors} border={ui.border} />
          ),
        },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/drives`}
      title="Schedule blood drive"
      subtitle="Plan an outreach collection"
      submitLabel="Schedule drive"
      saving={bloodBank.saving}
      onSubmit={async (v) => {
        const payload = clean({
          name: v.name.trim(), location: v.location.trim(), scheduledAt: toIso(v.scheduledAt), endsAt: toIso(v.endsAt),
          organizer: v.organizer, contactPerson: v.contactPerson, contactPhone: v.contactPhone,
          targetUnits: num(v.targetUnits), team: v.team?.length ? v.team : undefined, notes: v.notes,
        });
        const res: any = await act(createDrive({ facilityId, payload }), "Drive scheduled");
        if (res) router.push(res === true ? `${BASE}/drives` : `${BASE}/drives/${idOf(res)}`);
      }}
    />
  );
}
