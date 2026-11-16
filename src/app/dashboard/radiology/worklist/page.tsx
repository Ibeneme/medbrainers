"use client";

import { useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { Columns3, RefreshCw, Search } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomDropdown } from "@/components/ui/items";

const QUEUE_ORDER = [
  "scheduled",
  "arrived",
  "queued",
  "in_acquisition",
  "completed",
];

const LINKS = [
  {
    href: "/dashboard/radiology/worklist/status-queues",
    label: "Status queues",
  },
  { href: "/dashboard/radiology/worklist/tasks", label: "Tech allocation" },
  {
    href: "/dashboard/radiology/worklist/scheduling",
    label: "Scheduling & arrival",
  },
  {
    href: "/dashboard/radiology/worklist/preparations",
    label: "Preparation logs",
  },
  {
    href: "/dashboard/radiology/worklist/accession",
    label: "Accession numbers",
  },
];

const STATUS_OPTIONS = [
  { label: "All queues / statuses", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Arrived", value: "arrived" },
  { label: "Queued", value: "queued" },
  { label: "In Acquisition", value: "in_acquisition" },
  { label: "Completed", value: "completed" },
];

export default function WorklistHomePage() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const [search, setSearch] = useState("");
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<string>("all");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const {
    worklist,
    worklistQueues,
    worklistLoading,
    loadWorklist,
    hasFacility,
    updateStatus,
    loadWorklist: refreshWorklist,
  } = useRadiology({
    autoWorklist: true,
  });

  // Filter queues based on search and selected filter dropdown
  const filteredQueues = useMemo(() => {
    if (!worklistQueues) return {};
    const filtered: Record<string, any[]> = {};
    const q = search.toLowerCase().trim();

    QUEUE_ORDER.forEach((key) => {
      if (selectedQueueFilter !== "all" && selectedQueueFilter !== key) {
        filtered[key] = [];
        return;
      }

      const items = worklistQueues[key] || [];
      filtered[key] = items.filter((item: any) => {
        if (!q) return true;
        const patientName = `${item.patient?.firstName || ""} ${
          item.patient?.lastName || ""
        }`.toLowerCase();
        const accessionNumber = (item.accessionNumber || "").toLowerCase();
        const procedureName = (
          item.procedure?.name ||
          item.examName ||
          ""
        ).toLowerCase();

        return (
          patientName.includes(q) ||
          accessionNumber.includes(q) ||
          procedureName.includes(q)
        );
      });
    });

    return filtered;
  }, [worklistQueues, search, selectedQueueFilter]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const allItems = Object.values(worklistQueues).flat() as any[];
    const item = allItems.find(
      (r) => r._id === draggedItemId || r.id === draggedItemId
    );

    if (item && item.status !== targetStatus) {
      if (updateStatus) {
        await updateStatus(draggedItemId, targetStatus as any);
        if (refreshWorklist) refreshWorklist();
      }
    }
    setDraggedItemId(null);
  };

  if (!hasFacility)
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );

  return (
    <div className="mx-auto max-w-7xl w-full">
      {worklistLoading && (
        <DarkBlurOverlayLoader text="Loading worklist queues..." />
      )}

      <div
        className="space-y-6 w-full min-h-screen p-4 sm:p-6"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 opacity-70 overflow-hidden text-ellipsis whitespace-nowrap">
            <Link href="/dashboard/radiology" className="hover:opacity-100">
              Radiology & PACS
            </Link>
            <span className="opacity-40">/</span>
            <span className="font-semibold">Imaging Worklist</span>
          </div>

          <button
            type="button"
            onClick={() => loadWorklist()}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-90 border shrink-0"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Header & Quick Action Banner */}
        <div
          className="rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <span
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <Columns3 size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                Imaging Worklist
              </h1>
              <p className="text-xs opacity-60 mt-0.5 leading-relaxed">
                {worklist.length} active studies across live status queues (Drag
                & Drop enabled)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
            <div className="text-left md:text-right">
              <p className="text-xs font-bold">
                {worklist.length} Active Studies
              </p>
              <p className="text-[10px] opacity-50">
                Real-time status tracking
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Feature Links / Pills */}
        <div className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border px-4 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{ borderColor: ui.border, backgroundColor: ui.card }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Search Bar & Custom Status Filter Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div
            className="md:col-span-8 rounded-[20px] sm:rounded-[22px] px-4 py-3 flex items-center gap-3 border"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <Search size={16} className="opacity-40 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search worklist studies by patient name, accession number, or procedure..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: ui.text }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="opacity-40 hover:opacity-100 text-xs shrink-0"
              >
                Clear
              </button>
            )}
          </div>
          <div className="md:col-span-4">
            <CustomDropdown
              value={selectedQueueFilter}
              options={STATUS_OPTIONS}
              onChange={setSelectedQueueFilter}
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
          </div>
        </div>

        {/* Kanban Board Columns - Forced Horizontal Overflow Container */}
        <div className="w-full overflow-x-auto pb-6 pt-2">
          <div className="flex gap-6 w-max">
            {QUEUE_ORDER.map((key) => {
              if (
                selectedQueueFilter !== "all" &&
                selectedQueueFilter !== key
              ) {
                return null;
              }
              const items = filteredQueues[key] || [];
              return (
                <div
                  key={key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, key)}
                  className="rounded-[24px] border p-4 w-[300px] flex-shrink-0 space-y-4 min-h-[440px] flex flex-col transition shadow-sm"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <div
                    className="flex items-center justify-between border-b pb-3"
                    style={{ borderColor: ui.border }}
                  >
                    <p className="text-xs font-bold capitalize tracking-tight">
                      {key.replace(/_/g, " ")}
                    </p>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: ui.inner }}
                    >
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[62vh] pr-1">
                    {items.length === 0 ? (
                      <div
                        className="flex h-full items-center justify-center p-8 text-center text-[11px] opacity-40 border border-dashed rounded-2xl"
                        style={{ borderColor: ui.border }}
                      >
                        Drop items here
                      </div>
                    ) : (
                      items.map((item) => {
                        const itemId = item._id || item.id;
                        return (
                          <div
                            key={itemId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, itemId)}
                            className="cursor-grab active:cursor-grabbing transition hover:scale-[1.01]"
                          >
                            <RequestRow item={item} ui={ui} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
