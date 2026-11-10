"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info, Loader2, Search, UserRound, X } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchAiStatus,
  fetchPatients,
  type AiFeature,
  type AiVitals,
  type MedSeverity,
  type RiskLevel,
} from "@/api/slices";
import type { Patient } from "@/api/types";
import { useFacilityId } from "@/hooks/useFacilityId";
import PageFrame, { inputCls, labelCls, useInputStyle, usePageUI } from "@/components/dashboard/PageFrame";
import type { GuideItem } from "@/components/ui/PageGuide";

export const AI_HOME = "/dashboard/dashboard";

/* -------------------------------------------------------------------------- */
/*  Colours                                                                   */
/* -------------------------------------------------------------------------- */

export const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: "#10b981",
  moderate: "#d97706",
  high: "#ea580c",
  critical: "#dc2626",
};

export const MED_COLOR: Record<MedSeverity, string> = {
  contraindicated: "#dc2626",
  major: "#ea580c",
  moderate: "#d97706",
  caution: "#0ea5e9",
  minor: "#64748b",
};

export const URGENCY_COLOR = { stat: "#dc2626", urgent: "#ea580c", routine: "#64748b" } as const;
export const LIKELIHOOD_COLOR = { high: PRIMARY_COLOR, moderate: "#d97706", low: "#64748b" } as const;

export const titleCase = (s?: string) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function Pill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status / access                                                           */
/* -------------------------------------------------------------------------- */

