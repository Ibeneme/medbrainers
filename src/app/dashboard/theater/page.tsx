"use client";

import { useEffect, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import {
  Activity,
  AlertTriangle,
  BedDouble,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  FlaskConical,
  Layers,
  Plus,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  fetchSurgeryRequests,
  fetchTheaterDashboard,
  fetchTheatreRooms,
} from "@/api/slices/theaterSlice";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Banner,
  Btn,
  Empty,
  Header,
  Loader,
  Page,
  Pill,
  RowLink,
  SectionCard,
  Stat,
  TBASE,
  isToday,
  nameOf,
  patientLabel,
  roomLabel,
  useSchedule,
} from "@/components/theater/th-ui";

const SHORTCUTS = [
  {
    title: "Surgery requests",
    href: "/requests",
    icon: ClipboardList,
    desc: "Requests waiting to be scheduled",
  },
  {
    title: "Theatre schedule",
    href: "/schedule",
    icon: Scissors,
    desc: "Cases by day and room",
  },
  {
    title: "Rooms & availability",
    href: "/rooms",
    icon: BedDouble,
    desc: "Which theatre is free now",
  },
  {
    title: "Pre-op assessment",
    href: "/pre-op",
    icon: Stethoscope,
    desc: "Fitness for surgery",
  },
  {
    title: "Consent forms",
    href: "/consent",
    icon: FileSignature,
    desc: "Informed consent",
  },
  {
    title: "Safety checklist",
    href: "/checklist",
    icon: ShieldCheck,
    desc: "Sign-in, time-out, sign-out",
  },
  {
    title: "Operation notes",
    href: "/operation-notes",
    icon: ClipboardCheck,
    desc: "Surgeon's record",
  },
  {
    title: "Instrument & swab count",
    href: "/counts",
    icon: Layers,
    desc: "Nothing left behind",
  },
  {
    title: "Recovery room",
    href: "/recovery",
    icon: Activity,
    desc: "PACU patients",
  },
  {
    title: "Complications",
    href: "/complications",
    icon: AlertTriangle,
    desc: "Adverse events",
  },
  {
    title: "Sterilization (CSSD)",
    href: "/cssd",
    icon: FlaskConical,
    desc: "Autoclave cycles",
  },
  {
    title: "Surgical teams",
    href: "/teams",
    icon: Users,
    desc: "Who is operating",
  },
];

