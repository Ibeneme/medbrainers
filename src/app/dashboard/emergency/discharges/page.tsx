"use client";
import { LogOut } from "lucide-react";
import { DispositionList } from "@/components/emergency/disposition-ui";

export default function ErDischargesPage() {
  return <DispositionList title="ER Discharges" icon={<LogOut size={22} />} types={["discharge", "left-against-advice", "deceased"]} newHref="/discharges/new" newLabel="Discharge patient" empty="Nobody has left the department yet." />;
}
