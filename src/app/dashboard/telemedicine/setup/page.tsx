"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import {
  fetchTeleSettings,
  saveTeleSettings,
  type TeleSettings,
} from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Field,
  ModuleShell,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { ToggleSwitch } from "@/components/ui/items";

const HOST_ROLES = [
  ["doctor", "Doctor"],
  ["consultant", "Consultant"],
  ["nurse", "Nurse"],
  ["pharmacist", "Pharmacist"],
  ["admin", "Admin"],
  ["manager", "Manager"],
] as const;

const DEFAULTS: TeleSettings = {
  enabled: true,
  defaultDurationMinutes: 30,
  joinWindowMinutes: 10,
  noShowAfterMinutes: 15,
  maxDurationMinutes: 120,
  maxParticipants: 6,
  waitingRoom: true,
  chatEnabled: true,
  screenShareEnabled: true,
  recordingAllowed: false,
  recordingRequiresConsent: true,
  requirePatientConsent: true,
  consentText:
    "I consent to receiving care by video. I understand this is a secure, private session and that I can end it at any time.",
  lobbyMessage: "",
  allowedHostRoles: [],
  sendInviteEmails: true,
  stunUrls: [],
};

export default function SetupTelehealthPage() {
  const { facilityId, dispatch, telemedicine, act } = useTelemedicine();
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  const [form, setForm] = useState<TeleSettings>(DEFAULTS);
  const [stunText, setStunText] = useState("");

  useEffect(() => {
    if (facilityId) dispatch(fetchTeleSettings({ facilityId }));
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (!telemedicine.settings) return;
    const s = telemedicine.settings;
    setForm({
      ...DEFAULTS,
      ...s,
      lobbyMessage: s.lobbyMessage || "",
      allowedHostRoles: s.allowedHostRoles || [],
      stunUrls: s.stunUrls || [],
    });
    setStunText((s.stunUrls || []).join("\n"));
  }, [telemedicine.settings]);

  const set = <K extends keyof TeleSettings>(k: K, v: TeleSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const stunUrls = stunText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    await act(
      saveTeleSettings({
        facilityId,
        payload: {
          enabled: form.enabled,
          defaultDurationMinutes: Number(form.defaultDurationMinutes),
          joinWindowMinutes: Number(form.joinWindowMinutes),
          noShowAfterMinutes: Number(form.noShowAfterMinutes),
          maxDurationMinutes: Number(form.maxDurationMinutes),
          maxParticipants: Number(form.maxParticipants),
          waitingRoom: form.waitingRoom,
          chatEnabled: form.chatEnabled,
          screenShareEnabled: form.screenShareEnabled,
          recordingAllowed: form.recordingAllowed,
          recordingRequiresConsent: form.recordingRequiresConsent,
          requirePatientConsent: form.requirePatientConsent,
          consentText: form.consentText,
          lobbyMessage: form.lobbyMessage || "",
          allowedHostRoles: form.allowedHostRoles,
          sendInviteEmails: form.sendInviteEmails,
          stunUrls,
        },
      })
    );
  }

  return (
    <ModuleShell
      title="Setup Telehealth"
      subtitle="Facility rules for video visits"
      icon={Settings}
      loading={telemedicine.listLoading && !telemedicine.settings}
    >
      <form onSubmit={submit} className="space-y-4">
        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex flex-col gap-3">
            <ToggleSwitch
              label="Telehealth enabled"
              description="Turn off to stop new sessions from being scheduled."
              checked={form.enabled}
              onChange={(v) => set("enabled", v)}
            />
            <ToggleSwitch
              label="Email join links"
              description="Send the patient and guests their link when a visit is booked."
              checked={form.sendInviteEmails}
              onChange={(v) => set("sendInviteEmails", v)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <Num
              label="Default length (minutes)"
              value={form.defaultDurationMinutes}
              min={5}
              max={480}
              onChange={(n) => set("defaultDurationMinutes", n)}
            />
            <Num
              label="Join window (minutes early)"
              value={form.joinWindowMinutes}
              min={0}
              max={240}
              onChange={(n) => set("joinWindowMinutes", n)}
            />
            <Num
              label="Mark missed after (minutes)"
              value={form.noShowAfterMinutes}
              min={1}
              max={240}
              onChange={(n) => set("noShowAfterMinutes", n)}
            />
            <Num
              label="Hard stop (max minutes)"
              value={form.maxDurationMinutes}
              min={10}
              max={720}
              onChange={(n) => set("maxDurationMinutes", n)}
            />
            <Num
              label="Max people in a room"
              value={form.maxParticipants}
              min={2}
              max={25}
              onChange={(n) => set("maxParticipants", n)}
            />
          </div>
        </section>

        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold pb-1">Room behaviour</h2>
          <div className="flex flex-col gap-2">
            <ToggleSwitch
              label="Waiting room"
              description="Patients wait until a host admits them."
              checked={form.waitingRoom}
              onChange={(v) => set("waitingRoom", v)}
            />
            <ToggleSwitch
              label="In-room chat"
              checked={form.chatEnabled}
              onChange={(v) => set("chatEnabled", v)}
            />
            <ToggleSwitch
              label="Screen share"
              checked={form.screenShareEnabled}
              onChange={(v) => set("screenShareEnabled", v)}
            />
            <ToggleSwitch
              label="Recording allowed"
              description="A flag and consent banner. Capture itself is on the client."
              checked={form.recordingAllowed}
              onChange={(v) => set("recordingAllowed", v)}
            />
            <ToggleSwitch
              label="Recording needs consent"
              checked={form.recordingRequiresConsent}
              onChange={(v) => set("recordingRequiresConsent", v)}
            />
          </div>
        </section>

        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold pb-1">Patient consent</h2>
          <div className="pb-2">
            <ToggleSwitch
              label="Require consent before a patient joins"
              checked={form.requirePatientConsent}
              onChange={(v) => set("requirePatientConsent", v)}
            />
          </div>
          <Field label="Consent text">
            <textarea
              required
              minLength={10}
              maxLength={2000}
              value={form.consentText}
              onChange={(e) => set("consentText", e.target.value)}
              className={`${inputCls} min-h-28`}
              style={inputStyle}
            />
          </Field>
          <Field label="Lobby message">
            <textarea
              maxLength={500}
              value={form.lobbyMessage || ""}
              onChange={(e) => set("lobbyMessage", e.target.value)}
              className={`${inputCls} min-h-20`}
              style={inputStyle}
              placeholder="Shown while people wait to be admitted"
            />
          </Field>
        </section>

        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold">Who may host</h2>
          <p className="text-xs opacity-55">
            Leave every box off to allow all clinical roles. Reception and audit
            can schedule, but they cannot enter a room unless invited.
          </p>
          <div className="flex flex-wrap gap-2">
            {HOST_ROLES.map(([value, label]) => {
              const on = form.allowedHostRoles.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    set(
                      "allowedHostRoles",
                      on
                        ? form.allowedHostRoles.filter((r) => r !== value)
                        : [...form.allowedHostRoles, value]
                    )
                  }
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: on ? PRIMARY_COLOR : ui.border,
                    backgroundColor: on ? `${PRIMARY_COLOR}18` : ui.inner,
                    color: on ? PRIMARY_COLOR : ui.text,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Field label="Extra STUN servers">
            <textarea
              value={stunText}
              onChange={(e) => setStunText(e.target.value)}
              className={`${inputCls} min-h-20 font-mono text-xs`}
              style={inputStyle}
              placeholder={
                "stun:stun.l.google.com:19302\none per line, must start with stun: or stuns:"
              }
            />
          </Field>
          <p className="text-xs opacity-45">
            TURN credentials stay on the server (TURN_URLS / TURN_SECRET). They
            are minted per person at join and are never stored here.
          </p>
        </section>

        <button
          type="submit"
          disabled={telemedicine.saving}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {telemedicine.saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </ModuleShell>
  );
}

function Num({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const { inputCls, inputStyle } = useInputStyles();
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputCls}
        style={inputStyle}
      />
    </Field>
  );
}
