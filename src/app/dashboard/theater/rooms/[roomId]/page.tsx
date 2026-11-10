"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { fetchTheaterSchedule, fetchTheatreRooms } from "@/api/slices/theaterSlice";
import { BackHeader, Btn, Card, DataTable, KV, KVGrid, Loader, NotFound, Page, Pill, RowLink, SectionCard, Stat, TBASE, dur, fmtDateTime, fmtDuration, idOf, isToday, nameOf, patientLabel, useTH } from "@/components/theater/th-ui";

export default function RoomDetailPage() {
  const { roomId } = useParams() as { roomId: string };
  const { facilityId, act, theater } = useTH();

  useEffect(() => {
    if (!facilityId) return;
    act(fetchTheatreRooms({ facilityId, includeInactive: true }), false);
    act(fetchTheaterSchedule({ facilityId }), false);
  }, [facilityId, act]);

  const room = theater.rooms.find((r) => r._id === roomId);
  const mine = useMemo(() => theater.schedule.filter((c) => idOf(c.room) === roomId), [theater.schedule, roomId]);

  if (!room) return <Page>{theater.listLoading || !facilityId ? <Loader text="Loading room…" /> : <NotFound what="Theatre room" href={`${TBASE}/rooms`} />}</Page>;

  const active = mine.filter((c) => c.status !== "cancelled");
  const now = active.find((c) => c.status === "in-theatre");
  const today = active.filter((c) => isToday(c.scheduledStart));
  const upcoming = active.filter((c) => new Date(c.scheduledStart) > new Date() && !isToday(c.scheduledStart) && c.status !== "completed");
  const past = mine.filter((c) => c.status === "completed" || c.status === "cancelled").sort((a, b) => +new Date(b.scheduledStart) - +new Date(a.scheduledStart)).slice(0, 15);
  const opMins = active.map((c) => dur(c.actualStart, c.actualEnd)).filter((x): x is number => x !== undefined);

  const rows = (list: typeof mine) => (
    <div className="space-y-3">
      {list.map((c) => (
        <RowLink key={c._id} href={`${TBASE}/schedule/${c._id}`}>
          <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(c.patient)}</p><p className="truncate text-xs opacity-55">{c.procedureName}</p></div>
            <p className="text-xs opacity-60">{fmtDateTime(c.scheduledStart)}</p>
            <p className="text-xs opacity-60">Surgeon {nameOf(c.surgeon)}</p>
            <Pill value={c.status} />
          </div>
        </RowLink>
      ))}
    </div>
  );

  return (
    <Page>
      <BackHeader href={`${TBASE}/rooms`} title={room.name} subtitle={<span><span className="font-mono">{room.code}</span>{room.type ? ` · ${room.type}` : ""}</span>}
        right={<><Btn href={`${TBASE}/rooms/${roomId}/edit`} tone="card"><Pencil size={14} /> Edit room</Btn>{room.isActive !== false && <Btn href={`${TBASE}/schedule/new?roomId=${roomId}`}>Schedule a case here</Btn>}</>} />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {room.isActive === false ? <Pill value="inactive" /> : <Pill tone={now ? "warn" : "ok"}>{now ? "In use" : "Free"}</Pill>}
        </div>
        {now && <p className="text-sm">Now operating: <strong>{now.procedureName}</strong> on {patientLabel(now.patient)} since {fmtDateTime(now.actualStart)}</p>}
        <KVGrid>
          <KV label="Code"><span className="font-mono">{room.code}</span></KV><KV label="Type">{room.type}</KV><KV label="Status">{room.isActive === false ? "Inactive" : "Active"}</KV>
        </KVGrid>
        {room.notes && <p className="whitespace-pre-wrap text-sm opacity-75">{room.notes}</p>}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Cases today" value={today.length} sub="in this room" />
        <Stat label="Upcoming" value={upcoming.length} sub="after today" />
        <Stat label="All cases" value={active.length} sub="booked or done" />
        <Stat label="Avg operating time" value={opMins.length ? fmtDuration(Math.round(opMins.reduce((a, b) => a + b, 0) / opMins.length)) : "—"} sub="finished cases" />
      </div>

      <SectionCard title="Today" count={today.length}>{today.length ? rows(today) : <p className="py-6 text-center text-sm opacity-60">Nothing scheduled in this room today.</p>}</SectionCard>
      <SectionCard title="Upcoming" count={upcoming.length}>{upcoming.length ? rows(upcoming) : <p className="py-6 text-center text-sm opacity-60">No upcoming cases.</p>}</SectionCard>
      <SectionCard title="Recent history" count={past.length}>
        <DataTable head={["When", "Procedure", "Patient", "Status"]} empty="No finished cases yet." rows={past.map((c) => [fmtDateTime(c.scheduledStart), c.procedureName, patientLabel(c.patient), <Pill key="s" value={c.status} />])} />
      </SectionCard>
    </Page>
  );
}
