"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Search,
  Stethoscope,
  Filter,
  Calendar,
  FlaskConical,
  Pill,
  RefreshCw,
  Paperclip,
  Plus,
  LayoutList,
  Kanban,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchCompanyConsultations } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomPopupDatePicker } from "@/components/ui/items";
import { formatRecordedDate } from "@/utils/dateUtils";

// Helper to get local YYYY-MM-DD safely on the client side
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AllConsultationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, activeFacility, facilitiesLoading } = useFacilityId();
  const { companyConsultations, companyConsultationsLoading } = useAppSelector(
    (s) => s.patients
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState<boolean>(false);
  const [hasTestsFilter, setHasTestsFilter] = useState<boolean>(false);
  const [hasDrugsFilter, setHasDrugsFilter] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  // Date filter: Initialize as empty string to prevent SSR/prerender mismatch
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Set today's date safely on client mount
  useEffect(() => {
    setSelectedDate(getTodayDateString());
  }, []);

  // Fetch consultations on mount or facility change
  useEffect(() => {
    if (!facilityId) return;
    dispatch(
      fetchCompanyConsultations({
        facilityId,
        active: activeOnly ? true : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        hasTests: hasTestsFilter ? true : undefined,
        hasDrugs: hasDrugsFilter ? true : undefined,
      })
    );
  }, [
    dispatch,
    facilityId,
    activeOnly,
    statusFilter,
    hasTestsFilter,
    hasDrugsFilter,
  ]);

  const companyDisplayName = activeFacility?.name || "Company Laboratory";

  // Filter local search and date selection across patient names, MRN, consultation titles, and dates
  const filteredConsultations = useMemo(() => {
    if (!companyConsultations) return [];

    return companyConsultations.filter((item) => {
      const con = item.consultation;

      // Date filtering logic
      if (selectedDate) {
        const consultedAtRaw = con.consultedAt || item.createdAt;
        if (!consultedAtRaw) return false;
        const recordDateStr = new Date(consultedAtRaw)
          .toISOString()
          .split("T")[0];
        const filterDateStr = selectedDate.split("T")[0];
        if (recordDateStr !== filterDateStr) return false;
      }

      // Search query filtering logic
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = (item.patientName || "").toLowerCase();
        const mrn = (item.patientMrn || "").toLowerCase();
        const title = (con?.title || "").toLowerCase();
        const diagnosis = (con?.diagnosis || "").toLowerCase();

        if (
          !patientName.includes(q) &&
          !mrn.includes(q) &&
          !title.includes(q) &&
          !diagnosis.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [companyConsultations, searchQuery, selectedDate]);

  return (
    <div className="mx-auto max-w-7xl w-full">
      {(companyConsultationsLoading || facilitiesLoading) &&
        (!companyConsultations || companyConsultations.length === 0) && (
          <DarkBlurOverlayLoader text="Loading company consultations..." />
        )}

      <div
        className="space-y-6 w-full"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 opacity-70 truncate pr-2">
            <Link
              href="/dashboard/patients"
              className="hover:opacity-100 shrink-0"
            >
              Patients
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold shrink-0">All Consultations</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/consultations/patients")}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} /> New Consultation
            </button>
            <button
              type="button"
              onClick={() => {
                if (facilityId) {
                  dispatch(
                    fetchCompanyConsultations({
                      facilityId,
                      active: activeOnly ? true : undefined,
                      status: statusFilter !== "all" ? statusFilter : undefined,
                    })
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90 border"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.border,
                color: ui.text,
              }}
            >
              <RefreshCw size={12} /> Refresh
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
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <Stethoscope size={24} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Consultations Directory
              </h1>
              <p className="text-xs opacity-60 mt-0.5">
                {companyDisplayName} · Showing{" "}
                <span className="font-semibold">
                  {filteredConsultations.length}
                </span>{" "}
                of {companyConsultations.length} total records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            <div
              className="flex items-center rounded-full p-1 border"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                style={{
                  backgroundColor:
                    viewMode === "list" ? PRIMARY_COLOR : "transparent",
                  color: viewMode === "list" ? "#fff" : ui.text,
                }}
              >
                <LayoutList size={13} /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                style={{
                  backgroundColor:
                    viewMode === "kanban" ? PRIMARY_COLOR : "transparent",
                  color: viewMode === "kanban" ? "#fff" : ui.text,
                }}
              >
                <Kanban size={13} /> Kanban
              </button>
            </div>

            {/* Quick Active Toggle Button */}
            <button
              type="button"
              onClick={() => setActiveOnly(!activeOnly)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition border outline-none"
              style={{
                backgroundColor: activeOnly ? PRIMARY_COLOR : ui.inner,
                borderColor: activeOnly ? PRIMARY_COLOR : ui.border,
                color: activeOnly ? "#fff" : ui.text,
              }}
            >
              <Filter size={14} />
              {activeOnly ? "Active Only" : "Filter Active"}
            </button>
          </div>
        </div>

        {/* Search, Date Picker & Filter Bar */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div
              className="md:col-span-2 rounded-[22px] px-4 py-3 flex items-center gap-3 border"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <Search size={16} className="opacity-40 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, MRN, consultation title, or diagnosis..."
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

            {/* Date Picker Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CustomPopupDatePicker
                  label=""
                  value={selectedDate}
                  onChange={(val) => setSelectedDate(val)}
                  border={ui.border}
                  colors={colors}
                  isDark={isDark}
                  placeholder="Filter by date..."
                />
              </div>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="rounded-xl px-3 py-3 text-xs font-semibold border transition hover:opacity-80 shrink-0 flex items-center gap-1"
                  style={{
                    backgroundColor: ui.card,
                    borderColor: ui.border,
                    color: ui.text,
                  }}
                  title="Clear date filter"
                >
                  <X size={14} /> All Dates
                </button>
              )}
            </div>
          </div>

          {/* Status & Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="opacity-60 font-medium mr-1">Status:</span>
            {["all", "open", "completed"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className="rounded-full px-3.5 py-1 text-[11px] font-medium capitalize transition border"
                style={{
                  backgroundColor:
                    statusFilter === st ? PRIMARY_COLOR : ui.card,
                  borderColor: statusFilter === st ? PRIMARY_COLOR : ui.border,
                  color: statusFilter === st ? "#fff" : ui.text,
                }}
              >
                {st}
              </button>
            ))}

            <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-2" />

            <button
              type="button"
              onClick={() => setHasTestsFilter(!hasTestsFilter)}
              className="rounded-full px-3 py-1 text-[11px] font-medium transition border"
              style={{
                backgroundColor: hasTestsFilter ? PRIMARY_COLOR : ui.card,
                borderColor: hasTestsFilter ? PRIMARY_COLOR : ui.border,
                color: hasTestsFilter ? "#fff" : ui.text,
              }}
            >
              Has Lab Tests
            </button>
            <button
              type="button"
              onClick={() => setHasDrugsFilter(!hasDrugsFilter)}
              className="rounded-full px-3 py-1 text-[11px] font-medium transition border"
              style={{
                backgroundColor: hasDrugsFilter ? PRIMARY_COLOR : ui.card,
                borderColor: hasDrugsFilter ? PRIMARY_COLOR : ui.border,
                color: hasDrugsFilter ? "#fff" : ui.text,
              }}
            >
              Has Prescriptions
            </button>

            {selectedDate && (
              <span className="ml-auto text-[11px] font-medium opacity-60">
                Filtered for date:{" "}
                <strong className="font-bold">{selectedDate}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Content Area: List View vs Kanban View */}
        {filteredConsultations.length === 0 ? (
          <div
            className="rounded-[28px] p-16 text-center border space-y-2"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <Stethoscope size={36} className="mx-auto opacity-30" />
            <p className="text-sm font-medium opacity-80">
              No consultations match your filter criteria for{" "}
              {selectedDate ? `date ${selectedDate}` : "selected filters"}.
            </p>
            <p className="text-xs opacity-50">
              Try selecting "All Dates" or adjusting your search query and
              status filters.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* ================= LIST VIEW ================= */
          <div className="grid grid-cols-1 gap-4">
            {filteredConsultations.map((item, idx) => {
              const con = item.consultation;
              const testCount = con.recommendedTests?.length || 0;
              const drugCount = con.recommendedDrugs?.length || 0;
              const attachmentCount = con.attachments?.length || 0;

              return (
                <div
                  key={con._id || idx}
                  className="rounded-[24px] p-5 space-y-4 border transition-all hover:border-current/30"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 font-bold text-xs text-white"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        {item.patientName?.[0] || "P"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/patients/${item.patientId}`}
                            className="text-sm font-bold hover:underline"
                            style={{ color: PRIMARY_COLOR }}
                          >
                            {item.patientName}
                          </Link>
                          {item.patientMrn && (
                            <span className="text-[11px] opacity-50 font-mono">
                              (MRN: {item.patientMrn})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-60 flex items-center gap-2 mt-0.5">
                          <Calendar size={11} />
                          {formatRecordedDate(con.consultedAt)}
                          {item.patientPhone && ` · ${item.patientPhone}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border border-black/5 dark:border-white/5"
                        style={{
                          backgroundColor:
                            con.status === "completed"
                              ? "rgba(16,185,129,0.15)"
                              : "rgba(59,130,246,0.15)",
                          color:
                            con.status === "completed" ? "#059669" : "#3b82f6",
                        }}
                      >
                        {con.status || "open"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/patients/${item.patientId}/consultations/${con._id}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        View Details <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Consultation Body */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <h3 className="text-sm font-bold">{con.title}</h3>
                      <p className="opacity-80 mt-1 line-clamp-2">
                        <strong className="font-semibold opacity-100">
                          Complaint:
                        </strong>{" "}
                        {con.complaint}
                      </p>
                    </div>

                    {con.diagnosis && (
                      <p className="opacity-80">
                        <strong className="font-semibold opacity-100">
                          Diagnosis:
                        </strong>{" "}
                        {con.diagnosis} {con.icdCode && `(ICD: ${con.icdCode})`}
                      </p>
                    )}

                    {/* Meta badges for tests, drugs, attachments */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {testCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-black/5 dark:border-white/5"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <FlaskConical
                            size={12}
                            style={{ color: PRIMARY_COLOR }}
                          />
                          {testCount} Lab Test{testCount === 1 ? "" : "s"}
                          {con.totalPrice != null &&
                            ` (₦${con.totalPrice.toLocaleString()})`}
                        </span>
                      )}
                      {drugCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-black/5 dark:border-white/5"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <Pill size={12} style={{ color: PRIMARY_COLOR }} />
                          {drugCount} Prescription{drugCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {attachmentCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-black/5 dark:border-white/5"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <Paperclip
                            size={12}
                            style={{ color: PRIMARY_COLOR }}
                          />
                          {attachmentCount} Attachment
                          {attachmentCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= KANBAN VIEW (Non-Draggable) ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {["open", "completed"].map((columnStatus) => {
              const columnItems = filteredConsultations.filter(
                (item) => (item.consultation.status || "open") === columnStatus
              );

              return (
                <div
                  key={columnStatus}
                  className="rounded-[24px] p-4 space-y-4 border flex flex-col"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            columnStatus === "completed"
                              ? "#059669"
                              : "#3b82f6",
                        }}
                      />
                      {columnStatus} Consultations
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                      style={{
                        backgroundColor: ui.inner,
                        borderColor: ui.border,
                      }}
                    >
                      {columnItems.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {columnItems.length === 0 ? (
                      <p className="text-center text-xs opacity-40 py-8">
                        No {columnStatus} consultations found.
                      </p>
                    ) : (
                      columnItems.map((item, idx) => {
                        const con = item.consultation;
                        return (
                          <div
                            key={con._id || idx}
                            className="rounded-[18px] p-4 space-y-3 border transition hover:border-current/30"
                            style={{
                              backgroundColor: ui.inner,
                              borderColor: ui.border,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/dashboard/patients/${item.patientId}`}
                                className="text-xs font-bold hover:underline truncate"
                                style={{ color: PRIMARY_COLOR }}
                              >
                                {item.patientName}
                              </Link>
                              <span className="text-[10px] opacity-50 shrink-0">
                                {formatRecordedDate(con.consultedAt)}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold line-clamp-1">
                                {con.title}
                              </h4>
                              <p className="text-[11px] opacity-70 mt-1 line-clamp-2">
                                {con.complaint}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                              <span className="text-[10px] opacity-60 font-mono">
                                {item.patientMrn
                                  ? `MRN: ${item.patientMrn}`
                                  : "—"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/patients/${item.patientId}/consultations/${con._id}`
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                                style={{ color: PRIMARY_COLOR }}
                              >
                                View <ChevronRight size={10} />
                              </button>
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
        )}
      </div>
    </div>
  );
}
