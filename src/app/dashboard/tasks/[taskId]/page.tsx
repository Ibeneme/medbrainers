"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  History,
  Loader2,
  Save,
  Trash2,
  Edit3,
  Calendar,
  ChevronDown,
  Search,
  Check,
  X,
  Clock,
  Tag,
  Layers,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchFacilityMembers,
  fetchTaskDetail,
  updateTask,
  deleteTask,
  clearTaskDetail,
} from "@/api/slices";
import type { TaskPriority, TaskStatus } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import {
  CustomDropdown,
  CustomSearchableMultiStaffDropdown,
  CustomPopupDatePicker,
  UserAvatar,
  personLabel,
} from "@/components/ui/items";
import { useFacilityId } from "@/hooks/useFacilityId";

import { Can } from "@/components/access/can";
import { useAccess } from "@/hooks/useAccess";
function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  danger,
  busy,
  isDark,
  colors,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  isDark: boolean;
  colors: any;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl space-y-4"
        style={{
          backgroundColor: colors.shadeBg,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
        }}
      >
        <h3 className="text-base font-bold">{title}</h3>
        <p className="text-xs opacity-70">{description}</p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : ""
            }`}
            style={{ backgroundColor: danger ? undefined : PRIMARY_COLOR }}
          >
            {busy ? "Please wait..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2.5 text-xs font-semibold"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.12)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "#64748b",
  medium: "#2563eb",
  high: "#ea580c",
  urgent: "#dc2626",
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = String(params.taskId || "");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const { user } = useAppSelector((s) => s.auth);

  // Use the comprehensive useFacilityId hook
  const { facilityId, activeFacility, members } = useFacilityId();
  const { current, detailLoading, saving } = useAppSelector((s) => s.tasks);

  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("open");
  const [dueAt, setDueAt] = useState("");
  const [department, setDepartment] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  // permission-based (was: owner/admin/manager role check)
  const isManagerOrAdmin = useAccess().can("tasks.write");

  useEffect(() => {
    dispatch(fetchMyFacilities());
    return () => {
      dispatch(clearTaskDetail());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!facilityId || !taskId) return;
    dispatch(fetchFacilityMembers(facilityId));
    dispatch(fetchTaskDetail({ facilityId, taskId }));
  }, [dispatch, facilityId, taskId]);

  useEffect(() => {
    if (!current) return;
    setTitle(current.title || "");
    setDescription(current.description || "");
    setPriority(current.priority || "medium");
    setStatus(current.status || "open");
    setDueAt(toLocalInput(current.dueAt));
    setDepartment(current.department || "");
    const ids = (current.assignedTo || []).map((a) =>
      typeof a === "string" ? a : a._id || a.id
    );
    setAssignedTo(ids.filter(Boolean) as string[]);
  }, [current]);

  const notify = (msg: string, err = false) => {
    setToast(msg);
    setToastErr(err);
    setTimeout(() => setToast(null), 3000);
  };

  const activity = useMemo(() => current?.activityLog || [], [current]);

  const onSave = async () => {
    if (!facilityId || !taskId) return;
    try {
      await dispatch(
        updateTask({
          facilityId,
          taskId,
          payload: {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            status,
            dueAt: dueAt || null,
            department: department.trim() || undefined,
            assignedTo: assignedTo.length ? assignedTo : undefined,
          },
        })
      ).unwrap();
      notify("Task saved — change logged");
      setIsEditing(false);
      dispatch(fetchTaskDetail({ facilityId, taskId }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Save failed", true);
    }
  };

  const onDelete = async () => {
    if (!facilityId || !taskId) return;
    try {
      await dispatch(deleteTask({ facilityId, taskId })).unwrap();
      router.push("/dashboard/tasks");
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Delete failed", true);
      setDeleteOpen(false);
    }
  };

  if (!facilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: colors.shadeBgSecond,
    color: colors.text,
    borderColor: border,
  };

  return (
    <div
      className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-5"
      style={{ color: colors.text }}
    >
      {/* Dark overlay loader when fetching task detail */}
      {detailLoading && <DarkBlurOverlayLoader text="Loading task..." />}

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-none ${
            toastErr ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Delete this task?"
        description="This cannot be undone. Activity history will be removed with the task."
        confirmLabel="Delete task"
        danger
        busy={saving}
        isDark={isDark}
        colors={colors}
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 hover:opacity-100"
        >
          <ArrowLeft size={14} /> All tasks
        </Link>
        <p className="text-xs opacity-50">{activeFacility?.name}</p>
      </div>

      {!current ? (
        <div className="py-16 text-center text-sm opacity-60">
          Task not found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div
            className="lg:col-span-3 rounded-2xl border p-6 space-y-6"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <div
              className="flex items-center justify-between border-b pb-4"
              style={{ borderColor: border }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                  Task Information
                </span>
                <h1 className="text-xl font-bold mt-0.5">Task Overview</h1>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && isManagerOrAdmin && (
                  <Can perm="tasks.write"><button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <Edit3 size={13} style={{ color: PRIMARY_COLOR }} /> Edit
                    Details
                  </button></Can>
                )}
                {!isManagerOrAdmin && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
                    Read-only view
                  </span>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-60">
                    Title *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-60">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm"
                    style={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-20">
                  <CustomDropdown
                    label="Priority"
                    value={priority}
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                      { value: "urgent", label: "Urgent" },
                    ]}
                    onChange={(v) => setPriority(v as TaskPriority)}
                    isDark={isDark}
                    colors={colors}
                    border={border}
                  />
                  <CustomDropdown
                    label="Status"
                    value={status}
                    options={[
                      { value: "open", label: "Open" },
                      { value: "in_progress", label: "In progress" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    onChange={(v) => setStatus(v as TaskStatus)}
                    isDark={isDark}
                    colors={colors}
                    border={border}
                  />
                  <CustomPopupDatePicker
                    label="Due Date & Time"
                    value={dueAt}
                    onChange={setDueAt}
                    border={border}
                    colors={colors}
                    isDark={isDark}
                  />
                  <div>
                    <label className="mb-1 block text-xs font-semibold opacity-60">
                      Department
                    </label>
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="relative z-10 pt-2">
                  <CustomSearchableMultiStaffDropdown
                    label="Assign Staff"
                    value={assignedTo}
                    members={members}
                    onChange={setAssignedTo}
                    placeholder="Select staff members..."
                    isDark={isDark}
                    colors={colors}
                    border={border}
                  />
                  <p className="mt-1 text-[10px] opacity-50">
                    New assignees are emailed automatically upon saving.
                  </p>
                </div>

                <div
                  className="flex flex-wrap gap-2 pt-3 border-t"
                  style={{ borderColor: border }}
                >
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onSave}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 shadow-none"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <Save size={14} /> {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (current) {
                        setTitle(current.title || "");
                        setDescription(current.description || "");
                        setPriority(current.priority || "medium");
                        setStatus(current.status || "open");
                        setDueAt(toLocalInput(current.dueAt));
                        setDepartment(current.department || "");
                        const ids = (current.assignedTo || []).map((a) =>
                          typeof a === "string" ? a : a._id || a.id
                        );
                        setAssignedTo(ids.filter(Boolean) as string[]);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-none"
                    style={{ borderColor: border }}
                  >
                    Cancel
                  </button>
                  <Can perm="tasks.delete"><button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold text-red-500 shadow-none"
                    style={{
                      borderColor: isDark
                        ? "rgba(239,68,68,0.35)"
                        : "rgba(220,38,38,0.25)",
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button></Can>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {title || "Untitled Task"}
                  </h2>
                  {description ? (
                    <p className="mt-2 text-xs opacity-75 leading-relaxed whitespace-pre-wrap">
                      {description}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs opacity-40 italic">
                      No description provided.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div
                    className="rounded-xl border p-3.5 space-y-1"
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      <Tag size={12} /> Priority
                    </span>
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PRIORITY_COLORS[priority] || "#64748b",
                        }}
                      />
                      <span className="text-xs font-bold capitalize">
                        {priority}
                      </span>
                    </div>
                  </div>

                  <div
                    className="rounded-xl border p-3.5 space-y-1"
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      <Layers size={12} /> Status
                    </span>
                    <p className="text-xs font-bold capitalize pt-1">
                      {status.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div
                    className="rounded-xl border p-3.5 space-y-1"
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      <Clock size={12} /> Due Date & Time
                    </span>
                    <p className="text-xs font-medium pt-1">
                      {dueAt ? dueAt.replace("T", " ") : "No due date set"}
                    </p>
                  </div>

                  <div
                    className="rounded-xl border p-3.5 space-y-1"
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      <Building2 size={12} /> Department
                    </span>
                    <p className="text-xs font-medium pt-1 capitalize">
                      {department || "General"}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{
                    borderColor: border,
                    backgroundColor: colors.shadeBgSecond,
                  }}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">
                    <Users size={12} /> Assigned Staff
                  </span>
                  {assignedTo.length === 0 ? (
                    <p className="text-xs opacity-50">
                      No staff members assigned.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {assignedTo.map((id) => {
                        const member = members.find((m) => m.id === id);
                        if (!member) return null;
                        return (
                          <div
                            key={id}
                            className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                            style={{
                              borderColor: border,
                              backgroundColor: colors.shadeBg,
                            }}
                          >
                            <UserAvatar user={member} size="sm" />
                            <span className="capitalize">
                              {member.firstName} {member.lastName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isManagerOrAdmin && (
                  <div className="flex justify-end pt-2">
                    <Can perm="tasks.delete"><button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold text-red-500 shadow-none transition hover:opacity-80"
                      style={{
                        borderColor: isDark
                          ? "rgba(239,68,68,0.35)"
                          : "rgba(220,38,38,0.25)",
                      }}
                    >
                      <Trash2 size={14} /> Delete Task
                    </button></Can>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="lg:col-span-2 rounded-2xl border p-5 space-y-3 max-h-[80vh] overflow-y-auto"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <History size={16} /> Activity log
            </h2>
            {activity.length === 0 ? (
              <p className="text-xs opacity-50 py-6 text-center">
                No activity yet
              </p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a: any, i: number) => (
                  <li
                    key={a._id || i}
                    className="rounded-xl border p-3 text-xs"
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <p className="font-semibold">{a.message}</p>
                    <p className="mt-1 opacity-50">
                      {personLabel(a.by)} ·{" "}
                      {a.at ? new Date(a.at).toLocaleString() : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase opacity-40">
                      {a.action}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
