"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { StickyNote } from "lucide-react";
import {
  addTeleAddendum,
  deleteTeleNote,
  fetchTeleNote,
  signTeleNote,
  updateTeleNote,
  type TeleNote,
  type TeleNoteType,
} from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ActionLink,
  Field,
  ModuleShell,
  StatusPill,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { CustomDropdown } from "@/components/ui/items";
import {
  STATUS_COLOR,
  TM,
  fmtWhen,
  idOf,
  who,
} from "@/components/telemedicine/tm-ui";

import { Can } from "@/components/access/can";
const TYPE_OPTIONS: { value: TeleNoteType; label: string }[] = [
  { value: "soap", label: "SOAP" },
  { value: "general", label: "General" },
  { value: "private", label: "Private" },
];

const VISIBILITY_OPTIONS = [
  { value: "care_team", label: "Care team" },
  { value: "private", label: "Only me" },
];

export default function NoteEditorPage() {
  const { noteId } = useParams() as { noteId: string };
  const router = useRouter();
  const { facilityId, act, telemedicine } = useTelemedicine();
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  const dd = { border: ui.border };
  const note =
    telemedicine.activeNote && idOf(telemedicine.activeNote) === noteId
      ? telemedicine.activeNote
      : null;

  const [type, setType] = useState<TeleNoteType>("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"private" | "care_team">(
    "care_team"
  );
  const [soap, setSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [addendum, setAddendum] = useState("");

  useEffect(() => {
    if (facilityId && noteId) act(fetchTeleNote({ facilityId, noteId }), false);
  }, [facilityId, noteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return;
    setType(note.type);
    setTitle(note.title || "");
    setContent(note.content || "");
    setVisibility(note.visibility);
    setSoap({
      subjective: note.soap?.subjective || "",
      objective: note.soap?.objective || "",
      assessment: note.soap?.assessment || "",
      plan: note.soap?.plan || "",
    });
  }, [note?._id, note?.updatedAt, note?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const signed = note?.status === "signed";
  const sessionId = note ? idOf(note.session) : "";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!note || signed) return;
    await act(
      updateTeleNote({
        facilityId,
        noteId,
        payload: {
          type,
          title,
          content: type === "soap" ? content : content,
          soap: type === "soap" ? soap : undefined,
          visibility: type === "private" ? "private" : visibility,
        },
      }),
      "Note updated"
    );
  }

  return (
    <ModuleShell
      title={note?.title || "Session note"}
      subtitle={
        note
          ? `${who(note.patient)} · ${who(note.author)} · ${fmtWhen(
              note.createdAt
            )}`
          : "Loading"
      }
      icon={StickyNote}
      loading={telemedicine.detailLoading && !note}
      actions={
        <>
          <ActionLink href={`${TM}/notes`}>All notes</ActionLink>
          {sessionId && (
            <ActionLink href={`${TM}/sessions/${sessionId}`}>Visit</ActionLink>
          )}
          {note && <StatusPill status={note.status} map={STATUS_COLOR} />}
        </>
      }
    >
      {!note ? null : (
        <form onSubmit={save} className="space-y-4">
          <section
            className={cardCls}
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <CustomDropdown
                  value={type}
                  options={TYPE_OPTIONS}
                  onChange={(v) => !signed && setType(v as TeleNoteType)}
                  placeholder="Select note type…"
                  {...dd}
                />
              </Field>
              <Field label="Title">
                <input
                  disabled={signed}
                  value={title}
                  maxLength={160}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </Field>
            </div>
            {type === "soap" ? (
              <div className="grid gap-3">
                {(
                  ["subjective", "objective", "assessment", "plan"] as const
                ).map((k) => (
                  <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                    <textarea
                      disabled={signed}
                      value={soap[k]}
                      maxLength={10000}
                      onChange={(e) =>
                        setSoap((s) => ({ ...s, [k]: e.target.value }))
                      }
                      className={`${inputCls} min-h-20`}
                      style={inputStyle}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              <Field label="Note">
                <textarea
                  disabled={signed}
                  value={content}
                  maxLength={20000}
                  onChange={(e) => setContent(e.target.value)}
                  className={`${inputCls} min-h-40`}
                  style={inputStyle}
                />
              </Field>
            )}
            {type !== "private" && !signed && (
              <Field label="Visibility">
                <CustomDropdown
                  value={visibility}
                  options={VISIBILITY_OPTIONS}
                  onChange={(v) => setVisibility(v as TeleNote["visibility"])}
                  placeholder="Select visibility…"
                  {...dd}
                />
              </Field>
            )}
            {!signed && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={telemedicine.saving}
                  className="rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  Save draft
                </button>
                <Can perm="telemedicine.write"><button
                  type="button"
                  className="rounded-full border px-4 py-2.5 text-xs font-semibold"
                  style={{ borderColor: ui.border }}
                  onClick={async () => {
                    const ok = await act(
                      signTeleNote({ facilityId, noteId }),
                      "Note signed"
                    );
                    if (ok) act(fetchTeleNote({ facilityId, noteId }), false);
                  }}
                >
                  Sign
                </button></Can>
                <Can perm="telemedicine.write"><button
                  type="button"
                  className="rounded-full px-4 py-2.5 text-xs font-semibold text-red-600"
                  onClick={async () => {
                    if (!confirm("Delete this draft?")) return;
                    const ok = await act(
                      deleteTeleNote({ facilityId, noteId }),
                      "Note deleted"
                    );
                    if (ok) router.push(`${TM}/notes`);
                  }}
                >
                  Delete draft
                </button></Can>
              </div>
            )}
            {signed && (
              <p className="text-xs opacity-55">
                Signed {note.signedAt ? fmtWhen(note.signedAt) : ""}. The body
                is locked. Add an addendum if something needs correcting.
              </p>
            )}
          </section>

          {signed && (
            <section
              className={cardCls}
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <h2 className="text-sm font-semibold">Addenda</h2>
              {(note.addenda || []).length === 0 && (
                <p className="text-xs opacity-50">None yet.</p>
              )}
              <div className="space-y-2">
                {(note.addenda || []).map((a, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-3 text-sm"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <p className="whitespace-pre-wrap">{a.text}</p>
                    <p className="mt-1 text-[11px] opacity-50">
                      {who(a.by)} · {fmtWhen(a.at)}
                    </p>
                  </div>
                ))}
              </div>
              <Field label="New addendum">
                <textarea
                  value={addendum}
                  maxLength={5000}
                  onChange={(e) => setAddendum(e.target.value)}
                  className={`${inputCls} min-h-20`}
                  style={inputStyle}
                />
              </Field>
              <Can perm="telemedicine.write"><button
                type="button"
                disabled={!addendum.trim() || telemedicine.saving}
                className="rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: PRIMARY_COLOR }}
                onClick={async () => {
                  const ok = await act(
                    addTeleAddendum({
                      facilityId,
                      noteId,
                      text: addendum.trim(),
                    }),
                    "Addendum added"
                  );
                  if (ok) {
                    setAddendum("");
                    act(fetchTeleNote({ facilityId, noteId }), false);
                  }
                }}
              >
                Add addendum
              </button></Can>
            </section>
          )}
          <Link
            href={`${TM}/notes`}
            className="text-xs font-semibold"
            style={{ color: PRIMARY_COLOR }}
          >
            Back to notes
          </Link>
        </form>
      )}
    </ModuleShell>
  );
}
