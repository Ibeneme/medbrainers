"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, Ambulance, BarChart3, BedDouble, Eye, FileWarning, HeartPulse, ListChecks, Plus,
  ArrowRightLeft, Siren, UserPlus, Users, LogOut, FlaskConical,
} from "lucide-react";
import { fetchErActive, fetchErDashboard, fetchErDispatches } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  BASE, Banner, Btn, Empty, ErPill, Header, Loader, Page, RegistrationRow, Ring, RowLink, SectionCard, Stat, TRIAGE, TRIAGE_ORDER,
  fmtMins, minsSince, sortByPriority, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

const SHORTCUTS = [
  { title: "Emergency registration", href: "/register", icon: UserPlus, desc: "Log a new arrival" },
  { title: "Triage board", href: "/triage", icon: ListChecks, desc: "Assess and prioritise" },
  { title: "Ambulance & dispatch", href: "/ambulance", icon: Ambulance, desc: "Calls, crews and ETAs" },
  { title: "ER patient tracker", href: "/tracker", icon: Users, desc: "Everyone in the department" },
  { title: "Resuscitation bay", href: "/resus", icon: HeartPulse, desc: "Critical patients right now" },
  { title: "Emergency orders", href: "/orders", icon: FlaskConical, desc: "STAT labs, imaging, drugs" },
  { title: "Observation unit", href: "/observation", icon: Eye, desc: "Short-stay monitoring" },
  { title: "Trauma cases", href: "/trauma", icon: Activity, desc: "Primary & secondary survey" },
  { title: "Mass-casualty mode", href: "/mass-casualty", icon: Siren, desc: "Major incident response" },
  { title: "Medico-legal cases", href: "/medico-legal", icon: FileWarning, desc: "Police and evidence log" },
  { title: "ER admissions", href: "/admissions", icon: BedDouble, desc: "Handed to the wards" },
  { title: "Referrals & transfers", href: "/referrals", icon: ArrowRightLeft, desc: "Send to another facility" },
  { title: "ER discharges", href: "/discharges", icon: LogOut, desc: "Discharge, LAMA, deaths" },
  { title: "ER reports", href: "/reports", icon: BarChart3, desc: "Throughput and timings" },
];

