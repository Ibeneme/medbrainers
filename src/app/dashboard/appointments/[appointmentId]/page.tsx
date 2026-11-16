"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  User,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchAppointmentById,
  checkInAppointment,
  cancelAppointment,
  markNoShow,
  rescheduleAppointment,
  clearActiveAppointment,
  type Appointment,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { ModuleShell, personLabel } from "@/components/dashboard/ModuleShell";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomPopupDatePicker } from "@/components/ui/items";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  checked_in: "#8b5cf6",
  in_progress: "#f59e0b",
  completed: "#10b981",
  cancelled: "#ef4444",
  no_show: "#64748b",
  rescheduled: "#06b6d4",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const appointmentId = String(params.appointmentId || "");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId } = useFacilityId();
  const { active, activeTicket, detailLoading, saving, error, message } =
    useAppSelector((s) => s.appointments);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  const load = () => {
    if (!facilityId || !appointmentId) return;
    dispatch(fetchAppointmentById({ facilityId, appointmentId }));
  };

  useEffect(() => {
    load();
    return () => {
      dispatch(clearActiveAppointment());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, appointmentId]);

  useEffect(() => {
    if (message) {
      setToast(message);
      setToastErr(false);
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      setToast(error);
      setToastErr(true);
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const a = active as Appointment | null;
  const statusColor = a ? STATUS_COLORS[a.status] || "#64748b" : "#64748b";

  const run = async (fn: () => Promise<any>) => {
    await fn();
    load();
  };

  const handleReschedule = async () => {
    if (!facilityId || !appointmentId || !rescheduleDate || !rescheduleTime)
      return;
    const datePart = rescheduleDate.includes("T")
      ? rescheduleDate.split("T")[0]
      : rescheduleDate;
    const startAt = new Date(`${datePart}T${rescheduleTime}:00`).toISOString();
    await dispatch(
      rescheduleAppointment({
        facilityId,
        appointmentId,
        payload: {
          startAt,
          reason: rescheduleReason.trim() || undefined,
        },
      })
    );
    setShowReschedule(false);
    load();
  };

  const inputStyle = {
    backgroundColor: ui.inner,
    borderColor: ui.border,
    color: ui.text,
  };

if (detailLoading && !a) {
    return (
      <ModuleShell
        title="Appointment"
        icon={CalendarCheck}
        loading
        loadingText="Loading appointment..."
      >
        <></>
      </ModuleShell>
    );
  }
  if (!a) {
    return (
      <ModuleShell title="Appointment" icon={CalendarCheck}>
        <div
          className="rounded-[28px] py-16 text-center"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <AlertTriangle size={32} className="mx-auto opacity-25 mb-3" />
          <p className="font-medium opacity-70">Appointment not found</p>
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 mt-4 text-sm underline"
            style={{ color: PRIMARY_COLOR }}
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      title={a.title || "Appointment"}
      subtitle={`${statusLabel(a.status)} · ${fmtDateTime(a.startAt)}`}
      icon={CalendarCheck}
      actions={
        <>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: ui.border, color: ui.text }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: ui.border, color: ui.text }}
          >
            <ArrowLeft size={14} />
            Back
          </Link>
        </>
      }
    >
      {toast && (
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            toastErr
              ? "bg-red-500/15 text-red-500"
              : "bg-emerald-500/15 text-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <section
            className="rounded-[28px] p-5 space-y-4"
            style={{
              backgroundColor: ui.card,
              border: `1px solid ${ui.border}`,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: `${statusColor}18`,
                  color: statusColor,
                }}
              >
                {statusLabel(a.status)}
              </span>
              {a.priority && a.priority !== "routine" && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: "#f59e0b18",
                    color: "#f59e0b",
                  }}
                >
                  {a.priority}
                </span>
              )}
              <span className="text-xs opacity-50 capitalize">
                {a.kind?.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                  Patient
                </p>
                <p className="font-medium">{personLabel(a.patient)}</p>
                {typeof a.patient === "object" && a.patient?.mrn && (
                  <p className="text-xs opacity-55">MRN {a.patient.mrn}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                  Department
                </p>
                <p className="font-medium">{a.departmentName || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                  Start
                </p>
                <p className="font-medium flex items-center gap-1.5">
                  <Clock size={14} className="opacity-50" />
                  {fmtDateTime(a.startAt)}
                </p>
              </div>
              {a.endAt && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                    End
                  </p>
                  <p className="font-medium">{fmtDateTime(a.endAt)}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                  Clinician
                </p>
                <p className="font-medium">{personLabel(a.clinician)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                  Created by
                </p>
                <p className="font-medium">{personLabel(a.createdBy)}</p>
              </div>
            </div>

            {(a.reason || a.notes) && (
              <div
                className="pt-2 border-t space-y-2"
                style={{ borderColor: ui.border }}
              >
                {a.reason && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                      Reason
                    </p>
                    <p className="text-sm">{a.reason}</p>
                  </div>
                )}
                {a.notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-45 mb-1">
                      Notes
                    </p>
                    <p className="text-sm opacity-80">{a.notes}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {a.activityLog && a.activityLog.length > 0 && (
            <section
              className="rounded-[28px] p-5 space-y-3"
              style={{
                backgroundColor: ui.card,
                border: `1px solid ${ui.border}`,
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">
                Activity
              </h3>
              <ul className="space-y-2">
                {[...a.activityLog].reverse().map((entry, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-xs opacity-40 whitespace-nowrap pt-0.5">
                      {fmtDateTime(entry.at)}
                    </span>
                    <div>
                      <span className="font-medium">{entry.action}</span>
                      {entry.message && (
                        <span className="opacity-60"> — {entry.message}</span>
                      )}
                      {entry.by && (
                        <span className="text-xs opacity-45 ml-1">
                          by {personLabel(entry.by)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section
            className="rounded-[28px] p-5 space-y-2"
            style={{
              backgroundColor: ui.card,
              border: `1px solid ${ui.border}`,
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3">
              Actions
            </h3>

            {a.status === "scheduled" && (
              <button
                disabled={saving}
                onClick={() =>
                  run(() =>
                    dispatch(
                      checkInAppointment({ facilityId, appointmentId })
                    ) as any
                  )
                }
                className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <User size={16} />
                Check in
              </button>
            )}

            {["scheduled", "checked_in"].includes(a.status) && (
              <>
                <button
                  disabled={saving}
                  onClick={() => setShowReschedule(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium disabled:opacity-40"
                  style={{ borderColor: ui.border }}
                >
                  <Calendar size={16} />
                  Reschedule
                </button>
                <button
                  disabled={saving}
                  onClick={() => {
                    if (window.confirm("Mark this appointment as no-show?")) {
                      run(() =>
                        dispatch(
                          markNoShow({ facilityId, appointmentId })
                        ) as any
                      );
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium disabled:opacity-40"
                  style={{ borderColor: ui.border }}
                >
                  <AlertTriangle size={16} />
                  Mark no-show
                </button>
                <button
                  disabled={saving}
                  onClick={() => {
                    const reason =
                      window.prompt("Cancel reason (optional):") || undefined;
                    run(() =>
                      dispatch(
                        cancelAppointment({
                          facilityId,
                          appointmentId,
                          reason,
                        })
                      ) as any
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium text-red-500 disabled:opacity-40"
                  style={{ borderColor: ui.border }}
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </>
            )}

            {a.status === "completed" && (
              <p className="text-xs opacity-50 text-center py-2 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Completed {a.completedAt ? fmtDateTime(a.completedAt) : ""}
              </p>
            )}

            {a.status === "cancelled" && (
              <p className="text-xs opacity-50 text-center py-2">
                Cancelled
                {a.cancelReason ? `: ${a.cancelReason}` : ""}
              </p>
            )}

            {typeof a.patient === "object" && a.patient?._id && (
              <Link
                href={`/dashboard/patients/${a.patient._id}`}
                className="block w-full text-center rounded-2xl border px-4 py-2.5 text-sm font-medium mt-2"
                style={{ borderColor: ui.border }}
              >
                View patient
              </Link>
            )}

            <Link
              href="/dashboard/appointments/queue"
              className="block w-full text-center rounded-2xl border px-4 py-2.5 text-sm font-medium"
              style={{ borderColor: ui.border }}
            >
              Open queue
            </Link>
          </section>

          {activeTicket && (
            <section
              className="rounded-[28px] p-5 space-y-2"
              style={{
                backgroundColor: ui.card,
                border: `1px solid ${ui.border}`,
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">
                Queue ticket
              </h3>
              <p className="text-2xl font-bold">#{activeTicket.ticketNumber}</p>
              <p className="text-xs opacity-55 capitalize">
                {activeTicket.status?.replace(/_/g, " ")}
                {activeTicket.position != null
                  ? ` · position ${activeTicket.position}`
                  : ""}
              </p>
            </section>
          )}
        </div>
      </div>

      {showReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md rounded-[28px] p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <h3 className="text-lg font-semibold">Reschedule appointment</h3>
            <div>
              <label className="block text-xs opacity-60 mb-1.5">
                New date
              </label>
              <CustomPopupDatePicker
                value={rescheduleDate}
                onChange={setRescheduleDate}
              />
            </div>
            <div>
              <label className="block text-xs opacity-60 mb-1.5">
                New time
              </label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs opacity-60 mb-1.5">
                Reason (optional)
              </label>
              <input
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="Why rescheduling?"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                disabled={saving || !rescheduleDate || !rescheduleTime}
                onClick={handleReschedule}
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                onClick={() => setShowReschedule(false)}
                className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
                style={{ borderColor: ui.border }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
