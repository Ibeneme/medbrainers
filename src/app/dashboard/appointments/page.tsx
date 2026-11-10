"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Plus,
  Search,
  User,
  XCircle,
  RefreshCw,
  ListTodo,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchAppointments,
  fetchMyDay,
  checkInAppointment,
  cancelAppointment,
  fetchDepartments,
  type Appointment,
  type AppointmentStatus,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { ModuleShell, personLabel } from "@/components/dashboard/ModuleShell";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomPopupDatePicker, CustomDropdown } from "@/components/ui/items";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  checked_in: "#8b5cf6",
  in_progress: "#f59e0b",
  completed: "#10b981",
  cancelled: "#ef4444",
  no_show: "#64748b",
  rescheduled: "#06b6d4",
};

const PRIORITY_COLORS: Record<string, string> = {
  routine: "#64748b",
  urgent: "#f59e0b",
  emergency: "#ef4444",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function fmtDateShort(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AppointmentsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, departments } = useFacilityId();
  const { list, listMeta, listLoading, saving, error, message } =
    useAppSelector((s) => s.appointments);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  const load = () => {
    if (!facilityId) return;
    const params: any = {
      facilityId,
      scope,
      page: 1,
      limit: 100,
    };
    if (statusFilter !== "all") params.status = [statusFilter];
    if (selectedDate)
      params.date = selectedDate.includes("T")
        ? selectedDate.split("T")[0]
        : selectedDate;
    if (departmentId) params.departmentId = departmentId;
    dispatch(fetchAppointments(params));
    dispatch(fetchMyDay({ facilityId }));
    dispatch(fetchDepartments(facilityId));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, statusFilter, scope, selectedDate, departmentId]);

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

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const patientName = personLabel(a.patient).toLowerCase();
      const title = (a.title || "").toLowerCase();
      const reason = (a.reason || "").toLowerCase();
      const dept = (a.departmentName || "").toLowerCase();
      return (
        patientName.includes(q) ||
        title.includes(q) ||
        reason.includes(q) ||
        dept.includes(q)
      );
    });
  }, [list, searchQuery]);

  // Derived metrics for the top cards
  const metrics = useMemo(() => {
    const items = list || [];
    const total = items.length;
    const checkedIn = items.filter((a) =>
      ["checked_in", "in_progress"].includes(a.status)
    ).length;
    const completed = items.filter((a) => a.status === "completed").length;
    const scheduled = items.filter((a) => a.status === "scheduled").length;
    const cancelled = items.filter((a) =>
      ["cancelled", "no_show"].includes(a.status)
    ).length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return {
      total,
      checkedIn,
      completed,
      scheduled,
      cancelled,
      completionRate,
      checkInRate,
    };
  }, [list]);

  const handleCheckIn = async (id: string) => {
    if (!facilityId) return;
    await dispatch(checkInAppointment({ facilityId, appointmentId: id }));
    load();
  };

  const handleCancel = async (id: string) => {
    if (!facilityId) return;
    const reason = window.prompt("Cancel reason (optional):") || undefined;
    await dispatch(
      cancelAppointment({ facilityId, appointmentId: id, reason })
    );
    load();
  };

  const inputStyle = {
    backgroundColor: ui.inner,
    borderColor: ui.border,
    color: ui.text,
  };

  return (
    <ModuleShell
      title="Appointments"
      subtitle="Schedule, check-in & manage visits"
      icon={CalendarCheck}
      loading={listLoading && !list?.length}
      loadingText="Loading appointments..."
      actions={
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: ui.border, color: ui.text }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link
            href="/dashboard/appointments/queue"
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: ui.border, color: ui.text }}
          >
            <ListTodo size={14} />
            <span>Queue</span>
          </Link>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={14} />
            <span>Book</span>
          </Link>
        </div>
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

      {/* ===== TOP METRIC CARDS (inspired by the reference UI) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 – Total / Scheduled */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-60 flex items-center gap-1.5">
                <CalendarCheck size={13} />
                Total Appointments
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.total}
              </p>
            </div>
            <div
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${PRIMARY_COLOR}18` }}
            >
              <CalendarCheck size={16} style={{ color: PRIMARY_COLOR }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] opacity-60">
              <span>Scheduled</span>
              <span className="font-medium">{metrics.scheduled}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${
                    metrics.total
                      ? (metrics.scheduled / metrics.total) * 100
                      : 0
                  }%`,
                  background: `linear-gradient(90deg, ${PRIMARY_COLOR}, #34d399)`,
                }}
              />
            </div>
            <p className="text-[11px] opacity-50">
              {metrics.scheduled} waiting to be seen
            </p>
          </div>
        </div>

        {/* Card 2 – Check-in / Progress */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-60 flex items-center gap-1.5">
                <Users size={13} />
                Checked In
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.checkedIn}
              </p>
            </div>
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-violet-500/15">
              <Users size={16} className="text-violet-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] opacity-60">
              <span>Check-in rate</span>
              <span className="font-medium text-emerald-500">
                +{metrics.checkInRate}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full transition-all bg-violet-500"
                style={{
                  width: `${metrics.checkInRate}%`,
                }}
              />
            </div>
            <p className="text-[11px] opacity-50">
              Currently in clinic or in progress
            </p>
          </div>
        </div>

        {/* Card 3 – Completed */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-60 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Completed
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.completed}
              </p>
            </div>
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-emerald-500/15">
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] opacity-60">
              <span>Completion rate</span>
              <span className="font-medium text-emerald-500">
                {metrics.completionRate}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full transition-all bg-emerald-500"
                style={{
                  width: `${metrics.completionRate}%`,
                }}
              />
            </div>
            <div className="flex gap-3 text-[11px] opacity-60 pt-1">
              <span>
                Cancelled / No-show:{" "}
                <strong className="opacity-90">{metrics.cancelled}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div
        className="flex flex-col md:flex-row md:items-center gap-3 rounded-[28px] p-4"
        style={{ backgroundColor: ui.card, border: `1px solid ${ui.border}` }}
      >
        <div className="relative flex-1 w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, title, reason..."
            className="w-full rounded-2xl border pl-9 pr-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="w-full sm:w-auto min-w-[140px]">
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All statuses"
              isDark={isDark}
              colors={colors}
              border={border}
              options={[
                { value: "all", label: "All statuses" },
                ...(
                  [
                    "scheduled",
                    "checked_in",
                    "in_progress",
                    "completed",
                    "cancelled",
                    "no_show",
                    "rescheduled",
                  ] as AppointmentStatus[]
                ).map((s) => ({ value: s, label: statusLabel(s) })),
              ]}
            />
          </div>

          <div className="w-full sm:w-auto min-w-[130px]">
            <CustomDropdown
              value={scope}
              onChange={(v) => setScope(v as "all" | "mine")}
              placeholder="All staff"
              isDark={isDark}
              colors={colors}
              border={border}
              options={[
                { value: "all", label: "All staff" },
                { value: "mine", label: "My appointments" },
              ]}
            />
          </div>

          <div className="w-full sm:w-auto min-w-[150px]">
            <CustomDropdown
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="All departments"
              isDark={isDark}
              colors={colors}
              border={border}
              searchable
              options={[
                { value: "", label: "All departments" },
                ...(departments || []).map((d: any) => ({
                  value: d._id || d.id,
                  label: d.name,
                })),
              ]}
            />
          </div>

          <div className="w-full sm:w-auto min-w-[140px]">
            <CustomPopupDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Any date"
            />
          </div>

          {(statusFilter !== "all" ||
            scope !== "all" ||
            departmentId ||
            selectedDate ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setScope("all");
                setDepartmentId("");
                setSelectedDate("");
                setSearchQuery("");
              }}
              className="col-span-2 sm:col-span-1 text-xs opacity-60 hover:opacity-100 underline text-center py-1"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ===== APPOINTMENTS TABLE (Product Overview style) ===== */}
      <div
        className="rounded-[28px] overflow-hidden"
        style={{
          backgroundColor: ui.card,
    
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
         
        >
          <h3 className="font-semibold text-sm">Appointment Overview</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {filtered.length === 0 && !listLoading ? (
          <div className="py-16 text-center px-4">
            <CalendarCheck size={32} className="mx-auto opacity-25 mb-3" />
            <p className="font-medium opacity-70">No appointments found</p>
            <p className="text-xs opacity-45 mt-1">
              Try adjusting filters or book a new appointment
            </p>
            <Link
              href="/dashboard/appointments/new"
              className="inline-flex items-center gap-1.5 mt-4 rounded-2xl px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} />
              Book appointment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[11px] uppercase tracking-wider opacity-50"
                  style={{ borderBottom: `1px solid ${ui.border}` }}
                >
                  <th className="px-5 py-3 font-medium">Patient / Title</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: Appointment) => {
                  const statusColor = STATUS_COLORS[a.status] || "#64748b";
                  const priorityColor =
                    PRIORITY_COLORS[a.priority] || "#64748b";

                  return (
                    <tr
                      key={a._id}
                      className="group transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer"
                      style={{ borderBottom: `1px solid ${ui.border}` }}
                      onClick={() =>
                        router.push(`/dashboard/appointments/${a._id}`)
                      }
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-2xl flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{
                              backgroundColor: `${statusColor}18`,
                              color: statusColor,
                            }}
                          >
                            {fmtTime(a.startAt).slice(0, 5)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {personLabel(a.patient) ||
                                a.title ||
                                "Appointment"}
                            </p>
                            <p className="text-xs opacity-50 truncate mt-0.5">
                              {a.title || a.reason || a.kind || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs opacity-70">
                          <Clock size={12} />
                          {fmtTime(a.startAt)}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor: `${statusColor}18`,
                              color: statusColor,
                            }}
                          >
                            {statusLabel(a.status)}
                          </span>
                          {a.priority && a.priority !== "routine" && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{
                                backgroundColor: `${priorityColor}18`,
                                color: priorityColor,
                              }}
                            >
                              {a.priority}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs opacity-70">
                        {a.departmentName || "—"}
                      </td>

                      <td className="px-5 py-3.5 text-xs opacity-70 whitespace-nowrap">
                        {fmtDateShort(a.startAt)}
                      </td>

                      <td
                        className="px-5 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "scheduled" && (
                            <button
                              onClick={() => handleCheckIn(a._id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition hover:opacity-80"
                              style={{ backgroundColor: ui.inner }}
                              title="Check in"
                            >
                              <User size={12} />
                              Check-in
                            </button>
                          )}

                          {["scheduled", "checked_in"].includes(a.status) && (
                            <button
                              onClick={() => handleCancel(a._id)}
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-xl px-2 py-1.5 text-[11px] font-medium text-red-500 transition hover:opacity-80"
                              style={{ backgroundColor: ui.inner }}
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              router.push(`/dashboard/appointments/${a._id}`)
                            }
                            className="inline-flex items-center rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition hover:opacity-80"
                            style={{ backgroundColor: ui.inner }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {listMeta && listMeta.total > 0 && (
        <p className="text-center text-xs opacity-45 pt-1">
          Showing {filtered.length} of {listMeta.total} appointments
        </p>
      )}
    </ModuleShell>
  );
}
