"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Building2,
  Heart,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchPatients,
  fetchPatient,
  addPatientHistory,
  addPatientVital,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui/items";
import { UserAvatar } from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

/* -------------------------------------------------------------------------- */
/*  Design tokens (same as the patient detail page)                           */
/* -------------------------------------------------------------------------- */

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

const SEVERITY_COLOR: Record<string, string> = {
  mild: "#10b981",
  moderate: "#f59e0b",
  severe: "#f97316",
  life_threatening: "#ef4444",
};

const fmt = (v: any, unit: string) => (v != null ? `${v}${unit}` : "—");

/* -------------------------------------------------------------------------- */
/*  Confirmation modal                                                        */
/* -------------------------------------------------------------------------- */

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
} | null;

function ConfirmModal({
  state,
  busy,
  onCancel,
  onConfirm,
  ui,
}: {
  state: ConfirmState;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  ui: UI;
}) {
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, busy, onCancel]);

  if (!state) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-[28px] p-6 space-y-5"
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium tracking-tight">{state.title}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none focus:outline-none"
            style={{ backgroundColor: ui.inner }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${PRIMARY_COLOR}1f`,
              color: PRIMARY_COLOR,
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <p className="text-sm leading-relaxed opacity-75">{state.message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none focus:outline-none"
            style={{ backgroundColor: ui.inner }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {busy ? "Working..." : state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function VitalTile({
  label,
  value,
  icon: Icon,
  color,
  ui,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  ui: UI;
}) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: ui.inner }}>
      <span
        className="flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color }}
      >
        <Icon size={13} /> {label}
      </span>
      <span className="mt-1.5 block text-base font-medium tracking-tight">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function MedicalHistoryPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("id") || "";
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const ui: UI = {
    isDark,
    page: isDark ? "rgba(255,255,255,0.03)" : "#eef2f7",
    card: isDark ? colors.shadeBg : "#ffffff",
    inner: isDark ? colors.shadeBgSecond : "#f3f5f9",
    text: colors.text,
    border,
  };

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { list, current, detailLoading, saving } = useAppSelector(
    (s) => s.patients
  );

  const [patientId, setPatientId] = useState(preselect);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [pulse, setPulse] = useState("");
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId)
      dispatch(fetchPatients({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    if (activeFacilityId && patientId) {
      dispatch(fetchPatient({ facilityId: activeFacilityId, patientId }));
    }
  }, [dispatch, activeFacilityId, patientId]);

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  const notify = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 3000);
  };

  if (!activeFacilityId) {
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

  const facilityId = activeFacilityId;

  const patientOptions = list.map((p) => ({
    value: p._id,
    label: `${p.mrn} · ${p.firstName} ${p.lastName}`,
  }));

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirming(true);
    try {
      await confirm.onConfirm();
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  };

  const reloadPatient = () => dispatch(fetchPatient({ facilityId, patientId }));

  const submitNote = () =>
    setConfirm({
      title: "Add chart note?",
      message: `"${title}" will be added to this patient's chart.`,
      confirmLabel: "Add note",
      onConfirm: async () => {
        try {
          await dispatch(
            addPatientHistory({
              facilityId,
              patientId,
              payload: { title, detail, type: "note" },
            })
          ).unwrap();
          setTitle("");
          setDetail("");
          notify("Chart entry added");
          reloadPatient();
        } catch (e: unknown) {
          notify(typeof e === "string" ? e : "Failed to add note", true);
        }
      },
    });

  const submitVitals = () => {
    const payload: Record<string, number> = {};
    if (temp) payload.temperatureC = Number(temp);
    if (spo2) payload.spo2 = Number(spo2);
    if (pulse) payload.pulseBpm = Number(pulse);
    if (sys) payload.bpSystolic = Number(sys);
    if (dia) payload.bpDiastolic = Number(dia);
    if (Object.keys(payload).length === 0) {
      notify("Enter at least one reading", true);
      return;
    }
    setConfirm({
      title: "Record vitals?",
      message:
        "Add these readings to the patient's record? Abnormal values will raise an alert.",
      confirmLabel: "Record vitals",
      onConfirm: async () => {
        try {
          const res: any = await dispatch(
            addPatientVital({ facilityId, patientId, payload })
          ).unwrap();
          setTemp("");
          setSpo2("");
          setPulse("");
          setSys("");
          setDia("");
          notify(res?.message || "Vital recorded");
          reloadPatient();
        } catch (e: unknown) {
          notify(typeof e === "string" ? e : "Failed to record vitals", true);
        }
      },
    });
  };

  const latest: any = (current?.vitals || [])
    .filter((v: any) => v.recordedAt)
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[0];

  const labelCls = "mb-1.5 block text-xs font-medium opacity-60";

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {detailLoading && (
          <DarkBlurOverlayLoader text="Loading medical history..." />
        )}

        {(msg || err) && (
          <div
            className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              zIndex: 80,
              backgroundColor: ui.card,
              color: err ? "#ef4444" : "#059669",
            }}
            role="status"
          >
            {msg || err}
          </div>
        )}

        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
            Medical history & charts
          </h1>
          <Link
            href="/dashboard/patients"
            className="rounded-full px-5 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: ui.card }}
          >
            Patient directory
          </Link>
        </div>

        {/* Patient picker */}
        <div
          className="rounded-[28px] p-5"
          style={{ backgroundColor: ui.card }}
        >
          <div className="w-full max-w-md">
            <CustomDropdown
              label="Select patient"
              value={patientId}
              options={patientOptions}
              onChange={(val) => setPatientId(val)}
              placeholder="Select patient..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>
        </div>

        {!patientId ? (
          <div
            className="rounded-[28px] p-8 text-center text-sm opacity-60"
            style={{ backgroundColor: ui.card }}
          >
            Choose a patient to view charts.
          </div>
        ) : detailLoading && !current ? (
          <div className="flex items-center gap-2 text-xs opacity-60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading chart…
          </div>
        ) : current ? (
          <>
            {/* Profile */}
            <div
              className="rounded-[28px] p-5 flex flex-wrap items-center gap-5"
              style={{ backgroundColor: ui.card }}
            >
              <UserAvatar user={current} size="md" />
              <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 min-w-[220px]">
                {[
                  { k: "Name", v: `${current.firstName} ${current.lastName}` },
                  { k: "MRN", v: current.mrn },
                  { k: "Sex", v: current.gender || "—" },
                ].map((f) => (
                  <div key={f.k} className="min-w-0">
                    <p className="text-[11px] opacity-50">{f.k}</p>
                    <p className="truncate text-sm font-medium capitalize">
                      {f.v}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href={`/dashboard/patients/${patientId}`}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Open full record
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {latest && (
                  <div
                    className="rounded-[28px] p-5 space-y-3"
                    style={{ backgroundColor: ui.card }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium tracking-tight">
                        Latest vitals
                      </h2>
                      <span className="text-[11px] opacity-50">
                        {new Date(latest.recordedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <VitalTile
                        label="Temperature"
                        value={fmt(latest.temperatureC, "°C")}
                        icon={Thermometer}
                        color="#f97316"
                        ui={ui}
                      />
                      <VitalTile
                        label="Blood oxygen"
                        value={fmt(latest.spo2, "%")}
                        icon={Wind}
                        color="#3b82f6"
                        ui={ui}
                      />
                      <VitalTile
                        label="Pulse rate"
                        value={fmt(latest.pulseBpm, " bpm")}
                        icon={Heart}
                        color="#ec4899"
                        ui={ui}
                      />
                      <VitalTile
                        label="Blood pressure"
                        value={
                          latest.bpSystolic != null
                            ? `${latest.bpSystolic}/${
                                latest.bpDiastolic ?? "—"
                              }`
                            : "—"
                        }
                        icon={Activity}
                        color="#10b981"
                        ui={ui}
                      />
                    </div>
                    {latest.alert && (
                      <p className="flex items-center gap-1.5 rounded-2xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-500">
                        <AlertTriangle size={14} />
                        {latest.alertReason || "Abnormal reading"}
                      </p>
                    )}
                  </div>
                )}

                <div
                  className="rounded-[28px] p-5 space-y-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <h2 className="text-lg font-medium tracking-tight">
                    Allergies
                  </h2>
                  {(current.allergies || []).length === 0 ? (
                    <p className="text-xs opacity-40">None recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {current.allergies!.map((a: any, i: number) => {
                        const c =
                          SEVERITY_COLOR[a.severity || "moderate"] ||
                          SEVERITY_COLOR.moderate;
                        return (
                          <div
                            key={a._id || i}
                            className="flex items-center gap-3 rounded-2xl p-3.5"
                            style={{ backgroundColor: ui.inner }}
                          >
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${c}1f`, color: c }}
                            >
                              <ShieldAlert size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                {a.substance}
                              </p>
                              {a.reaction && (
                                <p className="text-[11px] opacity-60">
                                  Reaction: {a.reaction}
                                </p>
                              )}
                            </div>
                            {a.severity && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                                style={{ color: c, backgroundColor: `${c}1f` }}
                              >
                                {String(a.severity).replace("_", " ")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-[28px] p-5 space-y-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <h2 className="text-lg font-medium tracking-tight">Family</h2>
                  {(current.family || []).length === 0 ? (
                    <p className="text-xs opacity-40">No contacts recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {(current.family || []).map((f: any, i: number) => (
                        <div
                          key={f._id || i}
                          className="flex items-center justify-between gap-2 rounded-2xl p-3.5"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <div>
                            <p className="text-sm font-semibold">{f.name}</p>
                            <p className="text-[11px] opacity-60 capitalize">
                              {f.relationship}
                            </p>
                          </div>
                          {f.isEmergencyContact && (
                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-500">
                              Emergency
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-[28px] p-5 space-y-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <h2 className="text-lg font-medium tracking-tight">
                    Chart entries
                  </h2>
                  {(current.medicalHistory || []).length === 0 ? (
                    <p className="text-xs opacity-40">No chart notes yet</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {(current.medicalHistory || [])
                        .slice()
                        .reverse()
                        .map((h: any, i: number) => (
                          <div
                            key={h._id || i}
                            className="rounded-2xl p-3.5 text-xs"
                            style={{ backgroundColor: ui.inner }}
                          >
                            <p className="text-sm font-semibold">{h.title}</p>
                            {h.detail && (
                              <p className="mt-1 opacity-70">{h.detail}</p>
                            )}
                            <p className="mt-2 text-[11px] opacity-40">
                              {h.type}
                              {h.at
                                ? ` · ${new Date(h.at).toLocaleString()}`
                                : ""}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: forms */}
              <div className="space-y-4">
                <form
                  className="rounded-[28px] p-5 space-y-3"
                  style={{ backgroundColor: ui.card }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitNote();
                  }}
                >
                  <h2 className="text-lg font-medium tracking-tight">
                    Add chart note
                  </h2>
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note title"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Detail</label>
                    <textarea
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      rows={3}
                      placeholder="Detailed medical observations..."
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    {saving ? "Saving..." : "Save note"}
                  </button>
                </form>

                <form
                  className="rounded-[28px] p-5 space-y-3"
                  style={{ backgroundColor: ui.card }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitVitals();
                  }}
                >
                  <h2 className="text-lg font-medium tracking-tight">
                    Record vitals
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Temperature (°C)</label>
                      <input
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        placeholder="e.g. 36.6"
                        inputMode="decimal"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Blood oxygen (%)</label>
                      <input
                        value={spo2}
                        onChange={(e) => setSpo2(e.target.value)}
                        placeholder="e.g. 98"
                        inputMode="decimal"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Pulse rate (bpm)</label>
                      <input
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        placeholder="e.g. 75"
                        inputMode="numeric"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Systolic</label>
                        <input
                          value={sys}
                          onChange={(e) => setSys(e.target.value)}
                          placeholder="120"
                          inputMode="numeric"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Diastolic</label>
                        <input
                          value={dia}
                          onChange={(e) => setDia(e.target.value)}
                          placeholder="80"
                          inputMode="numeric"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    {saving ? "Saving..." : "Save vitals"}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <ConfirmModal
        state={confirm}
        busy={confirming}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
        ui={ui}
      />
    </div>
  );
}
