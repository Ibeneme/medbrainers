"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { Plus, StickyNote } from "lucide-react";
import { fetchTeleNotes } from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ActionLink,
  EmptyState,
  ModuleShell,
  StatusPill,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { CustomDropdown, ToggleSwitch } from "@/components/ui/items";
import {
  Pager,
  STATUS_COLOR,
  TM,
  fmtWhen,
  who,
} from "@/components/telemedicine/tm-ui";

const STATUS_OPTIONS = [
  { value: "", label: "Drafts and signed" },
  { value: "draft", label: "Drafts" },
  { value: "signed", label: "Signed" },
];

export default function SessionNotesPage() {
  const { facilityId, dispatch, telemedicine } = useTelemedicine();
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  const dd = { border: ui.border };

  const [status, setStatus] = useState<"" | "draft" | "signed">("");
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(
      fetchTeleNotes({
        facilityId,
        status: status || undefined,
        mine,
        page,
        limit: 25,
      })
    );
  }, [dispatch, facilityId, status, mine, page]);

  const meta = telemedicine.notesMeta;

  return (
    <ModuleShell
      title="Patient Session Notes"
      subtitle="Drafts and signed notes from video visits"
      icon={StickyNote}
      loading={telemedicine.listLoading && telemedicine.notes.length === 0}
      actions={
        <>
          <ActionLink href={TM}>Consultations</ActionLink>
          <Link
            href={`${TM}/notes/new`}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={14} /> New note
          </Link>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-56">
          <CustomDropdown
            value={status}
            options={STATUS_OPTIONS}
            onChange={(v) => {
              setPage(1);
              setStatus(v as "" | "draft" | "signed");
            }}
            placeholder="Select status…"
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
            label="Written by me"
          />
        </div>
      </div>

      <div
        className={cardCls}
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        {telemedicine.notes.length === 0 ? (
          <EmptyState text="No notes yet. Open a visit and write a SOAP or general note, or start one from a session." />
        ) : (
          <div className="space-y-2">
            {telemedicine.notes.map((n) => {
              const session = typeof n.session === "object" ? n.session : null;
              return (
                <Link
                  key={n._id}
                  href={`${TM}/notes/${n._id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 transition hover:opacity-80"
                  style={{ backgroundColor: ui.inner }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {n.title ||
                        (n.type === "soap"
                          ? "SOAP note"
                          : n.type === "private"
                          ? "Private note"
                          : "Session note")}
                    </p>
                    <p className="truncate text-xs opacity-55">
                      {who(n.patient)} · {who(n.author)} ·{" "}
                      {fmtWhen(n.createdAt)}
                      {session?.title ? ` · ${session.title}` : ""}
                      {session?.roomCode ? ` · ${session.roomCode}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase opacity-50">
                      {n.type}
                    </span>
                    <StatusPill status={n.status} map={STATUS_COLOR} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Pager
          page={meta?.page || page}
          pages={meta?.pages || 1}
          total={meta?.total || telemedicine.notes.length}
          onPage={setPage}
        />
      </div>
    </ModuleShell>
  );
}
