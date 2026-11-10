"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  PhoneCall,
  Play,
  RefreshCw,
  SkipForward,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyQueues,
  fetchQueue,
  callNext,
  startTicket,
  completeTicket,
  skipTicket,
  requeueTicket,
  cancelTicket,
  fetchDepartments,
  type QueueTicket,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { ModuleShell, personLabel } from "@/components/dashboard/ModuleShell";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomDropdown } from "@/components/ui/items";

const TICKET_STATUS_COLORS: Record<string, string> = {
  waiting: "#3b82f6",
  called: "#8b5cf6",
  serving: "#f59e0b",
  completed: "#10b981",
  skipped: "#64748b",
  cancelled: "#ef4444",
};

function waitMinutes(from?: string) {
  if (!from) return null;
  const ms = Date.now() - new Date(from).getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 60000);
}

export default function QueuePage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, departments } = useFacilityId();
  const { myQueues, queue, queueLoading, saving, error, message } =
    useAppSelector((s) => s.appointments);

  const [departmentId, setDepartmentId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchMyQueues({ facilityId }));
    dispatch(fetchDepartments(facilityId));
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (!facilityId || !departmentId) return;
    dispatch(fetchQueue({ facilityId, departmentId, includeClosed: true }));
  }, [dispatch, facilityId, departmentId]);

  useEffect(() => {
    if (departmentId) return;
    if (myQueues?.length) {
      const withWaiting = myQueues.find((q) => q.waiting > 0);
      setDepartmentId((withWaiting || myQueues[0]).department._id);
    } else if (departments?.length) {
      setDepartmentId(departments[0]._id || departments[0].id);
    }
  }, [myQueues, departments, departmentId]);

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

  const refresh = () => {
    if (!facilityId) return;
    dispatch(fetchMyQueues({ facilityId }));
    if (departmentId) {
      dispatch(fetchQueue({ facilityId, departmentId, includeClosed: true }));
    }
  };

  const run = async (action: () => Promise<any>) => {
    await action();
    refresh();
  };

  const inputStyle = {
    backgroundColor: ui.inner,
    borderColor: ui.border,
    color: ui.text,
  };

  const TicketCard = ({
    ticket,
    actions,
  }: {
    ticket: QueueTicket;
    actions?: React.ReactNode;
  }) => {
    const color = TICKET_STATUS_COLORS[ticket.status] || "#64748b";
    const mins = waitMinutes(ticket.checkedInAt);
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
        style={{
          backgroundColor: ui.inner,
          border: `1px solid ${ui.border}`,
        }}
      >
        <div
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-bold leading-tight"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <span className="text-[10px] opacity-70">#</span>
          {ticket.ticketNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {personLabel(ticket.patient)}
          </p>
          <p className="text-[11px] opacity-55 truncate">
            {typeof ticket.appointment === "object"
              ? ticket.appointment?.title || ticket.appointment?.reason
              : null}
            {mins != null && ticket.status === "waiting"
              ? ` · waiting ${mins} min`
              : ""}
            {ticket.priority && ticket.priority !== "routine"
              ? ` · ${ticket.priority}`
              : ""}
          </p>
        </div>
        {actions}
      </div>
    );
  };

  return (
    <ModuleShell
      title="Department Queue"
      subtitle="Call, serve & manage waiting patients"
      icon={Timer}
      loading={queueLoading && !queue}
      loadingText="Loading queue..."
      actions={
        <>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: ui.border, color: ui.text }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: ui.border, color: ui.text }}
          >
            <CalendarCheck size={14} />
            Appointments
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

      <div
        className="flex flex-wrap items-center gap-2 rounded-[28px] p-3"
        style={{ backgroundColor: ui.card, border: `1px solid ${ui.border}` }}
      >
        <div className="min-w-[220px]">
          <CustomDropdown
            value={departmentId}
            onChange={setDepartmentId}
            placeholder="Select department"
            isDark={isDark}
            colors={colors}
            border={border}
            searchable
            options={[
              { value: "", label: "Select department" },
              ...(departments || []).map((d: any) => ({
                value: d._id || d.id,
                label: d.name,
              })),
            ]}
          />
        </div>

        {queue && (
          <>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#3b82f618", color: "#3b82f6" }}
            >
              {queue.counts.waiting} waiting
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#8b5cf618", color: "#8b5cf6" }}
            >
              {queue.counts.called} called
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#f59e0b18", color: "#f59e0b" }}
            >
              {queue.counts.serving} serving
            </span>
            {queue.canServe && (
              <button
                disabled={saving || queue.counts.waiting === 0}
                onClick={() =>
                  run(() =>
                    dispatch(callNext({ facilityId, departmentId }) as any)
                  )
                }
                className="ml-auto inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <PhoneCall size={14} />
                Call next
              </button>
            )}
          </>
        )}
      </div>

      {myQueues && myQueues.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {myQueues.map((q) => (
            <button
              key={q.department._id}
              onClick={() => setDepartmentId(q.department._id)}
              className="text-left rounded-2xl px-4 py-3 transition hover:opacity-90"
              style={{
                backgroundColor:
                  departmentId === q.department._id
                    ? `${PRIMARY_COLOR}18`
                    : ui.card,
                border: `1px solid ${
                  departmentId === q.department._id ? PRIMARY_COLOR : ui.border
                }`,
              }}
            >
              <p className="font-medium text-sm">{q.department.name}</p>
              <p className="text-[11px] opacity-55 mt-0.5">
                {q.waiting} waiting · {q.called} called · {q.serving} serving
              </p>
            </button>
          ))}
        </div>
      )}

      {!departmentId ? (
        <div
          className="rounded-[28px] py-16 text-center"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <Users size={32} className="mx-auto opacity-25 mb-3" />
          <p className="font-medium opacity-70">Select a department</p>
          <p className="text-xs opacity-45 mt-1">
            Choose a department to view and manage its queue
          </p>
        </div>
      ) : queue ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <section
            className="rounded-[28px] p-4 space-y-2"
            style={{
              backgroundColor: ui.card,
              border: `1px solid ${ui.border}`,
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50 flex items-center gap-1.5">
              <Play size={12} /> Serving ({queue.serving.length})
            </h3>
            {queue.serving.length === 0 ? (
              <p className="text-xs opacity-40 py-4 text-center">
                No one being served
              </p>
            ) : (
              queue.serving.map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  actions={
                    <div className="flex gap-1">
                      <button
                        disabled={saving}
                        onClick={() =>
                          run(() =>
                            dispatch(
                              completeTicket({
                                facilityId,
                                ticketId: t._id,
                              }) as any
                            )
                          )
                        }
                        className="rounded-xl p-1.5 text-emerald-500 hover:bg-emerald-500/10"
                        title="Complete"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  }
                />
              ))
            )}
          </section>

          <section
            className="rounded-[28px] p-4 space-y-2"
            style={{
              backgroundColor: ui.card,
              border: `1px solid ${ui.border}`,
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50 flex items-center gap-1.5">
              <PhoneCall size={12} /> Called ({queue.called.length})
            </h3>
            {queue.called.length === 0 ? (
              <p className="text-xs opacity-40 py-4 text-center">None called</p>
            ) : (
              queue.called.map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  actions={
                    <div className="flex gap-1">
                      <button
                        disabled={saving}
                        onClick={() =>
                          run(() =>
                            dispatch(
                              startTicket({
                                facilityId,
                                ticketId: t._id,
                              }) as any
                            )
                          )
                        }
                        className="rounded-xl p-1.5 hover:bg-black/5 dark:hover:bg-white/10"
                        title="Start visit"
                        style={{ color: PRIMARY_COLOR }}
                      >
                        <Play size={16} />
                      </button>
                      <button
                        disabled={saving}
                        onClick={() =>
                          run(() =>
                            dispatch(
                              requeueTicket({
                                facilityId,
                                ticketId: t._id,
                              }) as any
                            )
                          )
                        }
                        className="rounded-xl p-1.5 opacity-60 hover:opacity-100"
                        title="Back to queue"
                      >
                        <SkipForward size={16} />
                      </button>
                    </div>
                  }
                />
              ))
            )}
          </section>

          <section
            className="rounded-[28px] p-4 space-y-2"
            style={{
              backgroundColor: ui.card,
              border: `1px solid ${ui.border}`,
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50 flex items-center gap-1.5">
              <Timer size={12} /> Waiting ({queue.waiting.length})
            </h3>
            {queue.waiting.length === 0 ? (
              <p className="text-xs opacity-40 py-4 text-center">Queue empty</p>
            ) : (
              queue.waiting.map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  actions={
                    <div className="flex gap-1">
                      <button
                        disabled={saving}
                        onClick={() =>
                          run(() =>
                            dispatch(
                              skipTicket({
                                facilityId,
                                ticketId: t._id,
                                reason: "Skipped by staff",
                              }) as any
                            )
                          )
                        }
                        className="rounded-xl p-1.5 opacity-50 hover:opacity-100"
                        title="Skip"
                      >
                        <SkipForward size={14} />
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this patient from the queue?"
                            )
                          ) {
                            run(() =>
                              dispatch(
                                cancelTicket({
                                  facilityId,
                                  ticketId: t._id,
                                  reason: "Removed by staff",
                                }) as any
                              )
                            );
                          }
                        }}
                        className="rounded-xl p-1.5 text-red-500/70 hover:text-red-500"
                        title="Cancel ticket"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  }
                />
              ))
            )}
          </section>
        </div>
      ) : null}

      {queue && queue.closedToday?.length > 0 && (
        <section
          className="rounded-[28px] p-4 space-y-2"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">
            Closed today ({queue.closedToday.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {queue.closedToday.slice(0, 12).map((t) => (
              <TicketCard key={t._id} ticket={t} />
            ))}
          </div>
        </section>
      )}
    </ModuleShell>
  );
}
