"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { BedDouble, Plus } from "lucide-react";
import {
  fetchTheaterSchedule,
  fetchTheatreRooms,
} from "@/api/slices/theaterSlice";
import {
  Btn,
  Empty,
  Header,
  Loader,
  Page,
  Pill,
  Pills,
  SectionCard,
  TBASE,
  fmtDateTime,
  idOf,
  isToday,
  patientLabel,
  useTH,
} from "@/components/theater/th-ui";
import { useTheme } from "@/contexts/theme-context";

export default function RoomsPage() {
  const { facilityId, act, theater, activeFacility, ui } = useTH();
  const [inactive, setInactive] = useState(false);
  useEffect(() => {
    if (!facilityId) return;
    const load = () => {
      act(fetchTheatreRooms({ facilityId, includeInactive: inactive }), false);
      act(fetchTheaterSchedule({ facilityId }), false);
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [facilityId, act, inactive]);

  const { colors } = useTheme();

  return (
    <Page>
      <Header
        icon={<BedDouble size={22} />}
        title="Theatre Rooms & Availability"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${TBASE}/rooms/new`}>
            <Plus size={16} /> Add room
          </Btn>
        }
      />
      <>
        {theater.listLoading && theater.rooms.length === 0 ? (
          <Loader />
        ) : theater.rooms.length === 0 ? (
          <Empty>No theatre rooms yet. Add your first room.</Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {theater.rooms.map((r) => {
              const mine = theater.schedule.filter(
                (c) => idOf(c.room) === r._id && c.status !== "cancelled"
              );
              const now = mine.find((c) => c.status === "in-theatre");
              const todays = mine.filter((c) => isToday(c.scheduledStart));
              const upcoming = mine
                .filter(
                  (c) =>
                    new Date(c.scheduledStart) > new Date() &&
                    c.status !== "completed"
                )
                .sort(
                  (a, b) =>
                    +new Date(a.scheduledStart) - +new Date(b.scheduledStart)
                )[0];
              return (
                <Link
                  key={r._id}
                  href={`${TBASE}/rooms/${r._id}`}
                  className="space-y-3 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: colors.shadeBg }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{r.name}</p>
                      <p className="text-xs opacity-55">
                        <span className="font-mono">{r.code}</span>
                        {r.type ? ` · ${r.type}` : ""}
                      </p>
                    </div>
                    {r.isActive === false ? (
                      <Pill value="inactive" />
                    ) : (
                      <Pill tone={now ? "warn" : "ok"}>
                        {now ? "In use" : "Free"}
                      </Pill>
                    )}
                  </div>
                  {now && (
                    <p className="text-xs">
                      Now: <strong>{now.procedureName}</strong> ·{" "}
                      {patientLabel(now.patient)}
                    </p>
                  )}
                  <p className="text-xs opacity-60">
                    {todays.length} case{todays.length === 1 ? "" : "s"} today
                    {upcoming
                      ? ` · next ${fmtDateTime(upcoming.scheduledStart)}`
                      : ""}
                  </p>
                  {r.notes && <p className="text-xs opacity-50">{r.notes}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </>
    </Page>
  );
}
