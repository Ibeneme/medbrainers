"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";

export default function DictationPage() {
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors, colors?.border);
  const { requests, saveReport, saving, hasFacility } = useRadiology({ autoRequests: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");

  const ready = requests.filter((r) => ["completed", "reported"].includes(r.status));

  async function save() {
    if (!selected) return;
    await saveReport(selected, {
      dictationRawText: text,
      dictationSource: "voice",
      findings: text,
      status: "draft",
    });
  }

  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}><Mic size={20} /></span>
        <div><h1 className="text-xl font-semibold">Voice-to-Text Dictation</h1><p className="text-xs opacity-60">Paste or stream dictation into the report</p></div>
      </header>
      <div className="space-y-2">
        {ready.map((item) => (
          <div key={item._id} className="space-y-2">
            <div onClick={() => setSelected(item._id)} className="cursor-pointer"><RequestRow item={item} ui={ui} href="#" /></div>
            {selected === item._id && (
              <div className="rounded-2xl border p-4 space-y-3 ml-2" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Dictation transcript…" className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent" style={{ borderColor: ui.border }} />
                <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                  {saving && <Loader2 size={14} className="animate-spin" />} Save dictation as draft
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
