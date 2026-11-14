"use client";

import { useState } from "react";
import { UserCog, Loader2 } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

import { Can } from "@/components/access/can";
export default function TechAllocationPage() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { worklist, worklistLoading, rooms, assign, saving, hasFacility, loadWorklist } =
    useRadiology({ autoWorklist: true, autoRooms: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [techId, setTechId] = useState("");
  const [roomId, setRoomId] = useState("");

  async function submit() {
    if (!selected) return;
    await assign(selected, { technologistId: techId || undefined, roomId: roomId || undefined });
    setSelected(null);
    loadWorklist();
  }

  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      {worklistLoading && <DarkBlurOverlayLoader />}
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><UserCog size={20} /></span>
        <div><h1 className="text-xl font-semibold">Technologist Task Allocation</h1><p className="text-xs opacity-60">Assign tech & room</p></div>
      </header>
      <div className="space-y-2">
        {worklist.map((item) => (
          <div key={item._id} className="space-y-2">
            <div onClick={() => setSelected(item._id)} className="cursor-pointer"><RequestRow item={item} ui={ui} href="#" /></div>
            {selected === item._id && (
              <div className="rounded-2xl border p-4 space-y-3 ml-2" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                <input placeholder="Technologist user ID" value={techId} onChange={(e) => setTechId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent" style={{ borderColor: ui.border }} />
                <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent" style={{ borderColor: ui.border }}>
                  <option value="">Select room</option>
                  {rooms.map((r) => (<option key={r._id} value={r._id}>{r.name} ({r.modality})</option>))}
                </select>
                <Can perm="radiology.write"><button type="button" disabled={saving} onClick={submit} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                  {saving && <Loader2 size={14} className="animate-spin" />} Assign
                </button></Can>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
