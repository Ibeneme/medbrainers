"use client";

import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import Link from "next/link";
import { fetchLabRequests } from "@/api";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  FileText,
  Loader2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  CheckCircle2,
  Calendar,
  X,
} from "lucide-react";

/** Formats date into "24th April 2026, Wednesday 09:43AM GMT +1" format */
export const formatRecordedDate = (dateString?: string | Date) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  const day = date.getDate();
  const getOrdinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const weekday = weekdays[date.getDay()];

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours.toString().padStart(2, "0");

  return `${day}${getOrdinalSuffix(
    day
  )} ${monthName} ${year}, ${weekday} ${formattedHours}:${minutes}${ampm} GMT +1`;
};

export function CustomPopupDatePicker({
  label,
  value,
  onChange,
  border,
  colors,
  isDark,
  placeholder = "Select date & time...",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  border: string;
  colors: any;
  isDark: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleSelectDay = (day: number) => {
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const existingTime = value.includes("T") ? value.split("T")[1] : "08:00";
    onChange(`${currentYear}-${mStr}-${dStr}T${existingTime}`);
    setIsOpen(false);
  };

  const formattedDisplayValue = value ? formatRecordedDate(value) : placeholder;

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition text-left shadow-none"
        style={{
          backgroundColor: colors.shadeBgSecond,
          borderColor: border,
          color: colors.text,
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar size={15} className="opacity-50 shrink-0" />
          <span
            className={
              value
                ? "font-medium text-xs truncate"
                : "text-xs opacity-40 truncate"
            }
          >
            {formattedDisplayValue}
          </span>
        </div>
        <ChevronDown size={14} className="opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-[9999] mt-1.5 w-72 rounded-2xl border p-4 shadow-2xl ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((y) => y - 1);
                } else {
                  setCurrentMonth((m) => m - 1);
                }
              }}
              className="rounded-lg p-1.5 hover:opacity-80 border shadow-none"
              style={{ borderColor: border }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((y) => y + 1);
                } else {
                  setCurrentMonth((m) => m + 1);
                }
              }}
              className="rounded-lg p-1.5 hover:opacity-80 border shadow-none"
              style={{ borderColor: border }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold opacity-50 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mStr = String(currentMonth + 1).padStart(2, "0");
              const dStr = String(day).padStart(2, "0");
              const dateStr = `${currentYear}-${mStr}-${dStr}`;
              const isSelected = value.startsWith(dateStr);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl font-semibold transition hover:opacity-80 mx-auto shadow-none"
                  style={{
                    backgroundColor: isSelected ? PRIMARY_COLOR : "transparent",
                    color: isSelected ? "#fff" : colors.text,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomPopupDateRangeDropdown({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  border,
  colors,
  isDark,
  placeholder = "Filter by date range...",
}: {
  label?: string;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  border: string;
  colors: any;
  isDark: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayLabel =
    startDate || endDate
      ? `${
          startDate ? formatRecordedDate(startDate).split(",")[0] : "Start"
        } — ${endDate ? formatRecordedDate(endDate).split(",")[0] : "End"}`
      : placeholder;

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition text-left shadow-none"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          borderColor: border,
          color: colors.text,
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar size={15} className="opacity-50 shrink-0" />
          <span
            className={
              startDate || endDate
                ? "font-medium text-xs truncate"
                : "text-xs opacity-40 truncate"
            }
          >
            {displayLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(startDate || endDate) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onStartDateChange("");
                onEndDateChange("");
              }}
              className="rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/15 transition"
              title="Clear date filter"
            >
              <X size={12} className="opacity-60" />
            </span>
          )}
          <ChevronDown size={14} className="opacity-50" />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-[9999] mt-1.5 w-80 rounded-2xl border p-4 shadow-2xl space-y-4 ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          <div className="space-y-3">
            <CustomPopupDatePicker
              label="From Date"
              value={startDate}
              onChange={onStartDateChange}
              border={border}
              colors={colors}
              isDark={isDark}
              placeholder="Start date..."
            />
            <CustomPopupDatePicker
              label="To Date"
              value={endDate}
              onChange={onEndDateChange}
              border={border}
              colors={colors}
              isDark={isDark}
              placeholder="End date..."
            />
          </div>
          <div
            className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: border }}
          >
            <button
              type="button"
              onClick={() => {
                onStartDateChange("");
                onEndDateChange("");
              }}
              className="text-xs font-semibold opacity-70 hover:opacity-100 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 shadow-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsVerificationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { facilityId } = useFacilityId();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const hairline = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  const ui = {
    isDark,
    page: colors.bg,
    card: colors.shadeBg,
    inner: colors.shadeBgSecond,
    text: colors.text,
    border,
  };

  const { requests, listLoading } = useSelector(
    (state: RootState) => state.labs
  );

  useEffect(() => {
    if (facilityId) {
      dispatch(fetchLabRequests({ facilityId }));
    }
  }, [dispatch, facilityId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilter(searchInput.trim());
  };

  // Filter requests that contain completed or verified tests
  const completedRequests = requests.filter((req) => {
    const hasCompletedTest = req.tests?.some(
      (t) => t.status === "resulted" || t.status === "verified"
    );
    return (
      hasCompletedTest || req.status === "resulted" || req.status === "verified"
    );
  });

  // Filter based on active search query and date range
  const filteredRequests = completedRequests.filter((req) => {
    if (!activeFilter && !startDateFilter && !endDateFilter) return false; // Display nothing until user searches or filters

    const query = activeFilter.toLowerCase();
    const matchesSearch =
      !query ||
      (() => {
        const matchesSpecimen =
          (req as any).specimens?.some((s: any) =>
            s.barcode?.toLowerCase().includes(query)
          ) ||
          (req as any).specimenCode?.toLowerCase().includes(query) ||
          (req as any).barcode?.toLowerCase().includes(query) ||
          req.specimenIds?.some((id: string) =>
            id.toLowerCase().includes(query)
          );

        const patient =
          typeof req.patient === "object" && req.patient !== null
            ? req.patient
            : null;
        const patientName = patient
          ? `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase()
          : "";
        const mrn = patient?.mrn?.toLowerCase() || "";

        return (
          matchesSpecimen || patientName.includes(query) || mrn.includes(query)
        );
      })();

    const reqDate = new Date(req.orderedAt).getTime();
    const matchesStartDate =
      !startDateFilter || reqDate >= new Date(startDateFilter).getTime();
    const matchesEndDate =
      !endDateFilter || reqDate <= new Date(endDateFilter).getTime();

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "verified":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#059669" };
      case "resulted":
      case "processing":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" };
      default:
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
    }
  };

  if (listLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2
          className="animate-spin h-6 w-6"
          style={{ color: PRIMARY_COLOR }}
        />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-5xl px-3 sm:px-6 py-6 space-y-6"
      style={{ color: ui.text }}
    >
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <Link href="/dashboard/labs" className="hover:opacity-100 transition">
          Laboratory
        </Link>
        <ChevronRight size={12} />
        <Link
          href="/dashboard/labs/requests"
          className="hover:opacity-100 transition"
        >
          Patient Requests
        </Link>
        <ChevronRight size={12} />
        <span>Results Verification</span>
      </div>

      <div
        className="rounded-3xl border p-6 sm:p-8 space-y-4"
        style={{ backgroundColor: ui.card, borderColor: hairline }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{
              backgroundColor: `${PRIMARY_COLOR}15`,
              color: PRIMARY_COLOR,
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold">
              Results Verification
            </h1>
            <p className="text-xs opacity-60">
              Search and filter completed, resulted, and verified lab test
              records.
            </p>
          </div>
        </div>

        {/* Search & Date Filter Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2 flex items-center">
              <Search size={16} className="absolute left-4 opacity-40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter specimen code, barcode, MRN, or patient name..."
                className="w-full rounded-2xl pl-11 pr-4 py-3 text-xs outline-none border transition uppercase"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: border,
                }}
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 shrink-0"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Search size={14} />
              Search Records
            </button>
          </div>

          <div className="pt-1">
            <CustomPopupDateRangeDropdown
              label="Filter by Date Range"
              startDate={startDateFilter}
              endDate={endDateFilter}
              onStartDateChange={setStartDateFilter}
              onEndDateChange={setEndDateFilter}
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>

          <p className="text-[11px] opacity-50 px-1">
            Hint: Type a search keyword or select a date range, then click
            search.
          </p>
        </form>
      </div>

      <div className="space-y-4">
        {!activeFilter && !startDateFilter && !endDateFilter ? (
          <div
            className="rounded-3xl border p-12 text-center text-xs opacity-50 space-y-2"
            style={{ backgroundColor: ui.card, borderColor: hairline }}
          >
            <Search size={28} className="mx-auto opacity-30 mb-1" />
            <p className="font-semibold text-sm">
              Please search or filter to view records
            </p>
            <p>
              Enter a specimen code, MRN, patient name, or select a date range
              above to display results.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div
            className="rounded-3xl border p-8 text-center text-xs opacity-50"
            style={{ backgroundColor: ui.card, borderColor: hairline }}
          >
            None found matching your search or date criteria.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const patient =
              typeof req.patient === "object" && req.patient !== null
                ? req.patient
                : null;
            const patientName = patient
              ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
              : "Patient Record";

            return (
              <div
                key={req._id}
                className="rounded-3xl border p-6 space-y-5 transition"
                style={{ backgroundColor: ui.card, borderColor: hairline }}
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
                  style={{ borderColor: hairline }}
                >
                  <div>
                    <h3 className="text-sm font-bold capitalize">
                      {patientName}
                    </h3>
                    <p className="text-[11px] opacity-50">
                      MRN: {patient?.mrn || "N/A"} · Ordered:{" "}
                      {formatRecordedDate(req.orderedAt)}
                    </p>
                  </div>
                  <div>
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: getStatusBadgeStyle(req.status).bg,
                        color: getStatusBadgeStyle(req.status).color,
                        borderColor: border,
                      }}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold opacity-75">
                    Tested Items & Metadata
                  </h4>
                  <div className="space-y-3">
                    {req.tests.map((test, tIdx) => {
                      const badgeStyle = getStatusBadgeStyle(test.status);
                      return (
                        <div
                          key={test._id || tIdx}
                          className="rounded-2xl p-4 border space-y-3"
                          style={{
                            backgroundColor: ui.inner,
                            borderColor: hairline,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  backgroundColor: `${PRIMARY_COLOR}1a`,
                                  color: PRIMARY_COLOR,
                                }}
                              >
                                {test.code}
                              </span>
                              <span className="text-xs font-semibold">
                                {test.name}
                              </span>
                            </div>
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border"
                              style={{
                                backgroundColor: badgeStyle.bg,
                                color: badgeStyle.color,
                                borderColor: border,
                              }}
                            >
                              {test.status.replace("_", " ")}
                            </span>
                          </div>

                          {test.metadata && test.metadata.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                              {test.metadata.map((m: any, mIdx: number) => (
                                <div
                                  key={m._id || mIdx}
                                  className="rounded-xl p-3 border flex items-center justify-between"
                                  style={{
                                    backgroundColor: ui.card,
                                    borderColor: border,
                                  }}
                                >
                                  <span className="text-[11px] opacity-60 uppercase">
                                    {m.key}
                                  </span>
                                  <strong
                                    className="text-xs"
                                    style={{ color: ui.text }}
                                  >
                                    {m.value}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          )}

                          {test.resultFiles && test.resultFiles.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <p className="text-[11px] font-semibold opacity-60">
                                Result Scans / Attachments
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {test.resultFiles.map(
                                  (file: any, fIdx: number) => (
                                    <div
                                      key={file._id || fIdx}
                                      className="flex items-center justify-between gap-3 rounded-xl p-3 border"
                                      style={{
                                        backgroundColor: ui.card,
                                        borderColor: border,
                                      }}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                          style={{
                                            backgroundColor: `${PRIMARY_COLOR}15`,
                                            color: PRIMARY_COLOR,
                                          }}
                                        >
                                          <FileText size={14} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold truncate">
                                            {file.name}
                                          </p>
                                          <p className="text-[10px] opacity-50">
                                            {(file.size
                                              ? (file.size / 1024).toFixed(1)
                                              : "0") + " KB"}
                                          </p>
                                        </div>
                                      </div>
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:opacity-75 transition shrink-0"
                                        style={{ backgroundColor: ui.inner }}
                                        title="View file"
                                      >
                                        <ExternalLink size={13} />
                                      </a>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
