"use client";

import { FileSignature } from "lucide-react";
import { Pill, RecordIndex, fmtDateTime, nameOf, patientLabel } from "@/components/theater/th-ui";

export default function ConsentPage() {
  return (
    <RecordIndex icon={<FileSignature size={22} />} title="Consent Forms" kind="consent" stages={["scheduled", "pre-op"]} stageTitle="Cases waiting for consent"
      newPath="/consent/new" actionLabel="Take consent" headerLabel="New consent form" recordTitle="Consent on file"
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p><p className="truncate text-xs opacity-55">{r.procedureDescription}</p></div>
          <p className="text-xs opacity-60">{fmtDateTime(r.consentDate)}<br />Taken by {nameOf(r.obtainedBy)}{r.witness ? ` · witness ${r.witness}` : ""}</p>
          <Pill tone={r.consentGiven ? "ok" : "bad"}>{r.consentGiven ? "Given" : "Declined"}</Pill>
        </div>
      )} />
  );
}
