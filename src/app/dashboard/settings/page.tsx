import { Suspense } from "react";
import SettingsPage from "@/components/dashboard/settings-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm opacity-60">Loading settings…</div>}>
      <SettingsPage />
    </Suspense>
  );
}
