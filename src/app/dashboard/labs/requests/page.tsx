"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  FlaskConical,
  Clock,
  Layers,
  Activity,
  FileText,
  ShieldCheck,
  RefreshCw,
  Info,
  LayoutList,
  Columns3,
  GripVertical,
  Paperclip,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchLabRequests, updateRequestKanbanStatus } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import {
  ResultFileLightbox,
  ResultFileThumbStrip,
  normalizeResultFiles,
  type ResultFileItem,
} from "@/components/ui/ResultFilePreviews";
import { useFacilityId } from "@/hooks/useFacilityId";

import { Can } from "@/components/access/can";
const STATUS_OPTIONS = [
  { id: "all", label: "All Statuses" },
  { id: "ordered", label: "Ordered", color: "#3b82f6" },
  { id: "collecting_sample", label: "Collecting Sample", color: "#ec4899" },
  { id: "collected", label: "Collected", color: "#8b5cf6" },
  { id: "processing", label: "Processing", color: "#f59e0b" },
  { id: "resulted", label: "Resulted", color: "#10b981" },
  { id: "verified", label: "Verified", color: "#059669" },
];

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

/** All attachments across every test of a request. */
function getRequestFiles(req: any): ResultFileItem[] {
  return (req?.tests || []).flatMap((t: any) => normalizeResultFiles(t));
}

