"use client";

import { HardDrive } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";

export default function Page() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { requests, hasFacility } = useRadiology({ autoRequests: true });
  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;
  const list = requests.filter((r) => ["completed", "reported", "in_acquisition"].includes(r.status));
  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><HardDrive size={20} /></span>
        <div><h1 className="text-xl font-semibold">Backblaze B2 Streaming Storage</h1><p className="text-xs opacity-60">Secure byte-range streaming of study instances</p></div>
      </header>
      <p className="text-sm opacity-70">Wire OHIF/Cornerstone viewport here. Study URLs come from the radiology viewer API (Backblaze B2 byte-range streaming).</p>
      <div className="space-y-2">{list.map((item) => (<RequestRow key={item._id} item={item} ui={ui} href={`/dashboard/radiology/viewer/ohif?requestId=${item._id}`} />))}</div>
    </div>
  );
}
