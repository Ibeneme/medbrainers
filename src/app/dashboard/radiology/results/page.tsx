"use client";

import { useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Search,
  FileText,
  Calendar,
  ScanLine,
  Inbox,
  X,
  User,
  ClipboardCheck,
  Stethoscope,
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

export default function RadiologyResultsPage() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<Modality | "all">("all");

  const { results, resultsMeta, resultsLoading, loadResults, hasFacility } =
    useRadiology({
      autoResults: true,
    });

  const filtered = useMemo(() => {
    return results.filter((r: any) => {
      if (modalityFilter !== "all" && r.modality !== modalityFilter)
        return false;

      if (dateFilter !== "all" && r.result?.enteredAt) {
        const resultDate = new Date(r.result.enteredAt).getTime();
        const now = Date.now();
        const diffDays = (now - resultDate) / (1000 * 60 * 60 * 24);

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
        r.procedureCode?.toLowerCase().includes(q) ||
        r.accessionNumber?.toLowerCase().includes(q) ||
        r.bodyPart?.toLowerCase().includes(q) ||
        r.clinicalIndication?.toLowerCase().includes(q) ||
        r.result?.finalResult?.toLowerCase().includes(q) ||
        patient.toLowerCase().includes(q)
      );
    });
  }, [results, modalityFilter, dateFilter, search]);

  const stats = useMemo(() => {
    const list = results as any[];
    return {
      total: list.length,
      today: list.filter((r) => {
        if (!r.result?.enteredAt) return false;
        const d = new Date(r.result.enteredAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length,
      withCode: list.filter((r) => !!r.procedureCode).length,
      modalities: new Set(list.map((r) => r.modality)).size,
    };
  }, [results]);

  const modalityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    (results as any[]).forEach((r) => {
      counts[r.modality] = (counts[r.modality] || 0) + 1;
    });
    return counts;
  }, [results]);

  const hasActiveFilters =
    search.trim() !== "" || dateFilter !== "all" || modalityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setDateFilter("all");
    setModalityFilter("all");
  };

  const handleSearchSubmit = () => {
    loadResults({
      q: search.trim() || undefined,
      modality: modalityFilter === "all" ? undefined : modalityFilter,
    });
  };

  if (!hasFacility) {
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );
  }

  const tiles = [
    { label: "Total results", value: stats.total, onClick: clearFilters },
    {
      label: "Entered today",
      value: stats.today,
      onClick: () => {
        clearFilters();
        setDateFilter("today");
      },
    },
    {
      label: "With procedure code",
      value: stats.withCode,
      onClick: clearFilters,
    },
    {
      label: "Modalities",
      value: stats.modalities,
      onClick: clearFilters,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl w-full">
      {resultsLoading && (
        <DarkBlurOverlayLoader text="Loading radiology results..." />
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
              <FileText size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                Radiology Results
              </h1>
              <p className="text-xs opacity-60 mt-0.5">
                Final results across all modalities — search by code, name or
                accession
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadResults()}
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
              href="/dashboard/radiology/requests"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              View orders
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

        {/* Search + filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div
            className="md:col-span-6 rounded-[20px] px-4 py-3 flex items-center gap-3 border"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <Search size={16} className="opacity-40 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit();
              }}
              placeholder="Search by accession, procedure code, name, patient, MRN…"
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
              value={dateFilter}
              options={DATE_OPTIONS}
              onChange={setDateFilter}
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90 w-full md:w-auto justify-center"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Search size={13} /> Search
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between text-xs opacity-70 px-1">
          <span>
            Showing <b>{filtered.length}</b>
            {resultsMeta?.total != null
              ? ` of ${resultsMeta.total}`
              : ` of ${stats.total}`}{" "}
            result
            {(resultsMeta?.total ?? stats.total) === 1 ? "" : "s"}
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

        {/* Results list */}
        <div className="space-y-3.5">
          {filtered.length === 0 && !resultsLoading && (
            <div
              className="rounded-[24px] p-12 text-center space-y-2 border"
              style={{ borderColor: ui.border, backgroundColor: ui.card }}
            >
              <Inbox size={28} className="mx-auto opacity-30" />
              <p className="text-sm font-semibold">No results found</p>
              <p className="text-xs opacity-60">
                {hasActiveFilters
                  ? "Try changing or clearing your filters."
                  : "Final results will appear here once entered."}
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
            const enteredBy =
              item.result?.enteredBy &&
              typeof item.result.enteredBy === "object"
                ? `${item.result.enteredBy.firstName || ""} ${
                    item.result.enteredBy.lastName || ""
                  }`.trim()
                : "";
            const radiologist =
              item.assignedRadiologist &&
              typeof item.assignedRadiologist === "object"
                ? `${item.assignedRadiologist.firstName || ""} ${
                    item.assignedRadiologist.lastName || ""
                  }`.trim()
                : "";
            const statusLabel = cap(
              item.status?.replace(/_/g, " ") || "unknown"
            );
            const resultSnippet =
              item.result?.finalResult?.slice(0, 180) || "—";

            return (
              <div
                key={item._id}
                onClick={() =>
                  router.push(`/dashboard/radiology/results/${item._id}`)
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
                      {item.procedureCode && (
                        <Badge label={item.procedureCode} />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge label={statusLabel} />
                    </div>
                  </div>

                  {/* Procedure + patient */}
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
                          Final result
                        </p>
                        <p className="text-xs opacity-80 leading-relaxed line-clamp-3">
                          {resultSnippet}
                          {(item.result?.finalResult?.length || 0) > 180
                            ? "…"
                            : ""}
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
                        <p className="font-bold text-sm truncate">{fullName}</p>
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
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold opacity-80 border"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: ui.border,
                        }}
                      >
                        <ClipboardCheck size={12} />
                        Result entered
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-60 pt-2">
                      {enteredBy && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} /> {enteredBy}
                        </span>
                      )}
                      {radiologist && (
                        <span className="inline-flex items-center gap-1">
                          <Stethoscope size={12} /> Dr. {radiologist}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />{" "}
                        {formatWhen(item.result?.enteredAt || item.requestedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
