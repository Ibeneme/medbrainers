"use client";

import { BedDouble, Baby, Scissors, Siren, Ambulance } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";
import {
  BarList,
  Empty,
  ErrorNote,
  Gauge,
  OverviewTabs,
  Panel,
  RefreshBar,
  StackedBar,
  StatCard,
  label,
  nf,
  useDashUI,
} from "@/components/dashboard/overview/dash-ui";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardCapacityPage() {
  const d = useDashboard(["overview", "capacity"]);
  const { ui, tones, mix, primary, secondary } = useDashUI();
  const o = d.overview;
  const c = d.capacity;

  const bedSegments = [
    { key: "occupied", color: primary },
    { key: "available", color: tones.ok },
    { key: "reserved", color: secondary },
    { key: "cleaning", color: tones.warning },
    { key: "maintenance", color: "#9ca3af" },
    { key: "blocked", color: tones.critical },
  ].map((s) => ({ ...s, text: label(s.key), value: o?.beds.byStatus[s.key] ?? 0 }));

  const erRows = Object.entries(c?.emergencyByStatus ?? {}).map(([k, v]) => ({ key: k, text: label(k), value: v }));
  const theatreRows = Object.entries(c?.theatre.todayByStatus ?? {}).map(([k, v]) => ({ key: k, text: label(k), value: v }));
  const loadingFirst = d.loading.capacity && !c;

  return (
    <ModuleShell
      title="Capacity"
      subtitle="Beds, emergency, theatre and maternity"
      icon={BedDouble}
      actions={<RefreshBar lastUpdated={d.lastUpdated} loading={d.anyLoading} onRefresh={d.refresh} />}
    >
      <OverviewTabs />
      <ErrorNote message={d.error} onRetry={d.refresh} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Hospital occupancy" subtitle="Excludes beds under maintenance or blocked">
          <div className="flex items-center gap-5">
            <Gauge value={o?.beds.occupancyRate ?? 0} caption="occupied" />
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-6">
                <dt style={{ color: mix(60) }}>Total beds</dt>
                <dd className="tabular-nums font-semibold">{nf(o?.beds.total)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt style={{ color: mix(60) }}>Inpatients</dt>
                <dd className="tabular-nums font-semibold">{nf(o?.beds.admittedNow)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt style={{ color: mix(60) }}>Free now</dt>
                <dd className="tabular-nums font-semibold">{nf(o?.beds.byStatus.available)}</dd>
              </div>
            </dl>
          </div>
        </Panel>
        <Panel className="lg:col-span-2" title="Bed status" subtitle="All active wards">
          <StackedBar segments={bedSegments} emptyText="No beds configured yet" />
        </Panel>
      </div>

      <Panel title="Wards" subtitle="Occupancy per ward, fullest first">
        {loadingFirst ? (
          <div className="h-32 animate-pulse rounded-2xl" style={{ background: ui.inner }} />
        ) : !c || c.wards.length === 0 ? (
          <Empty text="No wards have been created yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ color: mix(55) }}>
                  <th className="pb-2 font-medium">Ward</th>
                  <th className="pb-2 font-medium">Occupancy</th>
                  <th className="pb-2 text-right font-medium">Occupied</th>
                  <th className="pb-2 text-right font-medium">Free</th>
                  <th className="pb-2 text-right font-medium">Reserved</th>
                  <th className="pb-2 text-right font-medium">Cleaning</th>
                  <th className="pb-2 text-right font-medium">Out of service</th>
                </tr>
              </thead>
              <tbody>
                {[...c.wards]
                  .sort((a, b) => b.occupancyRate - a.occupancyRate)
                  .map((w) => {
                    const color = w.occupancyRate >= 90 ? tones.critical : w.occupancyRate >= 75 ? tones.warning : tones.ok;
                    return (
                      <tr key={w.id} className="border-t" style={{ borderColor: ui.border }}>
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{w.name}</div>
                          <div className="text-xs" style={{ color: mix(50) }}>
                            {w.code}
                            {w.department ? ` · ${w.department}` : ""}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full" style={{ background: ui.inner }}>
                              <div className="h-full rounded-full" style={{ width: `${w.occupancyRate}%`, background: color }} />
                            </div>
                            <span className="w-10 tabular-nums text-xs font-semibold" style={{ color }}>
                              {w.occupancyRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums">{w.occupied}</td>
                        <td className="py-3 text-right tabular-nums">{w.available}</td>
                        <td className="py-3 text-right tabular-nums">{w.reserved}</td>
                        <td className="py-3 text-right tabular-nums">{w.cleaning}</td>
                        <td className="py-3 text-right tabular-nums">{w.outOfService}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Emergency department" subtitle="Patients currently active, by stage" action={<Siren size={16} style={{ color: mix(50) }} />}>
          <BarList rows={erRows} color={tones.critical} emptyText="No active ER patients" />
        </Panel>
        <Panel title="Theatre today" subtitle="Scheduled cases by status" action={<Scissors size={16} style={{ color: mix(50) }} />}>
          <BarList rows={theatreRows} emptyText="No cases scheduled today" />
          {c && (
            <p className="mt-4 text-xs" style={{ color: mix(60) }}>
              Awaiting scheduling:{" "}
              <b>{nf(c.theatre.pendingRequestsByPriority.emergency)}</b> emergency ·{" "}
              <b>{nf(c.theatre.pendingRequestsByPriority.urgent)}</b> urgent ·{" "}
              <b>{nf(c.theatre.pendingRequestsByPriority.elective)}</b> elective
            </p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="In labour" value={nf(c?.maternity.labourActive)} icon={<Baby size={16} />} href="/dashboard/maternal/labour" loading={loadingFirst} />
        <StatCard label="NICU admitted" value={nf(c?.maternity.nicuAdmitted)} icon={<Baby size={16} />} href="/dashboard/maternal/nicu" loading={loadingFirst} />
        <StatCard
          label="High-risk ANC"
          value={nf(c?.maternity.highRiskAnc)}
          tone={c?.maternity.highRiskAnc ? "warning" : "neutral"}
          icon={<Baby size={16} />}
          href="/dashboard/maternal/anc/high-risk"
          loading={loadingFirst}
        />
        <StatCard
          label="Ambulances active"
          value={nf(c?.ambulancesActive)}
          icon={<Ambulance size={16} />}
          href="/dashboard/emergency/ambulance"
          loading={loadingFirst}
        />
      </div>
    </ModuleShell>
  );
}
