"use client";

import { Layers } from "lucide-react";
import { Pill, RecordIndex, fmtDateTime, label, nameOf } from "@/components/theater/th-ui";

export default function CountsPage() {
  return (
    <RecordIndex icon={<Layers size={22} />} title="Instrument & Swab Count" subtitle="Nothing left behind" kind="counts" stages={["in-theatre", "recovery"]} stageTitle="Cases in theatre"
      newPath="/counts/new" actionLabel="Record count" headerLabel="New count" recordTitle="Counts on file"
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{r.itemName}</p><p className="text-xs opacity-55">{label(r.itemType)}</p></div>
          <p className="text-xs opacity-60">Initial {r.countInitial ?? "—"} → final {r.countFinal ?? "—"}<br />{fmtDateTime(r.createdAt)} · {nameOf(r.recordedBy)}</p>
          <Pill tone={r.correct ? "ok" : "bad"}>{r.correct ? "Correct" : "Discrepancy"}</Pill>
        </div>
      )} />
  );
}
