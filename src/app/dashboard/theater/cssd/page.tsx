"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Plus } from "lucide-react";
import { fetchSterilization } from "@/api/slices/theaterSlice";
import { Btn, Empty, Header, Loader, Page, Pill, Pills, RowLink, SectionCard, Stat, TBASE, dur, fmtDateTime, fmtDuration, useTH } from "@/components/theater/th-ui";

export default function CssdPage() {
  const { facilityId, act, theater, activeFacility } = useTH();
  const [f, setF] = useState("all");
  useEffect(() => { if (facilityId) act(fetchSterilization({ facilityId }), false); }, [facilityId, act]);
  const all = theater.cssd;
  const running = all.filter((c) => !c.result);
  const passed = all.filter((c) => c.result === "pass");
  const failed = all.filter((c) => c.result === "fail");
  const rows = f === "all" ? all : f === "running" ? running : f === "pass" ? passed : failed;

  return (
    <Page>
      <Header icon={<FlaskConical size={22} />} title="Sterilization (CSSD)" subtitle={activeFacility?.name} actions={<Btn href={`${TBASE}/cssd/new`}><Plus size={16} /> Start cycle</Btn>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Running now" value={running.length} sub="awaiting a result" tone={running.length ? "warn" : undefined} />
        <Stat label="Passed" value={passed.length} sub="safe to release" />
        <Stat label="Failed" value={failed.length} sub="must be reprocessed" tone={failed.length ? "bad" : undefined} />
        <Stat label="Pass rate" value={passed.length + failed.length ? `${Math.round((passed.length / (passed.length + failed.length)) * 100)}%` : "—"} sub="of finished cycles" />
      </div>
      <>
        <Pills value={f} onChange={setF} options={[{ value: "all", label: "All" }, { value: "running", label: "Running" }, { value: "pass", label: "Passed" }, { value: "fail", label: "Failed" }]} />
        {theater.listLoading && all.length === 0 ? <Loader /> : rows.length === 0 ? <Empty>No sterilization cycles.</Empty> : (
          <div className="space-y-3">
            {rows.map((c) => (
              <RowLink key={c._id} href={c.result ? `${TBASE}/cssd` : `${TBASE}/cssd/${c._id}/complete`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                  <div><p className="font-mono text-sm font-semibold">{c.cycleNo}</p><p className="text-xs opacity-55">{c.method}</p></div>
                  <p className="truncate text-xs opacity-65">{c.loadDescription || "No load description"}</p>
                  <p className="text-xs opacity-60">Started {fmtDateTime(c.startedAt)}{c.completedAt ? <><br />Took {fmtDuration(dur(c.startedAt, c.completedAt))}</> : null}</p>
                  {c.result ? <Pill value={c.result} /> : <Pill tone="info">Running · record result</Pill>}
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
