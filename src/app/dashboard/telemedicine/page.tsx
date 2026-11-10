"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, History, Plus, Radio, Settings, StickyNote, Video } from "lucide-react";
import { fetchTeleDashboard, fetchTeleSessions } from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import { ActionLink, EmptyState, ModuleShell, StatusPill, useInputStyles } from "@/components/dashboard/ModuleShell";
import { STATUS_COLOR, TM, TYPE_LABEL, fmtWhen, patientName } from "@/components/telemedicine/tm-ui";

const LINKS = [
  { href: `${TM}/current`, label: "Current visits", desc: "Live rooms and anyone who can join now", icon: Radio },
  { href: `${TM}/archive`, label: "Upcoming", desc: "Sessions that have not opened yet", icon: CalendarClock },
  { href: `${TM}/history`, label: "Past consultations", desc: "Completed, missed and cancelled", icon: History },
  { href: `${TM}/notes`, label: "Session notes", desc: "SOAP notes, drafts and signed records", icon: StickyNote },
  { href: `${TM}/setup`, label: "Setup telehealth", desc: "Waiting room, consent, duration, STUN", icon: Settings },
];

export default function VirtualConsultationsPage() {
  const { facilityId, dispatch, telemedicine, activeFacility } = useTelemedicine();
  const { cardCls, ui } = useInputStyles();
  const d = telemedicine.dashboard;

  useEffect(() => {
    if (!facilityId) return;
    const load = () => {
      dispatch(fetchTeleDashboard({ facilityId }));
      dispatch(fetchTeleSessions({ facilityId, scope: "current", limit: 8 }));
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [dispatch, facilityId]);

  const stats = [
    { label: "Today", value: d?.scheduledToday ?? "—", sub: "on the book" },
    { label: "Still to come", value: d?.upcomingToday ?? "—", sub: "later today" },
    { label: "Live now", value: d?.liveNow ?? "—", sub: d?.waitingNow ? `${d.waitingNow} waiting` : "in a room" },
    { label: "Finished today", value: d?.completedToday ?? "—", sub: d ? `${d.avgDurationMinutes} min avg` : "" },
  ];

  return (
    <ModuleShell
      title="Virtual Consultations"
      subtitle={activeFacility?.name || "Telehealth"}
      icon={Video}
      loading={telemedicine.listLoading && !d}
      actions={
        <>
          <ActionLink href={`${TM}/notes`}>
            <span className="inline-flex items-center gap-1"><ClipboardList size={14} /> Notes{d?.myDraftNotes ? ` (${d.myDraftNotes})` : ""}</span>
          </ActionLink>
          <Link href={`${TM}/sessions/new`} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Plus size={14} /> Schedule
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[24px] border p-4" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-50">{s.label}</p>
            <p className="mt-1 text-3xl font-medium">{s.value}</p>
            <p className="text-xs opacity-50">{s.sub}</p>
          </div>
        ))}
      </div>

      {!!d?.missedWeek && (
        <Link href={`${TM}/history`} className="block rounded-2xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(217,119,6,0.12)", color: "#b45309" }}>
          {d.missedWeek} missed visit{d.missedWeek === 1 ? "" : "s"} in the last 7 days
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Happening now</h2>
            <Link href={`${TM}/current`} className="text-xs font-semibold" style={{ color: PRIMARY_COLOR }}>Open queue</Link>
          </div>
          {telemedicine.sessions.length === 0 ? (
            <EmptyState text="Nobody is in a visit right now." />
          ) : (
            <div className="space-y-2">
              {telemedicine.sessions.map((s) => (
                <Link key={s._id} href={`${TM}/sessions/${s._id}`} className="flex items-center justify-between gap-3 rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="truncate text-xs opacity-55">{patientName(s)} · {fmtWhen(s.scheduledStart)}{s.live ? ` · ${s.live.participants} in, ${s.live.waiting} waiting` : ""}</p>
                  </div>
                  <StatusPill status={s.status} map={STATUS_COLOR} />
                </Link>
              ))}
            </div>
          )}
          {d?.nextSession && (
            <Link href={`${TM}/sessions/${d.nextSession._id}`} className="block rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: ui.border }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-50">Your next visit</p>
              <p className="font-semibold">{d.nextSession.title}</p>
              <p className="text-xs opacity-55">{fmtWhen(d.nextSession.scheduledStart)} · {TYPE_LABEL[d.nextSession.type]} · {patientName(d.nextSession)}</p>
            </Link>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-start gap-3 rounded-[24px] border p-4" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}>
                <l.icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{l.label}</span>
                <span className="block text-xs opacity-55">{l.desc}</span>
              </span>
            </Link>
          ))}
          {d && (
            <p className="px-1 text-xs opacity-45">{d.consultations30d} completed visits in the last 30 days.</p>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
