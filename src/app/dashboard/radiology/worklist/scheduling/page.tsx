"use client";

import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

import { Can } from "@/components/access/can";
export default function SchedulingArrivalPage() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { worklist, worklistLoading, assign, markArrived, saving, hasFacility, loadWorklist } =
    useRadiology({ autoWorklist: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [when, setWhen] = useState("");

  async function schedule() {
    if (!selected || !when) return;
    await assign(selected, { scheduledAt: new Date(when).toISOString() });
    setSelected(null);
    loadWorklist();
  }

  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      {worklistLoading && <DarkBlurOverlayLoader />}
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><CalendarClock size={20} /></span>
        <div><h1 className="text-xl font-semibold">Patient Appointment & Arrival</h1><p className="text-xs opacity-60">Schedule and log arrival</p></div>
      </header>
      <div className="space-y-2">
        {worklist.map((item) => (
          <div key={item._id} className="space-y-2">
            <RequestRow item={item} ui={ui} href="#" />
            <div className="flex flex-wrap gap-2 pl-2">
              <Can perm="radiology.write"><button type="button" onClick={() => setSelected(item._id)} className="rounded-lg border px-2 py-1 text-[11px]" style={{ borderColor: ui.border }}>Schedule</button></Can>
              <button type="button" disabled={saving} onClick={async () => { await markArrived(item._id); loadWorklist(); }} className="rounded-lg border px-2 py-1 text-[11px]" style={{ borderColor: ui.border }}>Mark arrived</button>
              {item.scheduledAt && <span className="text-[11px] opacity-50">Scheduled: {new Date(item.scheduledAt).toLocaleString()}</span>}
              {item.arrivedAt && <span className="text-[11px] opacity-50">Arrived: {new Date(item.arrivedAt).toLocaleString()}</span>}
            </div>
            {selected === item._id && (
              <div className="rounded-2xl border p-4 space-y-3 ml-2" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent" style={{ borderColor: ui.border }} />
                <Can perm="radiology.write"><button type="button" disabled={saving} onClick={schedule} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                  {saving && <Loader2 size={14} className="animate-spin" />} Save schedule
                </button></Can>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
