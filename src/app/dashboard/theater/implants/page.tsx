"use client";

import { Boxes } from "lucide-react";
import { RecordIndex, fmtDateTime, patientLabel } from "@/components/theater/th-ui";

export default function ImplantsPage() {
  return (
    <RecordIndex icon={<Boxes size={22} />} title="Implants & Consumables" subtitle="Traceability for everything left in the patient" kind="implants" stages={["in-theatre", "recovery", "completed"]} stageTitle="Cases that can record implants"
      newPath="/implants/new" actionLabel="Add implant" headerLabel="New implant" recordTitle="Implants on file"
      renderRecord={(r) => (
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{r.implantName} <span className="opacity-50">×{r.quantity}</span></p><p className="truncate text-xs opacity-55">{r.manufacturer || "Manufacturer —"}</p></div>
          <p className="font-mono text-xs opacity-60">Lot {r.lotNumber || "—"} · S/N {r.serialNumber || "—"}</p>
          <p className="text-xs opacity-60">{patientLabel(r.patient)}<br />{fmtDateTime(r.createdAt)}</p>
        </div>
      )} />
  );
}