export default function EmergencyDashboard() {
  const er = useER();
  const { facilityId, act, emergency, activeFacility, ui, softShadow } = er;
  const d = emergency.dashboard;
  useTick();

  const load = useCallback(() => {
    if (!facilityId) return;
    act(fetchErDashboard({ facilityId }), false);
    act(fetchErActive({ facilityId }), false);
    act(fetchErDispatches({ facilityId }), false);
  }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId);

  const queue = sortByPriority(emergency.active.filter((r) => r.status === "waiting" || r.status === "triaged")).slice(0, 6);
  const inbound = emergency.dispatches.filter((x) => ["dispatched", "en-route", "on-scene", "returning"].includes(x.status));
  const seenPct = d && d.totalActive ? Math.round(((d.totalActive - d.waiting) / d.totalActive) * 100) : 0;

  return (
    <Page>
      <Header
        icon={<Siren size={22} />}
        title="Emergency Department"
        subtitle={activeFacility?.name}
        actions={
          <>
            <Btn href={`${BASE}/ambulance/new`} tone="card">Log ambulance call</Btn>
            <Btn href={`${BASE}/register`}><Plus size={16} /> Register arrival</Btn>
          </>
        }
      />

      {!d ? (
        <Loader text="Loading emergency department…" />
      ) : (
        <>
          <div className="space-y-3">
            {d.massCasualty && (
              <Banner tone="bad" href={`${BASE}/mass-casualty/${d.massCasualty._id}`} cta="Open board">
                <Siren size={18} className="text-red-500" />
                Mass-casualty mode is active: {d.massCasualty.name}
              </Banner>
            )}
            {d.awaitingTriage > 0 && (
              <Banner tone={d.triageDelays ? "bad" : "warn"} href={`${BASE}/triage`} cta="Triage">
                <AlertTriangle size={18} className={d.triageDelays ? "text-red-500" : ""} style={d.triageDelays ? undefined : { color: PRIMARY_COLOR }} />
                {d.awaitingTriage} patient{d.awaitingTriage === 1 ? "" : "s"} awaiting triage
                {d.triageDelays > 0 && ` · ${d.triageDelays} waiting longer than ${d.targets.triageDelayMinutes} min`}
              </Banner>
            )}
            {d.breaches > 0 && (
              <Banner tone="bad" href={`${BASE}/tracker`} cta="Review">
                <AlertTriangle size={18} className="text-red-500" />
                {d.breaches} patient{d.breaches === 1 ? "" : "s"} waiting past their triage target
              </Banner>
            )}
            {d.inResus > 0 && (
              <Banner tone="info" href={`${BASE}/resus`} cta="Resus bay">
                <HeartPulse size={18} className="text-blue-500" />
                {d.inResus} patient{d.inResus === 1 ? "" : "s"} in the resuscitation bay
              </Banner>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 flex items-center gap-5 rounded-3xl p-5 lg:col-span-1" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
              <Ring pct={seenPct} size={72} stroke={6} />
              <div>
                <p className="text-xs font-medium opacity-55">Patients being seen</p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                  {d.totalActive - d.waiting}
                  <span className="text-base font-normal opacity-50">/{d.totalActive}</span>
                </p>
                <p className="text-[11px] opacity-45">vs. still waiting</p>
              </div>
            </div>
            <Stat label="In the department" value={d.totalActive} sub="active patients" href={`${BASE}/tracker`} />
            <Stat label="Waiting" value={d.waiting} sub={d.longestWaitMinutes ? `longest ${fmtMins(d.longestWaitMinutes)}` : "no one waiting"} tone={d.breaches ? "bad" : undefined} href={`${BASE}/triage`} />
            <Stat label="Red / immediate" value={d.redTriage} sub="highest priority" tone={d.redTriage ? "bad" : undefined} href={`${BASE}/resus`} />
            <Stat label="In resus" value={d.inResus} sub="resuscitation bay" href={`${BASE}/resus`} />
            <Stat label="In treatment" value={d.inTreatment} sub="being treated" href={`${BASE}/tracker`} />
            <Stat label="Observation" value={d.inObservation} sub="short-stay unit" href={`${BASE}/observation`} />
            <Stat label="Ambulance calls" value={d.activeDispatches} sub="open right now" href={`${BASE}/ambulance`} />
            <Stat label="Arrivals today" value={d.arrivalsToday} sub="since midnight" href={`${BASE}/tracker`} />
            <Stat label="Left today" value={d.dispositionsToday} sub="dispositions recorded" href={`${BASE}/discharges`} />
          </div>

          <SectionCard title="Department by triage category">
            <div className="flex flex-wrap gap-2.5">
              {TRIAGE_ORDER.map((k) => (
                <Link
                  key={k}
                  href={`${BASE}/tracker?triage=${k}`}
                  className="flex h-20 w-[118px] flex-col items-center justify-center rounded-2xl px-1 transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: `${TRIAGE[k].color}18`, color: TRIAGE[k].color, border: `1px solid ${TRIAGE[k].color}40` }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide">{k}</span>
                  <span className="text-2xl font-semibold leading-none">{d.byTriage?.[k] ?? 0}</span>
                  <span className="mt-0.5 text-[10px] opacity-70">{TRIAGE[k].label}</span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Next to be seen" count={queue.length} right={<Btn href={`${BASE}/triage`} tone="ghost">Triage board</Btn>}>
              {queue.length ? (
                <div className="space-y-3">{queue.map((r) => <RegistrationRow key={r._id} r={r} />)}</div>
              ) : (
                <Empty>Nobody is waiting.</Empty>
              )}
            </SectionCard>

            <SectionCard title="Ambulances in motion" count={inbound.length} right={<Btn href={`${BASE}/ambulance`} tone="ghost">All calls</Btn>}>
              {inbound.length ? (
                <div className="space-y-3">
                  {inbound.map((x) => (
                    <RowLink key={x._id} href={`${BASE}/ambulance/${x._id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold">{x.vehicle || "Unassigned vehicle"} → {x.pickupAddress}</p>
                          <p className="truncate text-xs opacity-55">{x.chiefComplaint || "No details"} · called {fmtMins(minsSince(x.callReceivedAt))} ago</p>
                        </div>
                        <div className="flex gap-2"><ErPill value={x.priority} /><ErPill value={x.status} /></div>
                      </div>
                    </RowLink>
                  ))}
                </div>
              ) : (
                <Empty>No ambulances on the road.</Empty>
              )}
            </SectionCard>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight opacity-70">Workflow</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={`${BASE}${s.href}`} className="flex items-center gap-3.5 rounded-2xl p-4 transition-all hover:-translate-y-0.5" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${PRIMARY_COLOR}18`, color: PRIMARY_COLOR }}>
                <s.icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block truncate text-xs opacity-55">{s.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Page>
  );
}
