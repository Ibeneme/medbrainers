"use client";

import { ShieldCheck } from "lucide-react";
import { Pill, RecordIndex, TBASE, fmtDateTime } from "@/components/theater/th-ui";

export default function ChecklistIndexPage() {
  return (
    <RecordIndex icon={<ShieldCheck size={22} />} title="Surgical Safety Checklist" subtitle="WHO sign-in · time-out · sign-out" kind="checklists" stages={["pre-op", "in-theatre", "recovery"]} stageTitle="Active cases"
      newPath="/checklist" actionLabel="Open checklist" rowHref={(c) => `${TBASE}/checklist/${c._id}`} recordTitle="Checklists on file"
      renderRecord={(r) => (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">{r.theatreCase?.procedureName || "Case"}</p>
          <div className="flex flex-wrap gap-2"><Pill tone={r.signInCompleted ? "ok" : "warn"}>Sign-in</Pill><Pill tone={r.timeOutCompleted ? "ok" : "warn"}>Time-out</Pill><Pill tone={r.signOutCompleted ? "ok" : "warn"}>Sign-out</Pill><span className="text-xs opacity-55">{fmtDateTime(r.updatedAt)}</span></div>
        </div>
      )}
      recordHref={(r) => `${TBASE}/checklist/${typeof r.theatreCase === "object" ? r.theatreCase._id : r.theatreCase}`} />
  );
}
