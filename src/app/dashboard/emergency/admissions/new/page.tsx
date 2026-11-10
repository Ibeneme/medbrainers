"use client";
import { BASE } from "@/components/emergency/er-ui";
import { DispositionForm } from "@/components/emergency/disposition-ui";

export default function NewErAdmissionPage() {
  return <DispositionForm types={["admit"]} title="Admit to ward" subtitle="Hand the patient to the wards" listHref={`${BASE}/admissions`} cta="Send admission request" />;
}
