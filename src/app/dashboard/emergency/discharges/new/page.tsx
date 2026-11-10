"use client";
import { BASE } from "@/components/emergency/er-ui";
import { DispositionForm } from "@/components/emergency/disposition-ui";

export default function NewErDischargePage() {
  return <DispositionForm types={["discharge", "left-against-advice", "deceased"]} title="Discharge patient" subtitle="Discharge, left against advice, or death" listHref={`${BASE}/discharges`} cta="Record outcome" />;
}
