"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchTheaterSchedule, fetchTheatreRooms, updateTheatreRoom } from "@/api/slices/theaterSlice";
import { Banner, Loader, NotFound, Page, SpecForm, TBASE, TH, clean, idOf, plain, useForm, useTH, type SectionSpec } from "@/components/theater/th-ui";

export default function EditRoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const { facilityId, act, router, theater } = useTH();
  const room = theater.rooms.find((r) => r._id === roomId);
  const form = useForm<any>({});

  useEffect(() => {
    if (!facilityId) return;
    act(fetchTheatreRooms({ facilityId, includeInactive: true }), false);
    act(fetchTheaterSchedule({ facilityId }), false);
  }, [facilityId, act]);

  useEffect(() => {
    if (room) form.setV({ name: room.name, code: room.code, type: room.type || "", notes: room.notes || "", isActive: room.isActive !== false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?._id]);

  if (!room || form.v.name === undefined) return <Page narrow>{theater.listLoading || !facilityId ? <Loader /> : <NotFound what="Theatre room" href={`${TBASE}/rooms`} />}</Page>;

  const upcoming = theater.schedule.filter((c) => idOf(c.room) === roomId && !["completed", "cancelled"].includes(c.status) && new Date(c.scheduledStart) > new Date()).length;
  const typeOptions = plain(TH.roomTypes.includes(form.v.type) || !form.v.type ? TH.roomTypes : [form.v.type, ...TH.roomTypes]);

  const sections: SectionSpec[] = [{ fields: [
    { key: "name", label: "Room name", required: true },
    { key: "code", label: "Code", required: true, hint: "Saved in capitals. Must be unique." },
    { key: "type", label: "Type", type: "select", options: typeOptions },
    { key: "isActive", type: "toggle", label: "Active", hint: "Inactive rooms cannot be picked for new cases." },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ] }];

  return (
    <SpecForm form={form} sections={sections} backHref={`${TBASE}/rooms/${roomId}`} title="Edit theatre room" subtitle={<span className="font-mono">{room.code}</span>}
      submitLabel="Save changes" saving={theater.saving}
      confirm={(v) => room.isActive !== false && !v.isActive ? { title: "Deactivate this room?", message: upcoming ? `${upcoming} upcoming case${upcoming === 1 ? " is" : "s are"} booked here. They keep this room, but it can no longer be chosen for new cases.` : "The room can no longer be chosen for new cases. You can reactivate it later.", label: "Deactivate", tone: "danger" } : null}
      onSubmit={async (v) => {
        const payload = { ...clean({ name: v.name.trim(), code: v.code.trim(), type: v.type, notes: v.notes }), isActive: v.isActive };
        const r = await act(updateTheatreRoom({ facilityId, roomId, payload: payload as any }), "Theatre room updated");
        if (r) router.push(`${TBASE}/rooms/${roomId}`);
      }} />
  );
}
