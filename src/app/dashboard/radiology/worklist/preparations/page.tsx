"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

import { Can } from "@/components/access/can";
export default function PreparationLogsPage() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { worklist, worklistLoading, markPrepared, saving, hasFacility, loadWorklist } =
    useRadiology({ autoWorklist: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");

  async function submit() {
    if (!selected) return;
    await markPrepared(selected, instructions || undefined);
    setSelected(null);
    loadWorklist();
  }

  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      {worklistLoading && <DarkBlurOverlayLoader />}
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><ClipboardCheck size={20} /></span>
        <div><h1 className="text-xl font-semibold">Preparation Instruction Logs</h1><p className="text-xs opacity-60">Fasting and other prep confirmations</p></div>
      </header>
      <div className="space-y-2">
        {worklist.map((item) => (
          <div key={item._id} className="space-y-2">
            <RequestRow item={item} ui={ui} href="#" />
            {item.preparationInstructions && <p className="text-[11px] opacity-50 pl-3">Prep: {item.preparationInstructions}</p>}
            {item.preparationLoggedAt && <p className="text-[11px] opacity-50 pl-3">Logged: {new Date(item.preparationLoggedAt).toLocaleString()}</p>}
            <Can perm="radiology.write"><button type="button" onClick={() => { setSelected(item._id); setInstructions(item.preparationInstructions || ""); }} className="ml-2 rounded-lg border px-2 py-1 text-[11px]" style={{ borderColor: ui.border }}>Log / update prep</button></Can>
            {selected === item._id && (
              <div className="rounded-2xl border p-4 space-y-3 ml-2" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent" style={{ borderColor: ui.border }} placeholder="e.g. Fasting 6h confirmed" />
                <Can perm="radiology.write"><button type="button" disabled={saving} onClick={submit} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                  {saving && <Loader2 size={14} className="animate-spin" />} Save
                </button></Can>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
