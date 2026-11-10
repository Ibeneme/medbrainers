"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Printer } from "lucide-react";
import { fetchComplications, fetchSterilization, fetchSurgeryRequests, fetchTheaterSchedule, fetchTheatreRooms } from "@/api/slices/theaterSlice";
import { PRIMARY_COLOR } from "@/constants/colors";
import { Btn, Card, DataTable, Header, Loader, Page, Pills, Stat, dur, fmtDuration, idOf, label, useTH } from "@/components/theater/th-ui";

function Bars({ data }: { data: Record<string, number> }) {
  const e = Object.entries(data);
  const max = Math.max(1, ...e.map(([, n]) => n));
  if (!e.length) return <p className="text-sm opacity-55">No data for this period.</p>;
  return (
    <div className="space-y-2.5">
      {e.map(([k, n]) => (
        <div key={k} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate opacity-75">{label(k)}</span>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(128,128,128,0.15)" }}><div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, backgroundColor: PRIMARY_COLOR }} /></div>
          <span className="font-semibold">{n}</span>
        </div>
      ))}
    </div>
  );
}

export default function TheatreReportsPage() {
  const { facilityId, act, theater, activeFacility } = useTH();
  const [range, setRange] = useState("30");

  useEffect(() => {
    if (!facilityId) return;
    act(fetchTheaterSchedule({ facilityId }), false);
    act(fetchTheatreRooms({ facilityId }), false);
    act(fetchSurgeryRequests({ facilityId }), false);
    act(fetchComplications({ facilityId }), false);
    act(fetchSterilization({ facilityId }), false);
  }, [facilityId, act]);

  const r = useMemo(() => {
    const since = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
    const cases = theater.schedule.filter((c) => +new Date(c.scheduledStart) >= since);
    const done = cases.filter((c) => c.status === "completed" || c.actualEnd);
    const opMins = cases.map((c) => dur(c.actualStart, c.actualEnd)).filter((x): x is number => x !== undefined);
    const lateStarts = cases.filter((c) => c.actualStart).map((c) => Math.round((+new Date(c.actualStart!) - +new Date(c.scheduledStart)) / 60000));
    const onTime = lateStarts.filter((m) => m <= 15).length;
    const byStatus: Record<string, number> = {}; cases.forEach((c) => (byStatus[c.status] = (byStatus[c.status] || 0) + 1));
    const roomMins: Record<string, { cases: number; mins: number }> = {};
    cases.forEach((c) => { const id = idOf(c.room); const row = (roomMins[id] ||= { cases: 0, mins: 0 }); row.cases++; row.mins += dur(c.actualStart, c.actualEnd) || 0; });
    const reqs = theater.requests.filter((q) => +new Date(q.requestedAt || 0) >= since);
    const reqByPriority: Record<string, number> = {}; reqs.forEach((q) => (reqByPriority[q.priority] = (reqByPriority[q.priority] || 0) + 1));
    const comps = theater.complications.filter((c) => +new Date(c.occurredAt) >= since);
    const compBySev: Record<string, number> = {}; comps.forEach((c) => (compBySev[c.severity || "unrated"] = (compBySev[c.severity || "unrated"] || 0) + 1));
    const cy = theater.cssd.filter((c) => +new Date(c.startedAt) >= since);
    const fin = cy.filter((c) => c.result);
    return {
      cases, done: done.length, cancelled: cases.filter((c) => c.status === "cancelled").length,
      avgMins: opMins.length ? Math.round(opMins.reduce((a, b) => a + b, 0) / opMins.length) : undefined,
      onTimePct: lateStarts.length ? Math.round((onTime / lateStarts.length) * 100) : undefined,
      avgDelay: lateStarts.length ? Math.round(lateStarts.reduce((a, b) => a + b, 0) / lateStarts.length) : undefined,
      byStatus, roomMins, reqs: reqs.length, reqByPriority, converted: reqs.filter((q) => q.status !== "requested" && q.status !== "cancelled").length,
      comps: comps.length, compBySev, cycles: cy.length, passPct: fin.length ? Math.round((fin.filter((c) => c.result === "pass").length / fin.length) * 100) : undefined,
    };
  }, [theater.schedule, theater.requests, theater.complications, theater.cssd, range]);

  return (
    <Page>
      <Header icon={<BarChart3 size={22} />} title="Surgical Reports" subtitle={activeFacility?.name} actions={<Btn tone="card" onClick={() => window.print()}><Printer size={15} /> Print</Btn>} />
      <Pills value={range} onChange={setRange} onCard={false} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "12 months" }, { value: "all", label: "All time" }]} />
      {theater.listLoading && !theater.schedule.length ? <Loader text="Building report…" /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Cases" value={r.cases.length} sub={`${r.done} completed · ${r.cancelled} cancelled`} />
            <Stat label="Average operating time" value={r.avgMins !== undefined ? fmtDuration(r.avgMins) : "—"} sub="start to finish" />
            <Stat label="On-time starts" value={r.onTimePct !== undefined ? `${r.onTimePct}%` : "—"} sub={r.avgDelay !== undefined ? `avg ${r.avgDelay} min vs plan` : "within 15 minutes"} tone={r.onTimePct !== undefined && r.onTimePct < 60 ? "warn" : undefined} />
            <Stat label="Cancellation rate" value={r.cases.length ? `${Math.round((r.cancelled / r.cases.length) * 100)}%` : "—"} sub="of booked cases" />
            <Stat label="Requests" value={r.reqs} sub={`${r.converted} scheduled or done`} />
            <Stat label="Complications" value={r.comps} sub={r.done ? `${((r.comps / r.done) * 100).toFixed(1)}% of completed cases` : "no completed cases"} tone={r.comps ? "warn" : undefined} />
            <Stat label="Sterilization cycles" value={r.cycles} sub={r.passPct !== undefined ? `${r.passPct}% passed` : "no results yet"} />
            <Stat label="Rooms" value={theater.rooms.length} sub="active theatres" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Cases by status</h2><Bars data={r.byStatus} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Requests by priority</h2><Bars data={r.reqByPriority} /></Card>
            <Card className="space-y-4"><h2 className="text-sm font-semibold">Complications by severity</h2><Bars data={r.compBySev} /></Card>
          </div>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Room utilisation</h2>
            <DataTable head={["Room", "Cases", "Operating time", "Avg per case"]} empty="No cases in this period." rows={theater.rooms.map((rm) => { const x = r.roomMins[rm._id]; return [`${rm.code} · ${rm.name}`, x?.cases || 0, fmtDuration(x?.mins || 0), x?.cases ? fmtDuration(Math.round(x.mins / x.cases)) : "—"]; })} />
          </Card>
        </>
      )}
    </Page>
  );
}
