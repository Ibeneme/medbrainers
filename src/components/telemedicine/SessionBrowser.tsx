"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Video } from "lucide-react";
import {
  fetchTeleSessions,
  type TeleScope,
  type TeleStatus,
} from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import {
  ActionLink,
  EmptyState,
  ModuleShell,
  StatusPill,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { CustomDropdown, ToggleSwitch } from "@/components/ui/items";
import {
  STATUS_COLOR,
  TM,
  TYPE_LABEL,
  Pager,
  fmtTime,
  fmtWhen,
  patientName,
  who,
} from "./tm-ui";

const STATUS_OPTIONS_UPCOMING = [
  { value: "", label: "Any status" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
];

const STATUS_OPTIONS_PAST = [
  { value: "", label: "Any status" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed", label: "Missed" },
];

const STATUS_OPTIONS_DEFAULT = [
  { value: "", label: "Any status" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
];

export function SessionBrowser({
  scope,
  title,
  subtitle,
  empty,
}: {
  scope: TeleScope;
  title: string;
  subtitle: string;
  empty: string;
}) {
  const { facilityId, dispatch, telemedicine } = useTelemedicine();
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  const dd = { border: ui.border };

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TeleStatus | "">("");
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(
      fetchTeleSessions({
        facilityId,
        scope,
        q: q || undefined,
        status: status || undefined,
        mine,
        page,
        limit: 20,
      })
    );
  }, [dispatch, facilityId, scope, q, status, mine, page]);

  const statusOptions = useMemo(() => {
    if (scope === "upcoming") return STATUS_OPTIONS_UPCOMING;
    if (scope === "past") return STATUS_OPTIONS_PAST;
    return STATUS_OPTIONS_DEFAULT;
  }, [scope]);

  const meta = telemedicine.sessionsMeta;
  const rows =
    telemedicine.sessionsScope === scope || telemedicine.sessionsScope === null
      ? telemedicine.sessions
      : [];

  return (
    <ModuleShell
      title={title}
      subtitle={subtitle}
      icon={Video}
      loading={telemedicine.listLoading && rows.length === 0}
      actions={
        <>
          <ActionLink href={TM}>Consultations</ActionLink>
          <ActionLink href={`${TM}/sessions/new`}>Schedule</ActionLink>
          <button
            type="button"
            onClick={() =>
              dispatch(
                fetchTeleSessions({
                  facilityId,
                  scope,
                  q: q || undefined,
                  status: status || undefined,
                  mine,
                  page,
                  limit: 20,
                })
              )
            }
            className="flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold"
            style={{ borderColor: ui.border }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search title"
          className={inputCls}
          style={{ ...inputStyle, maxWidth: 280 }}
        />
        <div className="w-full sm:w-48">
          <CustomDropdown
            value={status}
            options={statusOptions}
            onChange={(v) => {
              setPage(1);
              setStatus(v as TeleStatus | "");
            }}
            placeholder="Any status…"
            {...dd}
          />
        </div>
        <div
          className="w-auto px-4 py-2 rounded-2xl border"
          style={{ borderColor: ui.border, backgroundColor: ui.inner }}
        >
          <ToggleSwitch
            checked={mine}
            onChange={(checked) => {
              setPage(1);
              setMine(checked);
            }}
            label="Mine only"
          />
        </div>
      </div>

      <div
        className={cardCls}
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        {rows.length === 0 ? (
          <EmptyState text={empty} />
        ) : (
          <div className="space-y-2">
            {rows.map((s) => (
              <Link
                key={s._id}
                href={`${TM}/sessions/${s._id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 transition hover:opacity-80"
                style={{ backgroundColor: ui.inner }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="truncate text-xs opacity-55">
                    {fmtWhen(s.scheduledStart)}–{fmtTime(s.scheduledEnd)} ·{" "}
                    {patientName(s)} · {who(s.host)} ·{" "}
                    {TYPE_LABEL[s.type] || s.type}
                    {s.live
                      ? ` · ${s.live.participants} in room${
                          s.live.waiting ? `, ${s.live.waiting} waiting` : ""
                        }`
                      : ""}
                  </p>
                </div>
                <StatusPill status={s.status} map={STATUS_COLOR} />
              </Link>
            ))}
          </div>
        )}
        <Pager
          page={meta?.page || page}
          pages={meta?.pages || 1}
          total={meta?.total || rows.length}
          onPage={setPage}
        />
      </div>
    </ModuleShell>
  );
}
