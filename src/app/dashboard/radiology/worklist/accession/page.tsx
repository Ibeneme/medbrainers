"use client";

import { Hash } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

export default function AccessionPage() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { requests, listLoading, hasFacility } = useRadiology({ autoRequests: true });
  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      {listLoading && <DarkBlurOverlayLoader />}
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><Hash size={20} /></span>
        <div><h1 className="text-xl font-semibold">Automated Accession Generation</h1><p className="text-xs opacity-60">Accession numbers assigned on order create</p></div>
      </header>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: ui.border, backgroundColor: ui.card }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs opacity-60 border-b" style={{ borderColor: ui.border }}>
              <th className="p-3">Accession</th><th className="p-3">Modality</th><th className="p-3">Procedure</th><th className="p-3">Status</th><th className="p-3">Requested</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id} className="border-b last:border-0" style={{ borderColor: ui.border }}>
                <td className="p-3 font-mono text-xs">{r.accessionNumber}</td>
                <td className="p-3 uppercase text-xs">{r.modality}</td>
                <td className="p-3">{r.procedureName}</td>
                <td className="p-3 text-xs capitalize">{r.status?.replace(/_/g, " ")}</td>
                <td className="p-3 text-xs opacity-60">{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
