"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchSurgeryRequests, fetchTheaterSchedule, fetchTheatreRooms, scheduleCase } from "@/api/slices/theaterSlice";
import { Banner, Loader, Page, SpecForm, TBASE, clean, fmtDateTime, idOf, patientLabel, roomLabel, toIso, toLocalInput, useForm, useTH, type SectionSpec } from "@/components/theater/th-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, theater } = useTH();
  const form = useForm<any>({ requestId: sp.get("requestId") || "", patientId: "", roomId: sp.get("roomId") || "", procedureName: "", scheduledStart: toLocalInput(), scheduledEnd: "", surgeonId: "", anaesthetistId: "", scrubNurseId: "", notes: "" });

  useEffect(() => {
    if (!facilityId) return;
    act(fetchTheatreRooms({ facilityId }), false);
    act(fetchSurgeryRequests({ facilityId, status: "requested" }), false);
    act(fetchTheaterSchedule({ facilityId }), false);
  }, [facilityId, act]);

  const req: any = theater.requests.find((r) => r._id === form.v.requestId);
  useEffect(() => {
    if (req) form.patch({ patientId: idOf(req.patient), procedureName: req.procedureName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?._id]);

  /* simple clash check: another active case in the same room overlapping this window */
  const start = form.v.scheduledStart ? +new Date(form.v.scheduledStart) : 0;
  const end = form.v.scheduledEnd ? +new Date(form.v.scheduledEnd) : start + 60 * 60000;
  const clash: any = form.v.roomId ? theater.schedule.find((c: any) => c.status !== "cancelled" && c.status !== "completed" && idOf(c.room) === form.v.roomId &&
    +new Date(c.scheduledStart) < end && (c.scheduledEnd ? +new Date(c.scheduledEnd) : +new Date(c.scheduledStart) + 60 * 60000) > start) : null;

  const sections: SectionSpec[] = [
    { title: "Source", cols: 1, fields: [{ key: "requestId", label: "From surgery request (optional)", type: "select", searchable: true,
      options: [{ value: "", label: "No request – book directly" }, ...theater.requests.map((r) => ({ value: r._id, label: `${patientLabel(r.patient)} · ${r.procedureName} (${r.priority})` }))] }] },
    { title: "Patient & procedure", fields: [
      { key: "patientId", label: "Patient", type: "patient", required: true, span: 2 },
      { key: "procedureName", label: "Procedure", required: true, span: 2 },
    ] },
    { title: "Room & time", cols: 3, fields: [
      { key: "roomId", label: "Theatre room", type: "select", required: true, options: theater.rooms.map((r) => ({ value: r._id, label: roomLabel(r) })) },
      { key: "scheduledStart", label: "Start", type: "datetime", required: true },
      { key: "scheduledEnd", label: "Expected end", type: "datetime" },
    ] },
    { title: "Surgical team", cols: 3, fields: [
      { key: "surgeonId", label: "Surgeon", type: "staff" },
      { key: "anaesthetistId", label: "Anaesthetist", type: "staff" },
      { key: "scrubNurseId", label: "Scrub nurse", type: "staff" },
      { key: "notes", label: "Notes", type: "textarea", span: 3 },
    ] },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={`${TBASE}/schedule`} title="Schedule a case" subtitle="Book a theatre room and team"
      submitLabel="Schedule case" saving={theater.saving} narrow={false}
      top={clash ? <Banner tone="bad">This room already has “{clash.procedureName}” at {fmtDateTime(clash.scheduledStart)} that overlaps this slot. You can still book it, but check first.</Banner> : undefined}
      confirm={() => clash ? { title: "Room is already booked", message: `${roomLabel(clash.room)} has another case overlapping this time. Book anyway?`, label: "Book anyway", tone: "danger" } : null}
      onSubmit={async (v) => {
        const payload = clean({ requestId: v.requestId, patientId: v.patientId, roomId: v.roomId, procedureName: v.procedureName.trim(), scheduledStart: toIso(v.scheduledStart), scheduledEnd: toIso(v.scheduledEnd), surgeonId: v.surgeonId, anaesthetistId: v.anaesthetistId, scrubNurseId: v.scrubNurseId, notes: v.notes });
        const r: any = await act(scheduleCase({ facilityId, payload: payload as any }), "Case scheduled");
        if (r) router.push(r === true ? `${TBASE}/schedule` : `${TBASE}/schedule/${idOf(r)}`);
      }} />
  );
}
export default function ScheduleCasePage() { return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>; }
