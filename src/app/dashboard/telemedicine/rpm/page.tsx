"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { ModuleShell, ActionLink } from "@/components/dashboard/ModuleShell";

/** Remote monitoring is not part of the telemedicine API. Kept so the old URL does not 404. */
export default function RpmPlaceholderPage() {
  return (
    <ModuleShell title="Remote monitoring" subtitle="Not on the telemedicine service" icon={Activity} actions={<ActionLink href="/dashboard/telemedicine">Virtual consultations</ActionLink>}>
      <div className="rounded-[28px] border p-6 text-sm opacity-70">
        Wearable streams and threshold alerts are not exposed by the telemedicine module.
        Video visits, the waiting room, chat and session notes live under{" "}
        <Link href="/dashboard/telemedicine" className="font-semibold underline">Virtual Consultations</Link>.
      </div>
    </ModuleShell>
  );
}
