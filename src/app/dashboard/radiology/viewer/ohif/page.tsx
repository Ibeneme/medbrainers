"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MonitorPlay } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

export default function OhifViewerPage() {
  const params = useSearchParams();
  const requestId = params.get("requestId") || "";
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { viewer, detailLoading, loadViewer, hasFacility } = useRadiology();
  const [id, setId] = useState(requestId);

  useEffect(() => {
    if (requestId) loadViewer(requestId);
  }, [requestId, loadViewer]);

  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      {detailLoading && <DarkBlurOverlayLoader />}
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><MonitorPlay size={20} /></span>
        <div><h1 className="text-xl font-semibold">OHIF / Cornerstone Web Viewer</h1><p className="text-xs opacity-60">Zero-footprint viewer payload</p></div>
      </header>
      <div className="flex gap-2 max-w-lg">
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Request ID" className="flex-1 rounded-xl border px-3 py-2 text-sm bg-transparent" style={{ borderColor: ui.border }} />
        <button type="button" onClick={() => loadViewer(id)} className="rounded-xl px-4 py-2 text-sm text-white" style={{ backgroundColor: PRIMARY_COLOR }}>Load</button>
      </div>
      {viewer && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
          <p className="text-sm font-medium">{viewer.request?.procedureName} · {viewer.request?.accessionNumber}</p>
          <p className="text-xs opacity-60">{viewer.streamingHint}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(viewer.study?.instances || []).map((inst, i) => (
              <a key={i} href={inst.url} target="_blank" rel="noreferrer" className="rounded-xl border p-3 text-xs space-y-1 hover:opacity-90" style={{ borderColor: ui.border, backgroundColor: ui.inner }}>
                <p className="font-medium truncate">{inst.fileName}</p>
                <p className="opacity-50">{inst.mimeType} · {(inst.size / 1024).toFixed(1)} KB</p>
                <p className="opacity-40 truncate">{inst.url}</p>
              </a>
            ))}
          </div>
          {!viewer.study?.instances?.length && <p className="text-sm opacity-60">No instances uploaded yet. Use B2 upload first.</p>}
        </div>
      )}
    </div>
  );
}
