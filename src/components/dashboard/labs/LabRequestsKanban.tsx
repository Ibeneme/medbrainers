"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  Layers,
  Activity,
  FileText,
  ShieldCheck,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

interface LabRequestsKanbanProps {
  requests: any[];
  ui: UI;
  onStatusChange?: (requestId: string, newStatus: string) => void;
}

const KANBAN_COLUMNS = [
  { id: "ordered", label: "Ordered", icon: Clock, color: "#3b82f6" },
  {
    id: "collecting_sample",
    label: "Collecting Sample",
    icon: Layers,
    color: "#ec4899",
  },
  { id: "collected", label: "Collected", icon: Layers, color: "#8b5cf6" },
  { id: "processing", label: "Processing", icon: Activity, color: "#f59e0b" },
  { id: "resulted", label: "Resulted", icon: FileText, color: "#10b981" },
  { id: "verified", label: "Verified", icon: ShieldCheck, color: "#059669" },
];

export default function LabRequestsKanban({
  requests,
  ui,
  onStatusChange,
}: LabRequestsKanbanProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [localRequests, setLocalRequests] = useState(requests);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  const filteredRequests = localRequests.filter((req) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const patientName =
      typeof req.patient === "object" && req.patient !== null
        ? `${req.patient.firstName || ""} ${
            req.patient.lastName || ""
          }`.toLowerCase()
        : "";
    const mrn =
      typeof req.patient === "object" && req.patient !== null
        ? String(req.patient.mrn || "").toLowerCase()
        : "";
    return (
      patientName.includes(q) ||
      mrn.includes(q) ||
      req.tests?.some(
        (t: any) =>
          t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
      )
    );
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData("text/plain") || draggedId;
    if (!reqId) return;

    setLocalRequests((prev) =>
      prev.map((r) =>
        r._id === reqId
          ? {
              ...r,
              status: targetStatus,
              tests: r.tests?.map((t: any) => ({ ...t, status: targetStatus })),
            }
          : r
      )
    );
    setDraggedId(null);

    if (onStatusChange) {
      onStatusChange(reqId, targetStatus);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-[22px] px-4 py-2.5 sm:py-2 flex items-center gap-3"
        style={{ backgroundColor: ui.card }}
      >
        <Search size={16} className="opacity-40 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search requests by patient name, MRN, or test..."
          className="w-full bg-transparent text-xs outline-none focus:outline-none"
          style={{ color: ui.text }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="opacity-40 hover:opacity-100 text-xs shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {filteredRequests.length === 0 ? (
        <div
          className="rounded-[24px] sm:rounded-[28px] p-12 text-center text-xs opacity-60"
          style={{ backgroundColor: ui.card }}
        >
          {searchQuery
            ? "No lab requests match your search."
            : "No lab requests found for this company."}
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10">
          <div className="inline-flex flex-nowrap items-start gap-4 min-w-full">
            {KANBAN_COLUMNS.map((col) => {
              const ColumnIcon = col.icon;

              const columnItems = filteredRequests.filter((req) => {
                const reqStatus = (req.status || "ordered").toLowerCase();
                const hasMatchingTestStatus = req.tests?.some(
                  (t: any) => t.status?.toLowerCase() === col.id
                );

                if (col.id === "collecting_sample") {
                  return (
                    reqStatus === "collecting_sample" ||
                    (reqStatus === "ordered" && req.requiresSampleCollection)
                  );
                }

                if (col.id === "collected") {
                  return (
                    reqStatus === "collected" ||
                    reqStatus === "partial" ||
                    hasMatchingTestStatus
                  );
                }

                return reqStatus === col.id || hasMatchingTestStatus;
              });

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="rounded-[24px] p-3 sm:p-4 flex flex-col gap-3 w-[280px] sm:w-[300px] shrink-0"
                  style={{ backgroundColor: ui.card }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-xl shrink-0"
                        style={{ backgroundColor: ui.inner, color: col.color }}
                      >
                        <ColumnIcon size={14} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: ui.inner, color: col.color }}
                    >
                      {columnItems.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[320px]">
                    {columnItems.length === 0 ? (
                      <div className="h-32 rounded-2xl border border-dashed border-black/10 dark:border-white/10 flex items-center justify-center text-[11px] opacity-40">
                        Drag requests here
                      </div>
                    ) : (
                      columnItems.map((req) => {
                        const patientName =
                          typeof req.patient === "object" &&
                          req.patient !== null
                            ? `${req.patient.firstName || ""} ${
                                req.patient.lastName || ""
                              }`
                            : "Patient";
                        const patientMrn =
                          typeof req.patient === "object" &&
                          req.patient !== null
                            ? req.patient.mrn
                            : "";

                        return (
                          <div
                            key={req._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, req._id)}
                            onClick={() =>
                              router.push(`/dashboard/labs/requests/${req._id}`)
                            }
                            className="group relative rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all hover:scale-[1.01] border border-black/5 dark:border-white/5"
                            style={{ backgroundColor: ui.inner }}
                            title="Click to view details"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-semibold block truncate">
                                  {patientName}
                                </span>
                                {patientMrn && (
                                  <span className="text-[10px] opacity-50 block truncate">
                                    MRN: {patientMrn}
                                  </span>
                                )}
                              </div>
                              <div className="opacity-40 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing shrink-0">
                                <GripVertical size={14} />
                              </div>
                            </div>

                            <p className="text-[10px] opacity-60">
                              Ordered:{" "}
                              {new Date(req.orderedAt).toLocaleDateString()}
                              {req.priority && ` · ${req.priority}`}
                            </p>

                            <div className="space-y-1 pt-1 border-t border-black/5 dark:border-white/5">
                              <span className="text-[10px] font-semibold opacity-50 block">
                                Tests ({req.tests?.length || 0}):
                              </span>
                              {req.tests
                                ?.slice(0, 2)
                                .map((t: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-[11px]"
                                  >
                                    <span className="truncate max-w-[150px] font-medium">
                                      {t.name}
                                    </span>
                                    <span
                                      className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0"
                                      style={{
                                        backgroundColor:
                                          t.status === "verified" ||
                                          t.status === "resulted"
                                            ? "rgba(16,185,129,0.15)"
                                            : "rgba(245,158,11,0.15)",
                                        color:
                                          t.status === "verified" ||
                                          t.status === "resulted"
                                            ? "#059669"
                                            : "#d97706",
                                      }}
                                    >
                                      {t.status}
                                    </span>
                                  </div>
                                ))}
                              {req.tests?.length > 2 && (
                                <span className="text-[10px] opacity-50 italic block">
                                  +{req.tests.length - 2} more test(s)...
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-end pt-1">
                              <span
                                className="text-[10px] font-semibold flex items-center gap-0.5 group-hover:underline"
                                style={{ color: PRIMARY_COLOR }}
                              >
                                View Details <ChevronRight size={10} />
                              </span>
                            </div>
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
      )}
    </div>
  );
}