"use client";

import { ClipboardList } from "lucide-react";
import { RecordIndex, fmtDateTime, nameOf, patientLabel } from "@/components/theater/th-ui";

export default function PostOpPage() {
  return (
    <RecordIndex icon={<ClipboardList size={22} />} title="Post-op Orders" subtitle="Instructions for the ward after surgery" kind="operation-notes" stages={["recovery", "completed", "in-theatre"]} stageTitle="Cases needing post-op orders"
      newPath="/post-op/new" actionLabel="Write orders" headerLabel="New post-op orders" recordTitle="Post-op orders on file"
      recordFilter={(r) => !!r.postoperativeOrders}
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p><p className="truncate text-xs opacity-55">{r.procedurePerformed}</p></div>
          <p className="line-clamp-2 text-xs opacity-70">{r.postoperativeOrders}</p>
          <p className="text-xs opacity-60">{fmtDateTime(r.recordedAt)}<br />{nameOf(r.surgeon)}</p>
        </div>
      )} />
  );
}
