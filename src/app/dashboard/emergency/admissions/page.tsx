"use client";
import { BedDouble } from "lucide-react";
import { DispositionList } from "@/components/emergency/disposition-ui";

export default function ErAdmissionsPage() {
  return <DispositionList title="ER Admissions" icon={<BedDouble size={22} />} types={["admit"]} newHref="/admissions/new" newLabel="Admit patient" empty="No ER admissions yet. Each one creates an emergency request in the Wards queue." />;
}
