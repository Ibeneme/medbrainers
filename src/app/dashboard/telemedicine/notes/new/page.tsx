"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StickyNote } from "lucide-react";
import {
  createTeleNote,
  fetchTeleSessions,
  type TeleNoteType,
} from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Field,
  ModuleShell,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { CustomDropdown } from "@/components/ui/items";
import { TM, fmtWhen, patientName } from "@/components/telemedicine/tm-ui";

const TYPE_OPTIONS: { value: TeleNoteType; label: string }[] = [
  { value: "soap", label: "SOAP" },
  { value: "general", label: "General" },
  { value: "private", label: "Private (author only)" },
];

const VISIBILITY_OPTIONS = [
  { value: "care_team", label: "Care team" },
  { value: "private", label: "Only me" },
];

function NewNoteForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const preset = sp.get("sessionId") || "";
  const { facilityId, dispatch, telemedicine, act } = useTelemedicine();
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  const dd = { border: ui.border };

  const [sessionId, setSessionId] = useState(preset);
  const [type, setType] = useState<TeleNoteType>("soap");
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

  useEffect(() => {
    if (facilityId)
      dispatch(fetchTeleSessions({ facilityId, scope: "all", limit: 40 }));
  }, [dispatch, facilityId]);

  const visitOptions = useMemo(() => {
    const list = telemedicine.sessions.map((s) => ({
      value: s._id,
      label: `${fmtWhen(s.scheduledStart)} · ${s.title} · ${patientName(s)}`,
    }));

    if (preset && !list.some((o) => o.value === preset)) {
      list.unshift({ value: preset, label: "This visit" });
    }

    return [{ value: "", label: "Select a visit" }, ...list];
  }, [telemedicine.sessions, preset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    const note = await act(
      createTeleNote({
        facilityId,
        sessionId,
        payload: {
          type,
          title: title.trim() || undefined,
          content: type === "soap" ? undefined : content,
          soap: type === "soap" ? soap : undefined,
          visibility: type === "private" ? "private" : visibility,
        },
      }),
      "Note saved"
    );
    const id = (note as { _id?: string } | null)?._id;
    router.push(id ? `${TM}/notes/${id}` : `${TM}/notes`);
  }

  return (
    <ModuleShell
      title="New session note"
      subtitle="Only the host and invited clinicians can write notes"
      icon={StickyNote}
    >
      <form
        onSubmit={submit}
        className={cardCls}
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        <Field label="Visit">
          <CustomDropdown
            value={sessionId}
            options={visitOptions}
            onChange={setSessionId}
            placeholder="Select a visit…"
            searchable
            {...dd}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <CustomDropdown
              value={type}
              options={TYPE_OPTIONS}
              onChange={(v) => setType(v as TeleNoteType)}
              placeholder="Select note type…"
              {...dd}
            />
          </Field>
          <Field label="Title">
            <input
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Optional"
            />
          </Field>
        </div>
        {type === "soap" ? (
          <div className="grid gap-3">
            {(["subjective", "objective", "assessment", "plan"] as const).map(
              (k) => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                  <textarea
                    value={soap[k]}
                    maxLength={10000}
                    onChange={(e) =>
                      setSoap((s) => ({ ...s, [k]: e.target.value }))
                    }
                    className={`${inputCls} min-h-20`}
                    style={inputStyle}
                  />
                </Field>
              )
            )}
          </div>
        ) : (
          <Field label="Note">
            <textarea
              value={content}
              maxLength={20000}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputCls} min-h-40`}
              style={inputStyle}
            />
          </Field>
        )}
        {type !== "private" && (
          <Field label="Who can read this">
            <CustomDropdown
              value={visibility}
              options={VISIBILITY_OPTIONS}
              onChange={(v) => setVisibility(v as "private" | "care_team")}
              placeholder="Select visibility…"
              {...dd}
            />
          </Field>
        )}
        <button
          type="submit"
          disabled={telemedicine.saving || !sessionId}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {telemedicine.saving ? "Saving…" : "Save draft"}
        </button>
      </form>
    </ModuleShell>
  );
}

export default function NewNotePage() {
  return (
    <Suspense fallback={null}>
      <NewNoteForm />
    </Suspense>
  );
}
