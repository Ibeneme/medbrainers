"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Search,
  Plus,
  ShieldCheck,
  Thermometer,
  Wind,
  Heart,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchPatients, fetchCompanyVitals } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";
import { UserAvatar, CustomPopupDatePicker } from "@/components/ui/items";
import { VitalTile } from "@/components/ui/VitalTile";
import { formatRecordedDate } from "@/utils/dateUtils";

import { Can } from "@/components/access/can";
/* -------------------------------------------------------------------------- */
/*  Helpers & ranges                                                          */
/* -------------------------------------------------------------------------- */
type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const NORMAL: Record<string, [number, number]> = {
  temperatureC: [36.1, 37.5],
  spo2: [95, 100],
  pulseBpm: [60, 100],
  pulse: [60, 100],
  bpSystolic: [90, 120],
  bpDiastolic: [60, 80],
};

const isOut = (key: string, value: number | null | undefined) => {
  if (value == null) return false;
  const range = NORMAL[key];
  if (!range) return false;
  return value < range[0] || value > range[1];
};

const fmt = (v: any, unit: string) => (v != null ? `${v}${unit}` : "—");
const pulseOf = (v: any) => v?.pulseBpm ?? v?.pulse ?? null;

const reasonsOf = (v: any): string[] => {
  if (Array.isArray(v?.alertReasons) && v.alertReasons.length > 0) {
    return v.alertReasons;
  }
  if (v?.alertReason) {
    return String(v.alertReason)
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper to get local YYYY-MM-DD for today's default comparison
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CompanyVitalsDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, facilitiesLoading } = useFacilityId();

  const { companyVitals = [], companyVitalsLoading = false } = useAppSelector(
    (s: any) => s.patients || { companyVitals: [], companyVitalsLoading: false }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [alertOnlyToggle, setAlertOnlyToggle] = useState(false);

  // Date filter: Default to today's date (YYYY-MM-DD format)
  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayDateString()
  );

  useEffect(() => {
    if (!facilityId) return;
    dispatch(
      fetchCompanyVitals({
        facilityId,
        alertOnly: alertOnlyToggle ? true : undefined,
      })
    );
    dispatch(fetchPatients({ facilityId, limit: 200 }));
  }, [dispatch, facilityId, alertOnlyToggle]);

  const filteredVitals = useMemo(() => {
    if (!companyVitals) return [];

    return companyVitals.filter((item: any) => {
      const v = item.vital || {};

      // Date filtering logic
      if (selectedDate) {
        const recordedAtRaw = v.recordedAt || item.createdAt;
        if (!recordedAtRaw) return false;
        const recordDateStr = new Date(recordedAtRaw)
          .toISOString()
          .split("T")[0];
        const filterDateStr = selectedDate.split("T")[0];
        if (recordDateStr !== filterDateStr) return false;
      }

      // Search query filtering logic
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (item.patientName || "").toLowerCase();
        const mrn = (item.patientMrn || "").toLowerCase();
        const reasons = reasonsOf(v).join(" ").toLowerCase();

        if (!name.includes(q) && !mrn.includes(q) && !reasons.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [companyVitals, searchQuery, selectedDate]);

  if (facilitiesLoading && !facilityId) {
    return <DarkBlurOverlayLoader text="Loading facility..." />;
  }

  return (
    <div className="mx-auto max-w-6xl ">
      <div
        className="space-y-6"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {companyVitalsLoading && companyVitals.length === 0 && (
          <DarkBlurOverlayLoader text="Loading company vitals..." />
        )}

        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs opacity-60 mb-1">
              <Link href="/dashboard" className="hover:opacity-100">
                Dashboard
              </Link>

              <ChevronRight size={12} />
              <span className="font-semibold">All Vitals</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
              Patient Vitals & Monitoring
            </h1>
            <p className="text-xs opacity-60 mt-1">
              Showing{" "}
              <span className="font-semibold">{filteredVitals.length}</span> of{" "}
              {companyVitals.length} total vital records
            </p>
          </div>
          <Can path={"/dashboard/consultations/patients?type=vitals"}><button
            type="button"
            onClick={() =>
              router.push("/dashboard/consultations/patients?type=vitals")
            }
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 "
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={15} /> Record Vital
          </button></Can>
        </div>

        {/* Search, Date Picker & Toggle Filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div
              className="md:col-span-2 flex items-center gap-3 rounded-[22px] px-4 py-2.5 border"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              <Search size={16} className="opacity-40 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, MRN, or alert reason..."
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
                  border={border}
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
                    borderColor: border,
                    color: ui.text,
                  }}
                  title="Clear date filter"
                >
                  <X size={14} /> All Dates
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAlertOnlyToggle(false)}
                className="rounded-full px-4 py-2 text-xs font-semibold transition"
                style={{
                  backgroundColor: !alertOnlyToggle ? PRIMARY_COLOR : ui.card,
                  color: !alertOnlyToggle ? "#fff" : ui.text,
                }}
              >
                All Vitals
              </button>
              <button
                type="button"
                onClick={() => setAlertOnlyToggle(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition"
                style={{
                  backgroundColor: alertOnlyToggle ? PRIMARY_COLOR : ui.card,
                  color: alertOnlyToggle ? "#fff" : ui.text,
                }}
              >
                <AlertTriangle size={13} /> Alerts Only
              </button>
            </div>

            {selectedDate && (
              <span className="text-xs font-medium opacity-60">
                Filtered for date:{" "}
                <strong className="font-bold">{selectedDate}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVitals.length === 0 ? (
            <div
              className="rounded-[28px] p-12 text-center text-xs opacity-60 lg:col-span-2 border"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              No vital records match your current filters for{" "}
              {selectedDate ? `date ${selectedDate}` : "selected criteria"}. Try
              selecting "All Dates" or adjusting your search query.
            </div>
          ) : (
            filteredVitals.map((item: any) => {
              const v = item.vital || {};
              const pulse = pulseOf(v);
              const reasons = reasonsOf(v);
              const bpOut =
                isOut("bpSystolic", v.bpSystolic) ||
                isOut("bpDiastolic", v.bpDiastolic);

              return (
                <div
                  key={v._id || `${item.patientId}-${v.recordedAt}`}
                  onClick={() =>
                    router.push(`/dashboard/patients/${item.patientId}`)
                  }
                  className="rounded-[28px] p-5 space-y-4 cursor-pointer transition hover:opacity-95 border"
                  style={{ backgroundColor: ui.card, borderColor: border }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={{ firstName: item.patientName, lastName: "" }}
                        size="md"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/patients/${item.patientId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate text-sm font-semibold hover:underline"
                        >
                          {item.patientName || "Unknown Patient"}
                        </Link>
                        <p className="text-[11px] opacity-55">
                          MRN: {item.patientMrn || "N/A"}
                        </p>
                      </div>
                    </div>
                    {v.alert ? (
                      <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-500">
                        Alert
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                        <ShieldCheck size={11} /> Normal
                      </span>
                    )}
                  </div>

                  <p className="text-xs opacity-60">
                    Recorded: {formatRecordedDate(v.recordedAt)}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <VitalTile
                      label="Temp"
                      value={fmt(v.temperatureC, "°C")}
                      icon={Thermometer}
                      color="#f97316"
                      out={isOut("temperatureC", v.temperatureC)}
                      ui={ui}
                    />
                    <VitalTile
                      label="SpO2"
                      value={fmt(v.spo2, "%")}
                      icon={Wind}
                      color="#3b82f6"
                      out={isOut("spo2", v.spo2)}
                      ui={ui}
                    />
                    <VitalTile
                      label="Pulse"
                      value={fmt(pulse, " bpm")}
                      icon={Heart}
                      color="#ec4899"
                      out={isOut("pulseBpm", pulse)}
                      ui={ui}
                    />
                    <VitalTile
                      label="BP"
                      value={
                        v.bpSystolic != null
                          ? `${v.bpSystolic}/${v.bpDiastolic ?? "—"}`
                          : "—"
                      }
                      icon={Activity}
                      color="#10b981"
                      out={bpOut}
                      ui={ui}
                    />
                  </div>

                  {reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {reasons.map((reason: string) => (
                        <span
                          key={reason}
                          className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-red-500 bg-red-500/10"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/dashboard/patients/${item.patientId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold hover:underline"
                      style={{ color: PRIMARY_COLOR }}
                    >
                      View Patient File <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
