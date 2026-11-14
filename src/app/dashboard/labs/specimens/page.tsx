"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import Link from "@/components/access/guarded-link";
import {
  trackRequestBySpecimenCode,
  clearLabsError,
  clearActiveLabRequest,
} from "@/api";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Search,
  Loader2,
  CalendarDays,
  IdCard,
  Flag,
  Check,
  ChevronRight,
  Barcode,
} from "lucide-react";

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 opacity-40 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] opacity-50">{label}</p>
        <p className="text-sm font-semibold truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

export default function SpecimenTracker() {
  const dispatch = useDispatch<AppDispatch>();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { facilityId } = useFacilityId();

  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
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

  const { activeRequest, detailLoading, error, message } = useSelector(
    (state: RootState) => state.labs
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setHasSearched(true);
    // Clear previous search results and errors immediately
    dispatch(clearActiveLabRequest());
    dispatch(clearLabsError());

    dispatch(
      trackRequestBySpecimenCode({
        facilityId,
        specimenCode: barcodeInput.trim(),
      })
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "verified":
      case "received":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#059669" };
      case "resulted":
      case "processing":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" };
      case "collected":
      case "collecting_sample":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
      case "rejected":
      case "discarded":
      case "cancelled":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" };
      default:
        return { bg: ui.inner, color: ui.text };
    }
  };

  const patient =
    activeRequest &&
    typeof activeRequest.patient === "object" &&
    activeRequest.patient !== null
      ? activeRequest.patient
      : null;

  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Patient Record";

  const initials = patient
    ? `${(patient.firstName || "?")[0]}${
        (patient.lastName || "")[0] || ""
      }`.toUpperCase()
    : "PR";

  return (
    <div
      className="mx-auto max-w-4xl px-3 sm:px-6 py-6 space-y-6 relative"
      style={{ color: ui.text }}
    >
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <Link
          href="/dashboard/labs"
          className="hover:opacity-100 font-medium transition"
        >
          Laboratory
        </Link>
        <ChevronRight size={12} />
        <Link
          href="/dashboard/labs/requests"
          className="hover:opacity-100 font-medium transition"
        >
          Patient Requests
        </Link>
        <ChevronRight size={12} />
        <span className="font-semibold">Specimen Tracker</span>
      </div>

      <div
        className="relative overflow-hidden rounded-[32px] border p-6 sm:p-8 space-y-4"
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
            <Barcode size={24} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold">
              Specimen & Lab Request Tracker
            </h2>
            <p className="text-xs opacity-60">
              Enter or scan a specimen barcode to load full request and test
              details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-2">
          <div className="flex gap-3">
            <div className="relative flex-1 flex items-center">
              <Search size={16} className="absolute left-4 opacity-40" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="ENTER SPECIMEN BARCODE..."
                className="w-full rounded-2xl pl-11 pr-4 py-3 text-xs outline-none border transition uppercase "
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: border,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={detailLoading || !barcodeInput.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {detailLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              Track Specimen
            </button>
          </div>
          <div className="flex items-center gap-2 px-1 pt-1">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
                color: PRIMARY_COLOR,
              }}
            >
              HINT
            </span>
            <span className="text-[11px] opacity-50">
              Enter a valid specimen barcode (e.g. SPECIMEN-MED-AA0001) and
              click track to load details.
            </span>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-500 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => dispatch(clearLabsError())}
              className="font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={() => dispatch(clearLabsError())}
              className="font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {hasSearched && !activeRequest && !detailLoading && (
        <div
          className="rounded-[28px] border p-8 text-center text-xs opacity-50"
          style={{ backgroundColor: ui.card, borderColor: hairline }}
        >
          None found
        </div>
      )}

      {activeRequest && (
        <div className="space-y-6">
          <div
            className="relative overflow-hidden rounded-[32px] border p-6 sm:p-8 space-y-6"
            style={{ backgroundColor: ui.card, borderColor: hairline }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-[24px] text-xl sm:text-2xl font-bold text-white"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {initials}
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold truncate capitalize">
                    {patientName}
                  </h3>
                  <div>
                    <span
                      className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: getStatusBadgeStyle(
                          activeRequest.status
                        ).bg,
                        color: getStatusBadgeStyle(activeRequest.status).color,
                        borderColor: border,
                      }}
                    >
                      Status: {activeRequest.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col gap-2 rounded-2xl p-4 border shrink-0 min-w-[240px]"
                style={{ backgroundColor: ui.inner, borderColor: hairline }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">
                  Priority: {activeRequest.priority}
                </span>
                <p className="text-xs opacity-70">
                  Ordered At:{" "}
                  {new Date(activeRequest.orderedAt).toLocaleString()}
                </p>
                {activeRequest.clinicalNotes && (
                  <p className="text-xs opacity-60">
                    Notes: {activeRequest.clinicalNotes}
                  </p>
                )}
              </div>
            </div>

            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl p-4 sm:p-5 border"
              style={{ backgroundColor: ui.inner, borderColor: hairline }}
            >
              <InfoItem
                icon={<IdCard size={15} />}
                label="MRN"
                value={patient?.mrn || "N/A"}
              />
              <InfoItem
                icon={<Check size={15} />}
                label="Phone"
                value={patient?.phone || "N/A"}
              />
              <InfoItem
                icon={<CalendarDays size={15} />}
                label="Tests Count"
                value={activeRequest.tests?.length || 0}
              />
              <InfoItem
                icon={<Flag size={15} />}
                label="Priority"
                value={activeRequest.priority || "routine"}
              />
            </div>
          </div>

          <div
            className="rounded-[28px] border p-6 space-y-4"
            style={{ backgroundColor: ui.card, borderColor: hairline }}
          >
            <h3 className="text-sm font-bold">
              Linked Specimens & Transit Status
            </h3>

            {(activeRequest as any).specimens &&
            (activeRequest as any).specimens.length > 0 ? (
              <div className="space-y-3">
                {(activeRequest as any).specimens.map((specimen: any) => {
                  const badgeStyle = getStatusBadgeStyle(specimen.status);
                  return (
                    <div
                      key={specimen._id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl p-4 border gap-4"
                      style={{
                        backgroundColor: ui.inner,
                        borderColor: hairline,
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className=" font-bold text-xs"
                            style={{ color: PRIMARY_COLOR }}
                          >
                            {specimen.barcode}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border"
                            style={{
                              backgroundColor: badgeStyle.bg,
                              color: badgeStyle.color,
                              borderColor: border,
                            }}
                          >
                            {specimen.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs opacity-60">
                          Type:{" "}
                          <span
                            className="font-semibold"
                            style={{ color: ui.text }}
                          >
                            {specimen.specimenType}
                          </span>
                        </p>
                        {specimen.storageLocation && (
                          <p className="text-xs opacity-60">
                            Storage: {specimen.storageLocation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs opacity-50">
                No specific specimen records found bound to this barcode.
              </p>
            )}
          </div>

          <div
            className="rounded-[28px] border p-6 space-y-4"
            style={{ backgroundColor: ui.card, borderColor: hairline }}
          >
            <h3 className="text-sm font-bold">Test Items & Results</h3>
            <div className="divide-y" style={{ borderColor: hairline }}>
              {activeRequest.tests.map((test, index) => {
                const badgeStyle = getStatusBadgeStyle(test.status);
                return (
                  <div
                    key={test._id || index}
                    className="py-4 first:pt-0 last:pb-0 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px]  opacity-50">
                          {test.code}
                        </span>
                        <h4 className="text-xs font-semibold">{test.name}</h4>
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

                    {test.resultValue && (
                      <div
                        className="rounded-2xl p-3 text-xs flex gap-6 border"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: hairline,
                        }}
                      >
                        <div>
                          <span className="text-[10px] opacity-50 block">
                            Result Value
                          </span>
                          <strong style={{ color: ui.text }}>
                            {test.resultValue} {test.resultUnit}
                          </strong>
                        </div>
                        {test.referenceRange && (
                          <div>
                            <span className="text-[10px] opacity-50 block">
                              Reference Range
                            </span>
                            <span className="opacity-80">
                              {test.referenceRange}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
