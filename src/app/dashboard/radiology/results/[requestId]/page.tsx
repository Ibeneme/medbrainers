"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  FileText,
  RefreshCw,
  ScanLine,
  Stethoscope,
  User,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import InstancesGallery from "@/components/ui/ImageViewer";

import { Can } from "@/components/access/can";
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

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

export default function RadiologyResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) || "";

  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const {
    currentResultDetail,
    detailLoading,
    loadResultDetail,
    clearResultDetail,
    hasFacility,
  } = useRadiology();

  useEffect(() => {
    if (requestId && hasFacility) {
      loadResultDetail(requestId);
    }
    return () => {
      clearResultDetail();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, hasFacility]);

  if (!hasFacility) {
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );
  }

  const request = currentResultDetail?.request;
  const study = currentResultDetail?.study;
  const report = currentResultDetail?.report;

  const patient =
    request && typeof request.patient === "object" ? request.patient : null;
  const fullName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Unknown patient";
  const age = ageOf(patient?.dateOfBirth);

  const enteredBy =
    request?.result?.enteredBy && typeof request.result.enteredBy === "object"
      ? `${request.result.enteredBy.firstName || ""} ${
          request.result.enteredBy.lastName || ""
        }`.trim()
      : "";

  const radiologist =
    request?.assignedRadiologist &&
    typeof request.assignedRadiologist === "object"
      ? `${request.assignedRadiologist.firstName || ""} ${
          request.assignedRadiologist.lastName || ""
        }`.trim()
      : "";

  const statusLabel = cap(request?.status?.replace(/_/g, " ") || "unknown");

  return (
    <div className="mx-auto max-w-5xl w-full relative">
      {detailLoading && (
        <DarkBlurOverlayLoader text="Loading result detail..." />
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
          <div className="flex items-center gap-3.5 min-w-0">
            <Can path={"/dashboard/radiology/results"}><button
              type="button"
              onClick={() => router.push("/dashboard/radiology/results")}
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 border transition hover:opacity-80"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <ArrowLeft size={18} />
            </button></Can>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <FileText size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                {request?.procedureName || "Result detail"}
              </h1>
              <p className="text-xs opacity-60 mt-0.5 font-mono">
                {request?.accessionNumber || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => requestId && loadResultDetail(requestId)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition hover:opacity-90 border"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.border,
                color: ui.text,
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {requestId && (
              <Link
                href={`/dashboard/radiology/requests/${requestId}`}
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                View order
              </Link>
            )}
          </div>
        </div>

        {!request && !detailLoading && (
          <div
            className="rounded-[24px] p-12 text-center space-y-2 border"
            style={{ borderColor: ui.border, backgroundColor: ui.card }}
          >
            <p className="text-sm font-semibold">Result not found</p>
            <p className="text-xs opacity-60">
              This result may have been removed or you don’t have access.
            </p>
          </div>
        )}

        {request && (
          <div className="space-y-4">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold"
                style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
              >
                <ScanLine size={13} />
                {cap(request.modality)}
              </span>
              {request.procedureCode && <Badge label={request.procedureCode} />}
              <Badge label={statusLabel} />
              {request.priority && <Badge label={cap(request.priority)} />}
            </div>

            {/* Patient + procedure cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <div
                className="rounded-[22px] p-5 border space-y-3"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Patient
                </p>
                <p className="text-base font-bold">{fullName}</p>
                <div className="text-xs opacity-70 space-y-1">
                  <p>MRN {patient?.mrn || "N/A"}</p>
                  <p>
                    {[cap(patient?.gender), age].filter(Boolean).join(" • ") ||
                      "—"}
                  </p>
                </div>
              </div>

              <div
                className="rounded-[22px] p-5 border space-y-3"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Procedure
                </p>
                <p className="text-base font-bold">
                  {request.procedureName || "—"}
                </p>
                <div className="text-xs opacity-70 space-y-1">
                  <p>
                    {request.bodyPart}
                    {request.laterality && request.laterality !== "na"
                      ? ` • ${cap(request.laterality)}`
                      : ""}
                  </p>
                  <p className="line-clamp-2">
                    {request.clinicalIndication || "No indication recorded"}
                  </p>
                </div>
              </div>
            </div>

            {/* Final result */}
            <div
              className="rounded-[22px] p-5 border space-y-3"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} style={{ color: PRIMARY_COLOR }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Final result
                </p>
              </div>
              <div
                className="rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ backgroundColor: ui.inner }}
              >
                {request.result?.finalResult || "No final result entered."}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] opacity-60 pt-1">
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
                  {formatWhen(
                    request.result?.enteredAt || request.result?.updatedAt
                  )}
                </span>
              </div>
            </div>

            {study && study.instances && (
              <InstancesGallery instances={study.instances} ui={ui} />
            )}

            {/* Report summary */}
            {report && (
              <div
                className="rounded-[22px] p-5 border space-y-3"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: PRIMARY_COLOR }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                    Report
                  </p>
                  <Badge label={cap(report.status)} />
                </div>
                {report.impression && (
                  <div>
                    <p className="text-[10px] font-semibold opacity-50 mb-1">
                      Impression
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {report.impression}
                    </p>
                  </div>
                )}
                {report.findings && (
                  <div>
                    <p className="text-[10px] font-semibold opacity-50 mb-1">
                      Findings
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                      {report.findings}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}