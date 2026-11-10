"use client";

import { useCallback, useMemo, useState } from "react";
import { Ambulance, Plus } from "lucide-react";
import { fetchErDispatches } from "@/api/slices";
import {
  BASE, Btn, ER, Empty, ErPill, Header, Loader, Page, Pills, RowLink, SearchBox, SectionCard,
  erLabel, fmtMins, minsSince, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

export default function AmbulancePage() {
  const { facilityId, act, emergency, activeFacility } = useER();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("open");
  useTick();
  const load = useCallback(() => { if (facilityId) act(fetchErDispatches({ facilityId }), false); }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId, 20000);

  const rows = useMemo(
    () =>
      emergency.dispatches.filter((d) => {
        if (status === "open" ? !ER.openDispatch.includes(d.status) : status !== "all" && d.status !== status) return false;
        const s = q.trim().toLowerCase();
        return !s || [d.pickupAddress, d.vehicle, d.callerName, d.chiefComplaint].some((x) => (x || "").toLowerCase().includes(s));
      }),
    [emergency.dispatches, q, status],
  );

  return (
    <Page>
      <Header icon={<Ambulance size={22} />} title="Ambulance & Dispatch" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/ambulance/new`}><Plus size={16} /> Log call</Btn>} />
      <SectionCard title="Calls" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search address, vehicle, caller…" />
        <Pills value={status} onChange={setStatus} options={[{ value: "open", label: "Open" }, { value: "all", label: "All" }, ...ER.dispatchStatuses.map((s) => ({ value: s, label: erLabel(s) }))]} />
        {emergency.listLoading && !emergency.dispatches.length ? <Loader text="Loading calls…" /> : rows.length === 0 ? <Empty>No calls match. Log a call when the phone rings.</Empty> : (
          <div className="space-y-3">
            {rows.map((d) => (
              <RowLink key={d._id} href={`${BASE}/ambulance/${d._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{d.pickupAddress}</p>
                    <p className="truncate text-xs opacity-55">{d.chiefComplaint || "No details recorded"}</p>
                  </div>
                  <p className="text-xs opacity-65">{d.vehicle || "No vehicle"}{d.crew?.length ? <><br />{d.crew.join(", ")}</> : null}</p>
                  <p className="text-xs opacity-60">Called {new Date(d.callReceivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<br />{ER.openDispatch.includes(d.status) ? `${fmtMins(minsSince(d.callReceivedAt))} ago` : erLabel(d.status)}</p>
                  <div className="flex gap-2"><ErPill value={d.priority} /><ErPill value={d.status} /></div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
