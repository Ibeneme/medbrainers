"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { fetchDrives } from "@/api/slices";
import {
  BASE, Bar, Btn, Empty, Header, Loader, Page, Pill, Pills, RowLink, SectionCard,
  ENUMS, fmtDateTime, label, useBB,
} from "@/components/blood-bank/bb-ui";

export default function DrivesPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (facilityId) act(fetchDrives({ facilityId, status: status === "all" ? undefined : status, limit: 200 }), false);
  }, [facilityId, act, status]);

  const drives = bloodBank.drives;

  return (
    <Page>
      <Header
        icon={<CalendarDays size={22} />}
        title="Blood Drives"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/drives/new`}><Plus size={16} /> Schedule drive</Btn>}
      />
      <SectionCard title="Drives" count={drives.length}>
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, ...ENUMS.driveStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        {bloodBank.listLoading && drives.length === 0 ? (
          <Loader />
        ) : drives.length === 0 ? (
          <Empty>No blood drives yet. Schedule one to plan outreach collections.</Empty>
        ) : (
          <div className="space-y-3">
            {drives.map((d) => {
              const collected = d.stats?.collected ?? 0;
              const pct = d.targetUnits ? Math.round((collected / d.targetUnits) * 100) : 0;
              return (
                <RowLink key={d._id} href={`${BASE}/drives/${d._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{d.name}</p>
                      <p className="truncate font-mono text-xs opacity-50">{d.driveNumber}</p>
                    </div>
                    <div className="text-xs opacity-60">
                      <p className="truncate">{d.location}</p>
                      <p>{fmtDateTime(d.scheduledAt)}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs opacity-60">{collected}/{d.targetUnits || 0} units · {d.stats?.screened ?? 0} screened</p>
                      <Bar pct={pct} />
                    </div>
                    <Pill value={d.status} />
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
