"use client";

import { Activity } from "lucide-react";
import { RecordIndex, fmtDateTime, nameOf, patientLabel } from "@/components/theater/th-ui";

export default function AnaesthesiaRecordPage() {
  return (
    <RecordIndex icon={<Activity size={22} />} title="Anaesthesia Record" subtitle="Intra-operative anaesthetic chart" kind="anaesthesia" stages={["pre-op", "in-theatre", "recovery"]} stageTitle="Cases needing an anaesthesia record"
      newPath="/anaesthesia-record/new" actionLabel="Record" headerLabel="New anaesthesia record" recordTitle="Records on file"
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p><p className="truncate text-xs opacity-55">{r.agents || "Agents not recorded"}</p></div>
          <p className="text-xs opacity-60">{fmtDateTime(r.startTime || r.createdAt)}<br />{nameOf(r.anaesthetist)}</p>
          <span className="text-xs font-semibold">{r.anaesthesiaType}</span>
        </div>
      )} />
  );
}
