"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Scissors } from "lucide-react";
import {
  fetchTheaterSchedule,
  fetchTheatreRooms,
} from "@/api/slices/theaterSlice";
import { CustomDropdown, CustomPopupDatePicker } from "@/components/ui/items";
import {
  Btn,
  Empty,
  Header,
  Loader,
  Page,
  Pill,
  Pills,
  RowLink,
  SectionCard,
  TBASE,
  TH,
  dur,
  fmtDateTime,
  fmtDuration,
  label,
  nameOf,
  patientLabel,
  roomLabel,
  toDateInput,
  useTH,
} from "@/components/theater/th-ui";

export default function TheatreSchedulePage() {
  const { facilityId, act, theater, activeFacility, ui, isDark, colors } =
    useTH();
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("all");
  const [room, setRoom] = useState("");

  useEffect(() => {
    if (!facilityId) return;
    act(fetchTheaterSchedule({ facilityId, date: date || undefined }), false);
    act(fetchTheatreRooms({ facilityId }), false);
  }, [facilityId, act, date]);

  const rows = useMemo(
    () =>
      theater.schedule.filter(
        (c) =>
          (status === "all" || c.status === status) &&
          (!room || (typeof c.room === "object" ? c.room._id : c.room) === room)
      ),
    [theater.schedule, status, room]
  );

  return (
    <Page>
      <Header
        icon={<Scissors size={22} />}
        title="Theatre Schedule"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${TBASE}/schedule/new`}>
            <Plus size={16} /> Schedule case
          </Btn>
        }
      />
      <>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <CustomPopupDatePicker
              label="Day"
              value={date}
              onChange={(v) => setDate(v.split("T")[0])}
              border={ui.border}
              colors={colors}
              isDark={isDark}
              placeholder="Pick a day…"
            />
          </div>
          <Btn tone="ghost" onClick={() => setDate("")}>
            All days
          </Btn>
          <Btn
            tone="ghost"
            onClick={() => setDate(toDateInput(new Date().toISOString()))}
          >
            Today
          </Btn>
          <div className="w-52">
            <CustomDropdown
              value={room}
              options={[
                { label: "All rooms", value: "" },
                ...theater.rooms.map((r) => ({
                  label: `${r.code} · ${r.name}`,
                  value: r._id,
                })),
              ]}
              onChange={setRoom}
              placeholder="Select room…"
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
          </div>
        </div>
        <Pills
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Any status" },
            ...TH.caseStatuses.map((s) => ({ value: s, label: label(s) })),
          ]}
        />
        {theater.listLoading && rows.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No cases found.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <RowLink key={c._id} href={`${TBASE}/schedule/${c._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {patientLabel(c.patient)}
                    </p>
                    <p className="truncate text-xs opacity-55">
                      {c.procedureName}
                    </p>
                  </div>
                  <p className="text-xs opacity-60">
                    {fmtDateTime(c.scheduledStart)}
                    {c.scheduledEnd
                      ? ` · ${fmtDuration(
                          dur(c.scheduledStart, c.scheduledEnd)
                        )}`
                      : ""}
                    <br />
                    {roomLabel(c.room)}
                  </p>
                  <p className="text-xs opacity-60">
                    Surgeon {nameOf(c.surgeon)}
                    <br />
                    Anaesthetist {nameOf(c.anaesthetist)}
                  </p>
                  <Pill value={c.status} />
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
