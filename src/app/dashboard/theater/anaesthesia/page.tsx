"use client";

import { Syringe } from "lucide-react";
import { Pill, RecordIndex, fmtDateTime, nameOf, patientLabel } from "@/components/theater/th-ui";

export default function AnaesthesiaReviewPage() {
  return (
    <RecordIndex icon={<Syringe size={22} />} title="Anaesthesia Review" subtitle="Pre-operative anaesthetic review" kind="pre-op" stages={["scheduled", "pre-op"]} stageTitle="Cases waiting for anaesthetic review"
      newPath="/anaesthesia/new" actionLabel="Review" headerLabel="New review" recordTitle="Reviews on file"
      recordFilter={(r) => String(r.notes || "").startsWith("Anaesthetic review")}
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p><p className="truncate text-xs opacity-55">{r.theatreCase?.procedureName}</p></div>
          <p className="text-xs opacity-60">{r.asaGrade ? `ASA ${r.asaGrade}` : "ASA —"}<br />{fmtDateTime(r.assessedAt)} · {nameOf(r.assessedBy)}</p>
          <Pill value={r.fitnessForSurgery} />
        </div>
      )} />
  );
}