export default function LabRequestsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  const { facilityId, activeFacility, facilitiesLoading } = useFacilityId();
  const {
    requests: rawRequests,
    listLoading,
    error,
  } = useAppSelector((s) => s.labs);

  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [showGuide, setShowGuide] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    files: ResultFileItem[];
    index: number;
  } | null>(null);

  // Track active drag-over column for visual feedback
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchLabRequests({ facilityId }));
  }, [dispatch, facilityId]);

  // Sync local request state with Redux store data
  useEffect(() => {
    setRequests(rawRequests);
  }, [rawRequests]);

  const companyDisplayName = activeFacility?.name || "Company Laboratory";

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus =
        selectedStatus === "all" ||
        (req.status || "ordered").toLowerCase() === selectedStatus;

      if (!searchQuery.trim()) return matchesStatus;

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

      const matchesSearch =
        patientName.includes(q) ||
        mrn.includes(q) ||
        req.tests?.some(
          (t: any) =>
            t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
        );

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchQuery, selectedStatus]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (!facilityId) return;

    // 1. Optimistic UI update in the background/locally for instant feedback
    const previousRequests = [...requests];
    setRequests((prev) =>
      prev.map((req) =>
        req._id === requestId ? { ...req, status: newStatus } : req
      )
    );

    try {
      // 2. Dispatch background server update
      await dispatch(
        updateRequestKanbanStatus({
          facilityId,
          requestId,
          status: newStatus as any,
        })
      ).unwrap();

      setMsg("Request status updated successfully");
      setTimeout(() => setMsg(null), 3000);

      // Silently refresh from server to ensure consistency
      dispatch(fetchLabRequests({ facilityId }));
    } catch (e: unknown) {
      // Rollback on error
      setRequests(previousRequests);
      setErr(typeof e === "string" ? e : "Failed to update status");
      setTimeout(() => setErr(null), 3000);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const reqId = e.dataTransfer.getData("text/plain");
    if (!reqId) return;

    // Check current status to avoid redundant updates
    const targetReq = requests.find((r) => r._id === reqId);
    if (targetReq && targetReq.status !== targetStatus) {
      handleStatusChange(reqId, targetStatus);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {(listLoading || facilitiesLoading) && requests.length === 0 && (
        <DarkBlurOverlayLoader text="Loading lab requests..." />
      )}

      <ResultFileLightbox
        files={preview?.files || []}
        index={preview ? preview.index : null}
        onClose={() => setPreview(null)}
        onIndexChange={(next) =>
          setPreview((p) => (p ? { ...p, index: next } : p))
        }
        ui={ui}
      />

      {(msg || err || error) && (
        <div
          className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold z-50 border border-black/10 dark:border-white/10 shadow-lg"
          style={{
            backgroundColor: ui.card,
            color: err || error ? "#ef4444" : "#059669",
          }}
        >
          {msg || err || error}
        </div>
      )}

      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <Link
            href="/dashboard/labs"
            className="opacity-60 hover:opacity-100 transition"
          >
            Laboratory
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="font-semibold">Patient Requests</span>
        </div>
        <div className="flex items-center gap-2">
          <Can path={"/dashboard/labs"}><button
            type="button"
            onClick={() => router.push("/dashboard/labs")}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90 border"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            Dashboard
          </button></Can>
          <button
            type="button"
            onClick={() => {
              if (facilityId) {
                dispatch(fetchLabRequests({ facilityId }));
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90 border"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
            title="Reload the newest requests"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div
        className="rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 border border-black/5 dark:border-white/5"
            style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
          >
            <FlaskConical size={22} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Patient Laboratory Requests
            </h1>
            <p className="text-xs opacity-60 mt-0.5">
              {companyDisplayName} · {requests.length} total records
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div
          className="inline-flex p-1 rounded-full border border-black/10 dark:border-white/10 gap-1 self-start sm:self-auto"
          style={{ backgroundColor: ui.inner }}
        >
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition outline-none"
            style={{
              backgroundColor:
                viewMode === "list" ? PRIMARY_COLOR : "transparent",
              color: viewMode === "list" ? "#fff" : ui.text,
            }}
          >
            <LayoutList size={14} /> List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition outline-none"
            style={{
              backgroundColor:
                viewMode === "kanban" ? PRIMARY_COLOR : "transparent",
              color: viewMode === "kanban" ? "#fff" : ui.text,
            }}
          >
            <Columns3 size={14} /> Kanban View
          </button>
        </div>
      </div>

      {/* Guide & Tips Box */}
      <div
        className="rounded-[24px] p-4 border text-xs space-y-3 transition-all"
        style={{
          backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
          color: isDark ? "#fca5a5" : "#991b1b",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={15} style={{ color: isDark ? "#f87171" : "#dc2626" }} />
            <span>Requests Management Guide & Workflow Tips</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-medium opacity-80 hover:opacity-100 transition underline"
          >
            {showGuide ? "Hide Guide" : "Show Guide"}
          </button>
        </div>

        <p className="opacity-90 leading-relaxed">
          Monitor specimen collection, processing states, and test results in
          real time. Use status filters or search by patient details instantly.
        </p>

        {showGuide && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-[11px]"
            style={{
              borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
            }}
          >
            <div className="space-y-1.5">
              <p className="font-semibold opacity-100">Searching & Filtering</p>
              <ul className="list-disc list-inside opacity-90 space-y-1">
                <li>Search by patient name, MRN, or specific test name.</li>
                <li>
                  Use status filter buttons to isolate active testing stages.
                </li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold opacity-100">Workflow Actions</p>
              <ul className="list-disc list-inside opacity-90 space-y-1">
                <li>
                  Click any request card to view comprehensive test details.
                </li>
                <li>Switch to Kanban view to drag requests across stages.</li>
                <li>
                  Click an attachment thumbnail to preview result files without
                  leaving this page.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Search & Status Filter Bar */}
      <div className="space-y-3">
        <div
          className="rounded-[22px] px-4 py-3 flex items-center gap-3 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <Search size={16} className="opacity-40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, MRN, or test name..."
            className="w-full bg-transparent text-xs outline-none"
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

        {/* Status Filter Chips (List View Only) */}
        {viewMode === "list" && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] opacity-60 font-medium mr-1">
              Status:
            </span>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className="rounded-full px-3 py-1 text-[11px] font-medium transition border"
                style={{
                  backgroundColor:
                    selectedStatus === st.id ? PRIMARY_COLOR : ui.card,
                  borderColor:
                    selectedStatus === st.id ? PRIMARY_COLOR : ui.border,
                  color: selectedStatus === st.id ? "#fff" : ui.text,
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Requests Content (List or Kanban) */}
      {filteredRequests.length === 0 ? (
        <div
          className="rounded-[28px] p-16 text-center border space-y-2"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <p className="text-xs opacity-60">
            {searchQuery || selectedStatus !== "all"
              ? "No laboratory requests match your search or filter criteria."
              : "No laboratory requests found for this facility."}
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="w-full overflow-x-auto pb-4 pt-1">
          <div className="inline-flex flex-nowrap items-start gap-4 min-w-full">
            {KANBAN_COLUMNS.map((col) => {
              const ColumnIcon = col.icon;
              const isOver = dragOverColumn === col.id;

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
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={(e) => handleDragLeave(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`rounded-[24px] p-3 sm:p-4 flex flex-col gap-3 w-[280px] sm:w-[300px] shrink-0 border transition-colors ${
                    isOver
                      ? "border-primary bg-opacity-80 shadow-md"
                      : "border-black/5 dark:border-white/5"
                  }`}
                  style={{
                    backgroundColor: isOver
                      ? isDark
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(59, 130, 246, 0.05)"
                      : ui.card,
                    borderColor: isOver ? PRIMARY_COLOR : ui.border,
                  }}
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
                        const requestFiles = getRequestFiles(req);

                        return (
                          <div
                            key={req._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, req._id)}
                            onClick={() =>
                              router.push(`/dashboard/labs/requests/${req._id}`)
                            }
                            className="group relative rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all hover:scale-[1.01] border border-black/5 dark:border-white/5 shadow-sm"
                            style={{ backgroundColor: ui.inner }}
                            title="Click to view details or drag to change status"
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
                            </div>

                            {requestFiles.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                                <span className="text-[10px] font-semibold opacity-50 flex items-center gap-1">
                                  <Paperclip size={10} /> Attachments (
                                  {requestFiles.length})
                                </span>
                                <ResultFileThumbStrip
                                  files={requestFiles}
                                  max={4}
                                  size={34}
                                  ui={ui}
                                  onOpen={(index) =>
                                    setPreview({ files: requestFiles, index })
                                  }
                                />
                              </div>
                            )}

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
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => {
            const patientName =
              typeof req.patient === "object" && req.patient !== null
                ? `${req.patient.firstName || ""} ${req.patient.lastName || ""}`
                : "Patient";
            const patientMrn =
              typeof req.patient === "object" && req.patient !== null
                ? req.patient.mrn
                : "";
            const totalFiles = getRequestFiles(req).length;

            return (
              <div
                key={req._id}
                className="rounded-[24px] p-5 space-y-4 border transition-all"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{patientName}</span>
                      {patientMrn && (
                        <span className="text-[11px] opacity-50 font-mono">
                          (MRN: {patientMrn})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-60">
                      Ordered on {new Date(req.orderedAt).toLocaleDateString()}
                      {req.priority && ` · Priority: ${req.priority}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {totalFiles > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-black/5 dark:border-white/5"
                        style={{
                          backgroundColor: ui.inner,
                          color: PRIMARY_COLOR,
                        }}
                        title="Result files attached"
                      >
                        <Paperclip size={11} /> {totalFiles}
                      </span>
                    )}
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border border-black/5 dark:border-white/5"
                      style={{
                        backgroundColor: "rgba(59,130,246,0.15)",
                        color: "#3b82f6",
                      }}
                    >
                      {req.status || "ordered"}
                    </span>
                    <Can path={`/dashboard/labs/requests/${req._id}`}><button
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/labs/requests/${req._id}`)
                      }
                      className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      View Details <ChevronRight size={12} />
                    </button></Can>
                  </div>
                </div>

                {/* Tests Sub-list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold opacity-60 block uppercase tracking-wider">
                    Requested Tests ({req.tests?.length || 0})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {req.tests?.map((t: any, idx: number) => {
                      const testFiles = normalizeResultFiles(t);

                      return (
                        <div
                          key={idx}
                          className="rounded-xl p-3 space-y-2.5 border border-black/5 dark:border-white/5"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {t.name}
                              </p>
                              <p className="text-[10px] opacity-50 font-mono">
                                Code: {t.code}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
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
                                {t.status || "ordered"}
                              </span>
                            </div>
                          </div>

                          {testFiles.length > 0 && (
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                              <span className="text-[10px] font-semibold opacity-50 flex items-center gap-1 shrink-0">
                                <Paperclip size={10} /> {testFiles.length}{" "}
                                {testFiles.length === 1 ? "file" : "files"}
                              </span>
                              <ResultFileThumbStrip
                                files={testFiles}
                                max={4}
                                size={36}
                                ui={ui}
                                onOpen={(index) =>
                                  setPreview({ files: testFiles, index })
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