export default function TheaterDashboard() {
  const { facilityId, act, theater, activeFacility, ui, softShadow, cases } =
    useSchedule();
  const d = theater.dashboard;

  useEffect(() => {
    if (!facilityId) return;
    const load = () => {
      act(fetchTheaterDashboard({ facilityId }), false);
      act(fetchSurgeryRequests({ facilityId, status: "requested" }), false);
      act(fetchTheatreRooms({ facilityId }), false);
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [facilityId, act]);

  const today = useMemo(
    () => cases.filter((c) => isToday(c.scheduledStart)),
    [cases]
  );
  const inRecovery = cases.filter((c) => c.status === "recovery").length;
  const overdue = cases.filter(
    (c) => c.status === "scheduled" && new Date(c.scheduledStart) < new Date()
  );
  const emergencies = theater.requests.filter(
    (r) => r.priority === "emergency"
  );
  const busyRooms = new Set(
    cases
      .filter((c) => c.status === "in-theatre")
      .map((c) => (typeof c.room === "object" ? c.room._id : c.room))
  );

  return (
    <Page>
      <Header
        icon={<Scissors size={22} />}
        title="Surgical Theatre"
        subtitle={activeFacility?.name}
        actions={
          <>
            <Btn href={`${TBASE}/guide`} tone="card">
              Guide
            </Btn>
            <Btn href={`${TBASE}/requests/new`} tone="card">
              New request
            </Btn>
            <Btn href={`${TBASE}/schedule/new`}>
              <Plus size={16} /> Schedule case
            </Btn>
          </>
        }
      />

      {!d ? (
        <Loader text="Loading theatre…" />
      ) : (
        <>
          <div className="space-y-3">
            {emergencies.length > 0 && (
              <Banner tone="bad" href={`${TBASE}/requests`} cta="Respond">
                <AlertTriangle size={18} className="text-red-500" />
                {emergencies.length} emergency surgery request
                {emergencies.length === 1 ? "" : "s"} waiting
              </Banner>
            )}
            {overdue.length > 0 && (
              <Banner tone="warn" href={`${TBASE}/schedule`}>
                <AlertTriangle size={18} style={{ color: PRIMARY_COLOR }} />
                {overdue.length} case{overdue.length === 1 ? " is" : "s are"}{" "}
                past the scheduled start and not yet in pre-op
              </Banner>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Cases today"
              value={d.todayCases}
              sub="scheduled for today"
              href={`${TBASE}/schedule`}
            />
            <Stat
              label="In theatre now"
              value={d.inTheatre}
              sub="operations running"
              tone={d.inTheatre ? "warn" : undefined}
              href={`${TBASE}/schedule`}
            />
            <Stat
              label="Pending requests"
              value={d.pendingRequests}
              sub="awaiting a slot"
              href={`${TBASE}/requests`}
            />
            <Stat
              label="In recovery"
              value={inRecovery}
              sub="patients in PACU"
              href={`${TBASE}/recovery`}
            />
          </div>

          <SectionCard
            title="Theatre rooms"
            count={theater.rooms.length}
            right={
              <Btn href={`${TBASE}/rooms`} tone="ghost">
                Availability
              </Btn>
            }
          >
            {theater.rooms.length === 0 ? (
              <Empty>
                No rooms yet.{" "}
                <Link href={`${TBASE}/rooms/new`} className="underline">
                  Add your first theatre room
                </Link>
                .
              </Empty>
            ) : (
              <div className="grid grid-cols-2 gap-3 w-full">
                {theater.rooms.map((r) => {
                  const busy = busyRooms.has(r._id);
                  return (
                    <Link
                      key={r._id}
                      href={`${TBASE}/rooms/${r._id}`}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg w-full"
                      style={{
                        backgroundColor: busy
                          ? ui.isDark
                            ? "#2a2212"
                            : "#fffbeb"
                          : ui.inner,
                        border: `1px solid ${
                          busy ? (ui.isDark ? "#b45309" : "#fde68a") : ui.border
                        }`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono text-base font-bold tracking-tight">
                          {r.code}
                        </span>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: busy ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                      <div className="my-2 min-w-0">
                        <p
                          className="truncate text-xs font-medium opacity-80"
                          title={r.name}
                        >
                          {r.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: busy ? "#d97706" : "#059669" }}
                        >
                          {busy ? "In use" : "Free"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Today's list"
            count={today.length}
            right={
              <Btn href={`${TBASE}/schedule`} tone="ghost">
                Full schedule
              </Btn>
            }
          >
            {today.length === 0 ? (
              <Empty>No cases scheduled for today.</Empty>
            ) : (
              <div className="space-y-3">
                {today.map((c) => (
                  <RowLink key={c._id} href={`${TBASE}/schedule/${c._id}`}>
                    <div className="grid items-center gap-3 lg:grid-cols-[90px_minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                      <p className="font-mono text-sm font-semibold">
                        {new Date(c.scheduledStart).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">
                          {patientLabel(c.patient)}
                        </p>
                        <p className="truncate text-xs opacity-55">
                          {c.procedureName}
                        </p>
                      </div>
                      <p className="text-xs opacity-60">
                        {roomLabel(c.room)}
                        <br />
                        Surgeon {nameOf(c.surgeon)}
                      </p>
                      <Pill value={c.status} />
                    </div>
                  </RowLink>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight opacity-70">
          Workflow
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={`${TBASE}${s.href}`}
              className="flex items-center gap-3.5 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: ui.card, boxShadow: softShadow }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}18`,
                  color: PRIMARY_COLOR,
                }}
              >
                <s.icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block truncate text-xs opacity-55">
                  {s.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Page>
  );
}
