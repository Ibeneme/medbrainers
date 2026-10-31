"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Search,
  ClipboardList,
  Calendar,
  Droplets,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  ScanLine,
  Inbox,
  X,
  LayoutList,
  Kanban,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomDropdown } from "@/components/ui/items";
import type { Modality } from "@/api/slices/radiologySlice";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const MODALITY_TABS: { id: Modality | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "xray", label: "X-Ray" },
  { id: "mri", label: "MRI" },
  { id: "ct", label: "CT" },
  { id: "ultrasound", label: "Ultrasound" },
  { id: "mammography", label: "Mammography" },
  { id: "fluoroscopy", label: "Fluoroscopy" },
];

const MODALITY_LABEL: Record<string, string> = Object.fromEntries(
  MODALITY_TABS.map((t) => [t.id, t.label])
);

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Requested", value: "requested" },
  { label: "Pre-auth pending", value: "pre_auth_pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Queued", value: "queued" },
  { label: "In acquisition", value: "in_acquisition" },
  { label: "Completed", value: "completed" },
  { label: "Reported", value: "reported" },
  { label: "Cancelled", value: "cancelled" },
];

const KANBAN_COLUMNS = [
  { id: "requested", label: "Requested" },
  { id: "pre_auth_pending", label: "Pre-Auth Pending" },
  { id: "scheduled", label: "Scheduled" },
  { id: "queued", label: "Queued" },
  { id: "in_acquisition", label: "In Acquisition" },
  { id: "completed", label: "Completed" },
  { id: "reported", label: "Reported" },
  { id: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { label: "All priorities", value: "all" },
  { label: "Routine", value: "routine" },
  { label: "Urgent", value: "urgent" },
  { label: "STAT", value: "stat" },
];

const DATE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Past 7 days", value: "7days" },
  { label: "Past 30 days", value: "30days" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

function ageOf(dob?: string): string {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0) return "";
  if (days < 31) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} mo`;
  return `${Math.floor(days / 365.25)} yrs`;
}

function formatWhen(iso?: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Badge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap opacity-80"
      style={{ backgroundColor: "rgba(150, 150, 150, 0.15)" }}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function RadiologyRequestsPage() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<Modality | "all">("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban"); // Kanban is default

  const { requests, listLoading, loadRequests, hasFacility } = useRadiology({
    autoRequests: true,
  });

  const filtered = useMemo(() => {
    return requests.filter((r: any) => {
      if (modalityFilter !== "all" && r.modality !== modalityFilter)
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter)
        return false;

      if (dateFilter !== "all" && r.requestedAt) {
        const reqDate = new Date(r.requestedAt).getTime();
        const now = Date.now();
        const diffDays = (now - reqDate) / (1000 * 60 * 60 * 24);

        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "7days" && diffDays > 7) return false;
        if (dateFilter === "30days" && diffDays > 30) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const patient =
        typeof r.patient === "object" && r.patient
          ? `${r.patient.firstName || ""} ${r.patient.lastName || ""} ${
              r.patient.mrn || ""
            }`
          : "";
      return (
        r.procedureName?.toLowerCase().includes(q) ||
        r.accessionNumber?.toLowerCase().includes(q) ||
        r.bodyPart?.toLowerCase().includes(q) ||
        r.clinicalIndication?.toLowerCase().includes(q) ||
        patient.toLowerCase().includes(q)
      );
    });
  }, [
    requests,
    modalityFilter,
    statusFilter,
    priorityFilter,
    dateFilter,
    search,
  ]);

  const stats = useMemo(() => {
    const list = requests as any[];
    return {
      total: list.length,
      pending: list.filter((r) => r.status === "pre_auth_pending").length,
      urgent: list.filter(
        (r) => r.priority === "urgent" || r.priority === "stat"
      ).length,
      done: list.filter(
        (r) => r.status === "completed" || r.status === "reported"
      ).length,
    };
  }, [requests]);

  const modalityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length };
    (requests as any[]).forEach((r) => {
      counts[r.modality] = (counts[r.modality] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    dateFilter !== "all" ||
    modalityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFilter("all");
    setModalityFilter("all");
  };

  if (!hasFacility) {
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );
  }

  const tiles = [
    { label: "Total requests", value: stats.total, onClick: clearFilters },
    {
      label: "Awaiting pre-auth",
      value: stats.pending,
      onClick: () => {
        clearFilters();
        setStatusFilter("pre_auth_pending");
      },
    },
    {
      label: "Urgent / STAT",
      value: stats.urgent,
      onClick: () => {
        clearFilters();
        setPriorityFilter("stat");
      },
    },
    {
      label: "Completed",
      value: stats.done,
      onClick: () => {
        clearFilters();
        setStatusFilter("completed");
      },
    },
  ];

  return (
    <div className="mx-auto max-w-7xl w-full">
      {listLoading && (
        <DarkBlurOverlayLoader text="Loading X-Ray / MRI Requests..." />
      )}

      <div
        className="space-y-5 w-full min-h-screen p-4 sm:p-6"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Header */}
        <div
          className="rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <ClipboardList size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                X-Ray / MRI Requests
              </h1>
              <p className="text-xs opacity-60 mt-0.5">
                Orders across all modalities and patients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadRequests()}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition hover:opacity-90 border"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.border,
                color: ui.text,
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <Link
              href="/dashboard/radiology/create"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} /> New order
            </Link>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={t.onClick}
              className="text-left rounded-2xl p-4 transition border"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <span className="text-[11px] font-medium opacity-60">
                {t.label}
              </span>
              <p className="text-2xl font-bold mt-1.5">{t.value}</p>
            </button>
          ))}
        </div>

        {/* Modality tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MODALITY_TABS.map((t) => {
            const active = modalityFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setModalityFilter(t.id)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition shrink-0 border"
                style={{
                  backgroundColor: active ? PRIMARY_COLOR : ui.card,
                  color: active ? "#fff" : ui.text,
                  borderColor: active ? PRIMARY_COLOR : ui.border,
                }}
              >
                {t.label}
                <span
                  className="rounded-full px-1.5 py-px text-[10px] font-bold"
                  style={{
                    backgroundColor: active
                      ? "rgba(255,255,255,0.25)"
                      : ui.inner,
                  }}
                >
                  {modalityCounts[t.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + filters + View Mode Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div
            className="md:col-span-4 rounded-[20px] px-4 py-3 flex items-center gap-3 border"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <Search size={16} className="opacity-40 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accession, patient, MRN, procedure…"
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: ui.text }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="opacity-40 hover:opacity-100 shrink-0"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="md:col-span-3">
            <CustomDropdown
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
          </div>
          <div className="md:col-span-2">
            <CustomDropdown
              value={priorityFilter}
              options={PRIORITY_OPTIONS}
              onChange={setPriorityFilter}
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
          </div>
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <div
              className="flex items-center rounded-full p-1 border"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "kanban"
                    ? "text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "kanban" ? PRIMARY_COLOR : "transparent",
                }}
              >
                <Kanban size={13} /> Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? PRIMARY_COLOR : "transparent",
                }}
              >
                <LayoutList size={13} /> List
              </button>
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between text-xs opacity-70 px-1">
          <span>
            Showing <b>{filtered.length}</b> of {stats.total} request
            {stats.total === 1 ? "" : "s"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold hover:opacity-100"
              style={{ color: PRIMARY_COLOR }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Kanban View (Default) */}
        {viewMode === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-6 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const colItems = filtered.filter(
                (item: any) => item.status === col.id
              );
              return (
                <div
                  key={col.id}
                  className="rounded-[22px] p-3.5 flex flex-col shrink-0 w-[300px] border"
                  style={{
                    backgroundColor: ui.card,
                    borderColor: ui.border,
                  }}
                >
                  <div
                    className="flex items-center justify-between px-2 pb-3 mb-2 border-b"
                    style={{ borderColor: ui.border }}
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">
                      {col.label}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: ui.inner,
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {colItems.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[400px]">
                    {colItems.length === 0 ? (
                      <div className="py-12 text-center text-xs opacity-40">
                        No requests
                      </div>
                    ) : (
                      colItems.map((item: any) => {
                        const patient =
                          typeof item.patient === "object"
                            ? item.patient
                            : null;
                        const fullName = patient
                          ? `${patient.firstName || ""} ${
                              patient.lastName || ""
                            }`.trim()
                          : "Unknown patient";
                        const priorityLabel = cap(item.priority || "routine");

                        return (
                          <div
                            key={item._id}
                            onClick={() =>
                              router.push(
                                `/dashboard/radiology/requests/${item._id}`
                              )
                            }
                            className="rounded-2xl p-4 transition border cursor-pointer hover:shadow-md space-y-3"
                            style={{
                              backgroundColor: ui.inner,
                              borderColor: ui.border,
                            }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono opacity-60">
                                {item.accessionNumber}
                              </span>
                              <Badge label={priorityLabel} />
                            </div>

                            <div>
                              <h4 className="text-xs font-bold leading-snug">
                                {item.procedureName || "Untitled procedure"}
                              </h4>
                              <p className="text-[11px] opacity-60 mt-0.5">
                                {fullName} • MRN {patient?.mrn || "N/A"}
                              </p>
                            </div>

                            <div
                              className="flex items-center justify-between pt-2 border-t text-[10px] opacity-60"
                              style={{ borderColor: ui.border }}
                            >
                              <span>
                                {MODALITY_LABEL[item.modality] || item.modality}
                              </span>
                              <span>{formatWhen(item.requestedAt)}</span>
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
        ) : (
          /* List View */
          <div className="space-y-3.5">
            {filtered.length === 0 && !listLoading && (
              <div
                className="rounded-[24px] p-12 text-center space-y-2 border"
                style={{ borderColor: ui.border, backgroundColor: ui.card }}
              >
                <Inbox size={28} className="mx-auto opacity-30" />
                <p className="text-sm font-semibold">
                  No X-Ray / MRI Requests found
                </p>
                <p className="text-xs opacity-60">
                  {hasActiveFilters
                    ? "Try changing or clearing your filters."
                    : "Create a new order to get started."}
                </p>
              </div>
            )}

            {filtered.map((item: any) => {
              const patient =
                typeof item.patient === "object" ? item.patient : null;
              const fullName = patient
                ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
                : "Unknown patient";
              const age = ageOf(patient?.dateOfBirth);
              const requester = item.requestedBy
                ? `${item.requestedBy.firstName || ""} ${
                    item.requestedBy.lastName || ""
                  }`.trim()
                : "";
              const priorityLabel = cap(item.priority || "routine");
              const statusLabel = cap(
                item.status?.replace(/_/g, " ") || "unknown"
              );
              const preAuthStatus = item.preAuthorization?.status;

              return (
                <div
                  key={item._id}
                  onClick={() =>
                    router.push(`/dashboard/radiology/requests/${item._id}`)
                  }
                  className="rounded-[22px] overflow-hidden flex transition border cursor-pointer group"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-4">
                    {/* Top row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold"
                          style={{
                            backgroundColor: ui.inner,
                            color: PRIMARY_COLOR,
                          }}
                        >
                          <ScanLine size={13} />
                          {MODALITY_LABEL[item.modality] || item.modality}
                        </span>
                        <span className="text-xs font-mono opacity-60">
                          {item.accessionNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge label={priorityLabel} />
                        <Badge label={statusLabel} />
                      </div>
                    </div>

                    {/* Request + patient */}
                    <div className="grid gap-4 md:grid-cols-[1fr_260px]">
                      <div className="min-w-0 space-y-2">
                        <h3 className="text-sm sm:text-base font-bold leading-snug break-words group-hover:opacity-90">
                          {item.procedureName || "Untitled procedure"}
                        </h3>
                        <p className="text-xs opacity-60">
                          {item.bodyPart}
                          {item.laterality && item.laterality !== "na"
                            ? ` • ${cap(item.laterality)}`
                            : ""}
                        </p>
                        <div>
                          <p className="text-[10px] font-semibold opacity-50 mb-0.5">
                            Clinical indication
                          </p>
                          <p className="text-xs opacity-80 leading-relaxed line-clamp-2">
                            {item.clinicalIndication || "—"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl p-3 flex flex-col justify-center min-w-0 border"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: ui.border,
                        }}
                      >
                        <div className="min-w-0 text-xs space-y-0.5">
                          <p className="font-bold text-sm truncate">
                            {fullName}
                          </p>
                          <p className="opacity-60 truncate">
                            MRN {patient?.mrn || "N/A"}
                          </p>
                          <p className="opacity-60 truncate">
                            {[cap(patient?.gender), age]
                              .filter(Boolean)
                              .join(" • ") || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1 text-[11px] border-t"
                      style={{ borderColor: ui.border }}
                    >
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {item.contrast?.contrastRequired && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold opacity-80 border"
                            style={{
                              backgroundColor: ui.inner,
                              borderColor: ui.border,
                            }}
                          >
                            <Droplets size={12} />
                            Contrast:{" "}
                            {item.contrast?.contrastType?.toUpperCase()}
                          </span>
                        )}
                        {item.preAuthorization?.required && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold opacity-80 border"
                            style={{
                              backgroundColor: ui.inner,
                              borderColor: ui.border,
                            }}
                          >
                            {preAuthStatus === "approved" ? (
                              <ShieldCheck size={12} />
                            ) : (
                              <ShieldAlert size={12} />
                            )}
                            Pre-auth{" "}
                            {preAuthStatus?.replace(/_/g, " ") || "required"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-60 pt-2">
                        {requester && (
                          <span className="inline-flex items-center gap-1">
                            <Stethoscope size={12} /> Dr. {requester}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} /> {formatWhen(item.requestedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
