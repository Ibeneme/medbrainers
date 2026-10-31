"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Search } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

export default function XRayOrdersPage() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);
  const [search, setSearch] = useState("");

  const { requests, listLoading, loadRequests, hasFacility } = useRadiology({
    autoRequests: true,
    modality: "xray",
  });

  const filtered = useMemo(() => {
    const list = requests.filter((r) => r.modality === "xray");
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.procedureName?.toLowerCase().includes(q) ||
        r.accessionNumber?.toLowerCase().includes(q) ||
        r.clinicalIndication?.toLowerCase().includes(q),
    );
  }, [requests, search]);

  if (!hasFacility) return <div className="p-6 text-sm opacity-70">Select a facility first.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
      {listLoading && <DarkBlurOverlayLoader />}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">X-Ray Orders</h1>
          <p className="text-xs opacity-60">Modality-specific request list</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => loadRequests({ modality: "xray" })} className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: ui.border, backgroundColor: ui.card }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link href="/dashboard/radiology/create" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Plus size={14} /> New X-Ray order
          </Link>
        </div>
      </header>
      <div className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
        <Search size={16} className="opacity-40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="flex-1 bg-transparent text-sm outline-none" />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && !listLoading && (
          <div className="rounded-2xl border p-8 text-center text-sm opacity-60" style={{ borderColor: ui.border, backgroundColor: ui.card }}>
            No X-Ray orders yet.
          </div>
        )}
        {filtered.map((item) => (
          <RequestRow key={item._id} item={item} ui={ui} />
        ))}
      </div>
    </div>
  );
}