/** Loads provider status once and tells the page whether this user may run the feature. */
export function useAiAccess(feature: AiFeature) {
  const dispatch = useAppDispatch();
  const { facilityId } = useFacilityId();
  const status = useAppSelector((s) => s.ai.status);

  useEffect(() => {
    if (facilityId) dispatch(fetchAiStatus({ facilityId }));
  }, [dispatch, facilityId]);

  return {
    status,
    loaded: status !== null,
    enabled: status?.enabled !== false,
    providerReady: status?.aiProviderConfigured ?? true,
    // Until status arrives, don't block the user; the API enforces roles anyway.
    allowed: status ? status.yourAccess?.[feature] !== false : true,
  };
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: ReactNode }) {
  const color = tone === "error" ? "#dc2626" : tone === "warn" ? "#d97706" : "#0ea5e9";
  const Icon = tone === "info" ? Info : AlertTriangle;
  return (
    <div
      className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs leading-relaxed"
      style={{ backgroundColor: `${color}14`, color }}
      role={tone === "error" ? "alert" : undefined}
    >
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AccessNotices({
  access,
  needsProvider,
}: {
  access: ReturnType<typeof useAiAccess>;
  /** features that cannot work at all without the LLM (the diagnosis helper) */
  needsProvider?: boolean;
}) {
  return (
    <>
      {!access.enabled && <Notice tone="error">AI Health Insights is switched off on this server.</Notice>}
      {access.loaded && access.enabled && !access.allowed && (
        <Notice tone="warn">Your role in this facility isn&apos;t permitted to use this tool.</Notice>
      )}
      {access.loaded && !access.providerReady && (
        <Notice tone="warn">
          {needsProvider
            ? "The AI service isn't configured on this server yet, so this tool can't run. Ask your administrator to add the AI API key."
            : "The AI service isn't configured on this server, so only the rule-based checks will run (no AI commentary)."}
        </Notice>
      )}
    </>
  );
}

export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="text-[11px] leading-relaxed opacity-55 px-1">
      {text ||
        "AI-assisted decision support for licensed clinicians. It can be incomplete or wrong and does not replace clinical judgement."}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page frame                                                                */
/* -------------------------------------------------------------------------- */

export function AiPage({
  title,
  subtitle,
  guideTitle,
  guideItems,
  loading,
  loadingText,
  children,
}: {
  title: string;
  subtitle: string;
  guideTitle: string;
  guideItems: GuideItem[];
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}) {
  return (
    <PageFrame
      title={title}
      subtitle={subtitle}
      backHref={AI_HOME}
      backLabel="Back to Dashboard"
      guideTitle={guideTitle}
      guideItems={guideItems}
      width="4xl"
      loading={loading}
      loadingText={loadingText}
    >
      {children}
    </PageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form controls                                                             */
/* -------------------------------------------------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  const { ui } = usePageUI();
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition"
      style={{ backgroundColor: ui.inner }}
      aria-pressed={checked}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-[11px] opacity-55 mt-0.5">{hint}</span>}
      </span>
      <span
        className="relative h-6 w-11 shrink-0 rounded-full transition"
        style={{ backgroundColor: checked ? PRIMARY_COLOR : "rgba(128,128,128,0.35)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "22px" : "2px" }}
        />
      </span>
    </button>
  );
}

export function SubmitButton({
  busy,
  disabled,
  icon,
  children,
  busyLabel = "Working...",
}: {
  busy?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  busyLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none flex items-center gap-2 cursor-pointer"
      style={{ backgroundColor: PRIMARY_COLOR }}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : icon}
      <span>{busy ? busyLabel : children}</span>
    </button>
  );
}

/* ---- patient picker (server-side search by name / MRN) ---- */

const ageOf = (dob?: string) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a >= 0 ? a : null;
};

const patientLabel = (p: Patient) => `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unnamed patient";
const patientMeta = (p: Patient) =>
  [p.mrn, ageOf(p.dateOfBirth) !== null ? `${ageOf(p.dateOfBirth)} yrs` : "", p.gender].filter(Boolean).join(" · ");

export function PatientPicker({
  value,
  onChange,
  label = "Patient",
  required,
  hint,
}: {
  value: Patient | null;
  onChange: (p: Patient | null) => void;
  label?: string;
  required?: boolean;
  hint?: string;
}) {
  const dispatch = useAppDispatch();
  const { ui, border } = usePageUI();
  const inputStyle = useInputStyle();
  const { facilityId } = useFacilityId();
  const list = useAppSelector((s) => s.patients.list);
  const loading = useAppSelector((s) => s.patients.listLoading);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // debounced server search while the list is open
  useEffect(() => {
    if (!open || !facilityId) return;
    const t = setTimeout(() => {
      dispatch(fetchPatients({ facilityId, search: query.trim() || undefined, limit: 20 }));
    }, 300);
    return () => clearTimeout(t);
  }, [dispatch, facilityId, open, query]);

  return (
    <div ref={wrap} className="relative">
      <label className={labelCls}>
        {label}
        {required ? " *" : ""}
      </label>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: ui.inner }}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${PRIMARY_COLOR}1f`, color: PRIMARY_COLOR }}
          >
            <UserRound size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{patientLabel(value)}</p>
            <p className="text-[11px] opacity-60 truncate">{patientMeta(value)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Clear patient"
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100"
            style={{ backgroundColor: ui.card }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              placeholder="Search by name or MRN..."
              className={`${inputCls} pl-10`}
              style={inputStyle}
            />
          </div>
          {open && (
            <div
              className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border shadow-xl"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              {loading && list.length === 0 ? (
                <p className="flex items-center gap-2 px-4 py-3 text-xs opacity-60">
                  <Loader2 size={13} className="animate-spin" /> Searching...
                </p>
              ) : list.length === 0 ? (
                <p className="px-4 py-3 text-xs opacity-60">No patients found</p>
              ) : (
                list.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      onChange(p);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="block w-full px-4 py-2.5 text-left transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span className="block text-sm font-medium">{patientLabel(p)}</span>
                    <span className="block text-[11px] opacity-60">{patientMeta(p)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
      {hint && !value && <p className="mt-1.5 text-[11px] opacity-50">{hint}</p>}
    </div>
  );
}

/* ---- vitals ---- */

const VITAL_FIELDS: Array<{ key: keyof AiVitals; label: string; placeholder: string; step?: string }> = [
  { key: "temperatureC", label: "Temp (°C)", placeholder: "36.8", step: "0.1" },
  { key: "pulse", label: "Pulse (/min)", placeholder: "80" },
  { key: "bpSystolic", label: "BP systolic", placeholder: "120" },
  { key: "bpDiastolic", label: "BP diastolic", placeholder: "80" },
  { key: "respiratoryRate", label: "Resp. rate (/min)", placeholder: "16" },
  { key: "spo2", label: "SpO₂ (%)", placeholder: "98" },
  { key: "weightKg", label: "Weight (kg)", placeholder: "70", step: "0.1" },
  { key: "heightCm", label: "Height (cm)", placeholder: "170" },
  { key: "bloodGlucose", label: "Blood glucose", placeholder: "mg/dL or mmol/L", step: "0.1" },
];

export type VitalsForm = Partial<Record<keyof AiVitals, string>>;

/** Strings from the form → numbers the API accepts; blank fields are dropped. */
export function cleanVitals(v: VitalsForm): AiVitals | undefined {
  const out: AiVitals = {};
  (Object.keys(v) as Array<keyof AiVitals>).forEach((k) => {
    const raw = v[k];
    if (raw === undefined || raw.trim() === "") return;
    const n = Number(raw);
    if (Number.isFinite(n)) out[k] = n;
  });
  return Object.keys(out).length ? out : undefined;
}

export function VitalsFields({ value, onChange }: { value: VitalsForm; onChange: (v: VitalsForm) => void }) {
  const inputStyle = useInputStyle();
  return (
    <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {VITAL_FIELDS.map((f) => (
        <div key={f.key}>
          <label className={labelCls}>{f.label}</label>
          <input
            type="number"
            inputMode="decimal"
            step={f.step || "1"}
            min={0}
            value={value[f.key] ?? ""}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Result helpers                                                            */
/* -------------------------------------------------------------------------- */

export function BulletList({ title, items, tone }: { title: string; items?: string[]; tone?: "danger" }) {
  const { ui } = usePageUI();
  if (!items || items.length === 0) return null;
  const color = tone === "danger" ? "#dc2626" : undefined;
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: tone === "danger" ? "rgba(220,38,38,0.08)" : ui.inner }}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: color || undefined, opacity: color ? 1 : 0.6 }}>
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color || PRIMARY_COLOR }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Chip({ children, color }: { children: ReactNode; color?: string }) {
  const { ui } = usePageUI();
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: color ? `${color}1f` : ui.inner, color: color || ui.text }}
    >
      {children}
    </span>
  );
}

/** Message shown inside a result area when the optional AI layer didn't run. */
export function AiLayerNote({ layer }: { layer?: { available: boolean; used: boolean; error?: string } }) {
  if (!layer || layer.used) return null;
  if (layer.error) return <Notice tone="warn">AI commentary unavailable: {layer.error}. The rule-based results above are still valid.</Notice>;
  if (!layer.available) return <Notice tone="info">AI commentary is off for this result.</Notice>;
  return null;
}

export const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
export const fmtDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
