"use client";

import { createTheatreRoom } from "@/api/slices/theaterSlice";
import { SpecForm, TBASE, TH, clean, plain, useForm, useTH, type SectionSpec } from "@/components/theater/th-ui";

export default function NewRoomPage() {
  const { facilityId, act, router, theater } = useTH();
  const form = useForm<any>({ name: "", code: "", type: "General", notes: "" });
  const sections: SectionSpec[] = [{ fields: [
    { key: "name", label: "Room name", required: true, placeholder: "e.g. Main Theatre 1" },
    { key: "code", label: "Code", required: true, placeholder: "e.g. OT1", hint: "Saved in capitals. Must be unique." },
    { key: "type", label: "Type", type: "select", options: plain(TH.roomTypes) },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ] }];
  return (
    <SpecForm form={form} sections={sections} backHref={`${TBASE}/rooms`} title="Add theatre room" subtitle="Operating room or procedure room"
      submitLabel="Create room" saving={theater.saving}
      onSubmit={async (v) => { const r = await act(createTheatreRoom({ facilityId, payload: clean({ name: v.name.trim(), code: v.code.trim(), type: v.type, notes: v.notes }) as any }), "Theatre room created"); if (r) router.push(`${TBASE}/rooms`); }} />
  );
}
