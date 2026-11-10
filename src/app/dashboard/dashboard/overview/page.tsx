"use client";

import { useState } from "react";
import {
  Activity,
  BedDouble,
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Pill,
  ScanLine,
  Siren,
  Timer,
  UserCog,
  Users,
} from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";
import {
  AlertRow,
  AllClear,
  ErrorNote,
  LineChart,
  OverviewTabs,
  Panel,
  RefreshBar,
  Segmented,
  StackedBar,
  StatCard,
  label,
  nf,
  useDashUI,
  type Tone,
} from "@/components/dashboard/overview/dash-ui";
import { useDashboard } from "@/hooks/useDashboard";

type Group = "flow" | "inpatient" | "orders";
const GROUPS: Group[] = ["flow", "inpatient", "orders"];
const GROUP_TEXT: Record<Group, string> = {
  flow: "Patient flow",
  inpatient: "Inpatients",
  orders: "Orders",
};

export default function DashboardOverviewPage() {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [group, setGroup] = useState<Group>("flow");
  const { tones, primary, secondary } = useDashUI();
  const d = useDashboard(["overview", "trends", "alerts"], { days });

  const o = d.overview;
  const t = d.trends;
  const loadingFirst = d.loading.overview && !o;

  const queueTone: Tone = (o?.queue.longestWaitMinutes ?? 0) > 60 ? "warning" : "neutral";
  const occTone: Tone = !o ? "neutral" : o.beds.occupancyRate >= 90 ? "critical" : o.beds.occupancyRate >= 75 ? "warning" : "ok";

  const chartSeries = !t
    ? []
    : group === "flow"
      ? [
          { key: "reg", text: "New patients", values: t.series.registrations, color: primary },
          { key: "appt", text: "Appointments", values: t.series.appointments, color: secondary },
          { key: "er", text: "ER arrivals", values: t.series.emergencyArrivals, color: tones.critical },
        ]
      : group === "inpatient"
        ? [
            { key: "adm", text: "Admissions", values: t.series.admissions, color: primary },
            { key: "dis", text: "Discharges", values: t.series.discharges, color: secondary },
          ]
        : [
            { key: "lab", text: "Lab orders", values: t.series.labOrders, color: primary },
            { key: "img", text: "Imaging orders", values: t.series.imagingOrders, color: secondary },
          ];

  // Triage colours follow the standard red/orange/yellow/green/blue convention.
  const triage = [
    { key: "red", text: "Red · immediate", color: "#dc2626" },
    { key: "orange", text: "Orange · very urgent", color: "#ea580c" },
    { key: "yellow", text: "Yellow · urgent", color: "#ca8a04" },
    { key: "green", text: "Green · standard", color: "#16a34a" },
    { key: "blue", text: "Blue · non-urgent", color: "#2563eb" },
  ].map((s) => ({ ...s, value: o?.emergency.byTriage[s.key] ?? 0 }));

  const apptSegments = [
    { key: "scheduled", color: secondary },
    { key: "checked_in", color: tones.warning },
    { key: "in_progress", color: primary },
    { key: "completed", color: tones.ok },
    { key: "no_show", color: tones.critical },
    { key: "cancelled", color: "#9ca3af" },
  ].map((s) => ({ ...s, text: label(s.key), value: o?.appointmentsToday.byStatus[s.key] ?? 0 }));

  return (
    <ModuleShell
      title="Dashboard"
      subtitle="Live facility overview"
      icon={LayoutDashboard}
      actions={<RefreshBar lastUpdated={d.lastUpdated} loading={d.anyLoading} onRefresh={d.refresh} />}
    >
      <OverviewTabs />
      <ErrorNote message={d.error} onRetry={d.refresh} />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Active patients"
          value={nf(o?.patients.active)}
          hint={`${nf(o?.patients.registeredToday)} registered today`}
          icon={<Users size={16} />}
          href="/dashboard/patients"
          loading={loadingFirst}
        />
        <StatCard
          label="Appointments today"
          value={nf(o?.appointmentsToday.total)}
          hint={`${o?.appointmentsToday.completionRate ?? 0}% completed`}
          icon={<CalendarCheck size={16} />}
          href="/dashboard/appointments"
          loading={loadingFirst}
        />
        <StatCard
          label="Waiting in queue"
          value={nf(o?.queue.waiting)}
          hint={o?.queue.waiting ? `Longest wait ${o.queue.longestWaitMinutes} min` : "No one waiting"}
          tone={queueTone}
          icon={<Timer size={16} />}
          href="/dashboard/appointments/queue"
          loading={loadingFirst}
        />
        <StatCard
          label="Bed occupancy"
          value={`${o?.beds.occupancyRate ?? 0}%`}
          hint={`${nf(o?.beds.byStatus.available)} of ${nf(o?.beds.total)} beds free`}
          tone={occTone}
          icon={<BedDouble size={16} />}
          href="/dashboard/wards/beds"
          loading={loadingFirst}
        />
        <StatCard
          label="Emergency — active"
          value={nf(o?.emergency.activeNow)}
          hint={`${nf(o?.emergency.waiting)} red/orange waiting`}
          tone={o?.emergency.waiting ? "critical" : "neutral"}
          icon={<Siren size={16} />}
          href="/dashboard/emergency/tracker"
          loading={loadingFirst}
        />
        <StatCard
          label="Open lab requests"
          value={nf(o?.labs.open)}
          hint={`${nf(o?.labs.urgentOpen)} urgent / STAT`}
          tone={o?.labs.urgentOpen ? "warning" : "neutral"}
          icon={<FlaskConical size={16} />}
          href="/dashboard/labs/requests"
          loading={loadingFirst}
        />
        <StatCard
          label="Open imaging"
          value={nf(o?.radiology.open)}
          hint={`${nf(o?.radiology.urgentOpen)} urgent / STAT`}
          tone={o?.radiology.urgentOpen ? "warning" : "neutral"}
          icon={<ScanLine size={16} />}
          href="/dashboard/radiology/worklist"
          loading={loadingFirst}
        />
        <StatCard
          label="Prescriptions to fill"
          value={nf(o?.pharmacy.prescriptionsPending)}
          icon={<Pill size={16} />}
          href="/dashboard/pharmacy/dispense"
          loading={loadingFirst}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Activity"
          subtitle={t ? `Last ${t.days} days` : undefined}
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Segmented options={GROUPS} value={group} onChange={setGroup} labelText="Chart group" render={(g) => GROUP_TEXT[g]} />
              <Segmented options={[7, 14, 30] as const} value={days} onChange={setDays} labelText="Period" render={(n) => `${n}d`} />
            </div>
          }
        >
          {t ? <LineChart labels={t.labels} series={chartSeries} /> : <div className="h-[220px] animate-pulse rounded-2xl opacity-20" style={{ background: tones.neutral }} />}
        </Panel>

        <Panel
          title="Needs attention"
          subtitle={d.alerts ? `${d.alerts.counts.critical} critical · ${d.alerts.counts.warning} warnings` : undefined}
        >
          {d.alerts && d.alerts.alerts.length === 0 ? (
            <AllClear />
          ) : (
            <div className="space-y-2">
              {(d.alerts?.alerts ?? []).slice(0, 6).map((a) => (
                <AlertRow key={a.id} {...a} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Emergency by triage" subtitle="Patients currently in the ER">
          <StackedBar segments={triage} emptyText="No active ER patients" />
        </Panel>
        <Panel title="Today's appointments" subtitle="By status">
          <StackedBar segments={apptSegments} emptyText="No appointments scheduled today" />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Admitted today"
          value={nf(o?.beds.admittedToday)}
          hint={`${nf(o?.beds.admittedNow)} inpatients now`}
          icon={<Activity size={16} />}
          loading={loadingFirst}
        />
        <StatCard label="Discharged today" value={nf(o?.beds.dischargedToday)} icon={<Activity size={16} />} loading={loadingFirst} />
        <StatCard
          label="Open tasks"
          value={nf((o?.tasks.open ?? 0) + (o?.tasks.inProgress ?? 0))}
          hint={`${nf(o?.tasks.overdue)} overdue · ${nf(o?.tasks.mineOpen)} yours`}
          tone={o?.tasks.overdue ? "warning" : "neutral"}
          icon={<ClipboardList size={16} />}
          href="/dashboard/tasks"
          loading={loadingFirst}
        />
        <StatCard
          label="Staff on shift today"
          value={nf(o?.staff.onShiftToday)}
          hint={`${nf(o?.staff.active)} active staff`}
          icon={<UserCog size={16} />}
          href="/dashboard/staff/roster"
          loading={loadingFirst}
        />
      </div>
    </ModuleShell>
  );
}
