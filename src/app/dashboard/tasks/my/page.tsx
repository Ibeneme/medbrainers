"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  GripHorizontal,
  X,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchFacilityMembers,
  fetchAllTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/api/slices";
import type { FacilityTask, TaskPriority, TaskStatus } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  CustomDropdown,
  CustomSearchableMultiStaffDropdown,
  CustomPopupDatePicker,
  UserAvatar,
  personLabel,
} from "@/components/ui/items";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#64748b",
  medium: "#2563eb",
  high: "#ea580c",
  urgent: "#dc2626",
};

const KANBAN_COLUMNS: { label: string; status: TaskStatus }[] = [
  { label: "Open", status: "open" },
  { label: "In Progress", status: "in_progress" },
  { label: "Completed", status: "completed" },
  { label: "Cancelled", status: "cancelled" },
];

export default function AllTasksPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const { user } = useAppSelector((s) => s.auth);

  // Use the comprehensive useFacilityId hook
  const { facilityId, activeFacility, members } = useFacilityId();
  const { all, allLoading, saving } = useAppSelector((s) => s.tasks);

  // Set Kanban as default view mode
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [statusFilter, setStatusFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    assignedTo: [] as string[],
    dueAt: "",
    department: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  const [localTasks, setLocalTasks] = useState<FacilityTask[]>([]);

  const myId = user?._id || (user as { id?: string } | undefined)?.id;

  useEffect(() => {
    if (all) {
      // Filter tasks assigned to the current user
      const assignedToMe = all.filter((t) => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [];
        return assignees.some((a) => {
          const aId =
            typeof a === "string" ? a : (a as any)._id || (a as any).id;
          return myId && String(aId) === String(myId);
        });
      });
      setLocalTasks(assignedToMe);
    }
  }, [all, myId]);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchFacilityMembers(facilityId));
    dispatch(
      fetchAllTasks({
        facilityId,
        status: viewMode === "list" && statusFilter ? statusFilter : undefined,
      })
    );
  }, [dispatch, facilityId, statusFilter, viewMode]);

  const notify = (msg: string, err = false) => {
    setToast(msg);
    setToastErr(err);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredListTasks = useMemo(() => {
    if (!statusFilter) return localTasks;
    return localTasks.filter((t) => t.status === statusFilter);
  }, [localTasks, statusFilter]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;
    if (!form.assignedTo.length) {
      notify("Select at least one assignee", true);
      return;
    }
    try {
      await dispatch(
        createTask({
          facilityId,
          payload: {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            priority: form.priority,
            assignedTo: form.assignedTo,
            dueAt: form.dueAt || undefined,
            department: form.department || undefined,
          },
        })
      ).unwrap();
      notify("Task created — assignees emailed");
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: [],
        dueAt: "",
        department: "",
      });
      dispatch(fetchAllTasks({ facilityId }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Create failed", true);
    }
  };

  const setStatus = async (taskId: string, status: TaskStatus) => {
    if (!facilityId) return;
    try {
      setLocalTasks((prev) =>
        prev.map((t) =>
          String(t._id || t.id) === taskId ? { ...t, status } : t
        )
      );

      await dispatch(
        updateTask({
          facilityId,
          taskId,
          payload: { status },
        })
      ).unwrap();
      notify(`Marked ${status.replace(/_/g, " ")}`);
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Update failed", true);
      dispatch(fetchAllTasks({ facilityId }));
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    setStatus(taskId, targetStatus);
  };

  if (!facilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
        <Link
          href="/dashboard/workspace"
          className="mt-4 inline-block text-sm underline opacity-70"
        >
          Workspace
        </Link>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: colors.shadeBgSecond,
    color: colors.text,
    borderColor: border,
  };

  const priorityOptions = [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Urgent", value: "urgent" },
  ];

  return (
    <div
      className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-5 overflow-x-hidden"
      style={{ color: colors.text }}
    >
      {/* Dark overlay loader when fetching tasks */}
      {allLoading && <DarkBlurOverlayLoader text="Loading tasks..." />}

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-none ${
            toastErr ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ClipboardList size={20} style={{ color: PRIMARY_COLOR }} /> My
            Assigned Tasks
          </h1>
          <p className="mt-1 text-xs opacity-60">
            {activeFacility?.name} · showing only tasks assigned to you
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div
            className="flex rounded-xl border p-1 shadow-none"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-none capitalize"
              style={{
                backgroundColor:
                  viewMode === "list" ? PRIMARY_COLOR : "transparent",
                color: viewMode === "list" ? "#fff" : colors.text,
              }}
            >
              <ListIcon size={13} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-none capitalize"
              style={{
                backgroundColor:
                  viewMode === "kanban" ? PRIMARY_COLOR : "transparent",
                color: viewMode === "kanban" ? "#fff" : colors.text,
              }}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
          </div>

          <Link
            href="/dashboard/tasks"
            className="rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            All facility tasks
          </Link>
          <Link
            href="/dashboard/tasks/handover"
            className="rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            Handover log
          </Link>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={14} /> New task
          </button>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="flex flex-wrap gap-2">
          {["", "open", "in_progress", "completed", "cancelled"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setStatusFilter(s)}
              className="rounded-full border px-3 py-1 text-[11px] font-bold capitalize"
              style={{
                borderColor: border,
                backgroundColor:
                  statusFilter === s ? PRIMARY_COLOR : colors.shadeBg,
                color: statusFilter === s ? "#fff" : colors.text,
              }}
            >
              {s ? s.replace(/_/g, " ") : "all"}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl my-8 overflow-visible"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <div
              className="flex items-center justify-between pb-4 border-b mb-4"
              style={{ borderColor: border }}
            >
              <h2 className="text-base font-bold flex items-center gap-2">
                <Plus size={18} style={{ color: PRIMARY_COLOR }} /> Create New
                Task
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl p-1.5 hover:opacity-80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold opacity-70">
                  Title *
                </label>
                <input
                  required
                  placeholder="Enter task title..."
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold opacity-70">
                  Description
                </label>
                <textarea
                  placeholder="Enter optional description..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-20">
                <CustomDropdown
                  label="Priority"
                  value={form.priority}
                  options={priorityOptions}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, priority: val as TaskPriority }))
                  }
                  placeholder="Select priority..."
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
                <CustomPopupDatePicker
                  label="Due"
                  value={form.dueAt}
                  onChange={(val) => setForm((f) => ({ ...f, dueAt: val }))}
                  border={border}
                  colors={colors}
                  isDark={isDark}
                />
              </div>

              <div className="relative z-10">
                <CustomSearchableMultiStaffDropdown
                  label="Assign staff * (multi-select)"
                  value={form.assignedTo}
                  members={members}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, assignedTo: val }))
                  }
                  placeholder="Select staff members..."
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {saving ? "Creating…" : "Create & notify"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border px-4 py-3 text-xs font-semibold"
                  style={{ borderColor: border }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {filteredListTasks.length === 0 ? (
            <div className="p-12 text-center text-sm opacity-60">
              No tasks assigned to you in this facility.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: border }}>
              {filteredListTasks.map((t) => {
                const id = t._id || t.id!;
                const assignees = Array.isArray(t.assignedTo)
                  ? t.assignedTo
                  : [];
                return (
                  <li
                    key={id}
                    onClick={() => router.push(`/dashboard/tasks/${id}`)}
                    className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold hover:underline">
                          {t.title}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white capitalize"
                          style={{
                            backgroundColor:
                              PRIORITY_COLORS[t.priority] || "#64748b",
                          }}
                        >
                          {t.priority}
                        </span>
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase capitalize"
                          style={{ borderColor: border }}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {t.description && (
                        <p className="mt-1 text-xs opacity-60 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-[11px] opacity-50 capitalize">
                        {assignees.map(personLabel).join(", ") || "Unassigned"}
                        {t.dueAt
                          ? ` · due ${new Date(t.dueAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <div
                      className="flex flex-wrap items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => setStatus(id, "completed")}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold"
                          style={{ borderColor: border }}
                        >
                          <CheckCircle2 size={12} /> Done
                        </button>
                      )}
                      {t.status === "open" && (
                        <button
                          type="button"
                          onClick={() => setStatus(id, "in_progress")}
                          className="rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold"
                          style={{ borderColor: border }}
                        >
                          Start
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await dispatch(
                              deleteTask({
                                facilityId,
                                taskId: id,
                              })
                            ).unwrap();
                            notify("Task deleted");
                          } catch (err: unknown) {
                            notify(
                              typeof err === "string" ? err : "Delete failed",
                              true
                            );
                          }
                        }}
                        className="rounded-lg p-1.5 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 items-start min-w-[1000px]">
            {KANBAN_COLUMNS.map((col) => {
              const columnTasks = localTasks.filter(
                (t) => t.status === col.status
              );

              return (
                <div
                  key={col.status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnColumn(e, col.status)}
                  className="flex flex-col rounded-2xl border p-3 min-h-[500px] flex-1 min-w-[260px]"
                  style={{
                    borderColor: border,
                    backgroundColor: colors.shadeBg,
                  }}
                >
                  <div
                    className="flex items-center justify-between pb-3 border-b mb-3 px-1"
                    style={{ borderColor: border }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider capitalize">
                        {col.label}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        }}
                      >
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                    {columnTasks.map((t) => {
                      const id = t._id || t.id!;
                      const assignees = Array.isArray(t.assignedTo)
                        ? t.assignedTo
                        : [];

                      return (
                        <div
                          key={id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, id)}
                          onClick={() => router.push(`/dashboard/tasks/${id}`)}
                          className="rounded-xl border p-3 text-xs flex flex-col gap-2 cursor-pointer transition shadow-none hover:opacity-95 shrink-0"
                          style={{
                            borderColor: border,
                            backgroundColor: colors.shadeBgSecond,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-xs leading-snug hover:underline">
                              {t.title}
                            </p>
                            <GripHorizontal
                              size={14}
                              className="opacity-30 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing"
                            />
                          </div>

                          {t.description && (
                            <p className="opacity-60 line-clamp-2 text-[11px]">
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white capitalize"
                              style={{
                                backgroundColor:
                                  PRIORITY_COLORS[t.priority] || "#64748b",
                              }}
                            >
                              {t.priority}
                            </span>
                            {t.dueAt && (
                              <span className="text-[10px] opacity-50">
                                {new Date(t.dueAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>

                          <div
                            className="flex items-center justify-between pt-2 border-t mt-1"
                            style={{ borderColor: border }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              {assignees.map((u, i) => (
                                <UserAvatar key={i} user={u} size="sm" />
                              ))}
                              <span className="text-[10px] opacity-60 truncate capitalize">
                                {assignees.map(personLabel).join(", ") ||
                                  "Unassigned"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await dispatch(
                                    deleteTask({
                                      facilityId,
                                      taskId: id,
                                    })
                                  ).unwrap();
                                  notify("Task deleted");
                                } catch (err: unknown) {
                                  notify(
                                    typeof err === "string"
                                      ? err
                                      : "Delete failed",
                                    true
                                  );
                                }
                              }}
                              className="text-red-500 hover:opacity-80 p-1"
                              title="Delete task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {columnTasks.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-[11px] opacity-30 py-12">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
