"use client";

import { ClipboardCheck } from "lucide-react";
import { RecordIndex, fmtDateTime, nameOf, patientLabel } from "@/components/theater/th-ui";

export default function OperationNotesPage() {
  return (
    <RecordIndex icon={<ClipboardCheck size={22} />} title="Operation Notes" kind="operation-notes" stages={["in-theatre", "recovery", "completed"]} stageTitle="Cases needing an operation note"
      newPath="/operation-notes/new" actionLabel="Write note" headerLabel="New operation note" recordTitle="Operation notes on file"
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p><p className="truncate text-xs opacity-55">{r.procedurePerformed}</p></div>
          <p className="truncate text-xs opacity-60">{r.findings || "No findings recorded"}</p>
          <p className="text-xs opacity-60">{fmtDateTime(r.recordedAt)}<br />{nameOf(r.surgeon)}</p>
        </div>
      )} />
  );
}
