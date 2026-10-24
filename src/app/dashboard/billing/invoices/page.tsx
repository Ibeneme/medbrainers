"use client";

import { useEffect } from "react";
import { Receipt } from "lucide-react";
import { useAppDispatch } from "@/api/hooks";
import { fetchMyFacilities } from "@/api/slices";
import {
  ModuleShell,
  EmptyState,
  ActionLink,
} from "@/components/dashboard/ModuleShell";

export default function Page() {
  const dispatch = useAppDispatch();
  useEffect(() => { dispatch(fetchMyFacilities()); }, [dispatch]);
  return (
    <ModuleShell
      title="Invoices"
      subtitle="Module connected — extend with your AI / billing APIs"
      icon={Receipt}
      actions={<ActionLink href="/dashboard/dashboard">Dashboard</ActionLink>}
    >
      <EmptyState text="This area is scaffolded and ready for your invoices integration. Clinical modules (consults, labs, pharmacy, theater, discharge) are fully wired." />
    </ModuleShell>
  );
}
