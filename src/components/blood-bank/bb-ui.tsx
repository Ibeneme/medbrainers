"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchFacilityMembers,
  fetchMyFacilities,
  fetchPatients,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useBloodBank } from "@/hooks/useBloodBank";
import { useFacilityId } from "@/hooks/useFacilityId";
import {
  ConfirmModal,
  CustomDropdown,
  CustomPopupDatePicker,
  ToggleSwitch,
  personLabel,
  type ConfirmState,
} from "@/components/ui/items";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Constants (mirror the server enums in blood-bank.schema.ts / blood-bank.util) */
/* ─────────────────────────────────────────────────────────────────────────── */
export const BASE = "/dashboard/blood-bank";

export const GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const PRODUCTS = [
  { value: "whole_blood", label: "Whole blood", code: "WB" },
  { value: "packed_red_cells", label: "Packed red cells", code: "PRC" },
  { value: "fresh_frozen_plasma", label: "Fresh frozen plasma", code: "FFP" },
  { value: "platelet_concentrate", label: "Platelet concentrate", code: "PLT" },
  { value: "apheresis_platelets", label: "Apheresis platelets", code: "APH" },
  { value: "cryoprecipitate", label: "Cryoprecipitate", code: "CRY" },
  { value: "cryo_poor_plasma", label: "Cryo-poor plasma", code: "CPP" },
] as const;
export const PRODUCT_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCTS.map((p) => [p.value, p.label])
);
export const PRODUCT_CODE: Record<string, string> = Object.fromEntries(
  PRODUCTS.map((p) => [p.value, p.code])
);

/** What can be prepared from what (parent unit is consumed). */
export const DERIVATIONS: Record<string, string[]> = {
  whole_blood: [
    "packed_red_cells",
    "fresh_frozen_plasma",
    "platelet_concentrate",
  ],
  fresh_frozen_plasma: ["cryoprecipitate", "cryo_poor_plasma"],
};

export const ENUMS = {
  donorTypes: ["voluntary", "family_replacement", "autologous", "directed"],
  donorStatuses: [
    "active",
    "deferred_temporary",
    "deferred_permanent",
    "inactive",
  ],
  donationTypes: ["whole_blood", "apheresis_platelets", "apheresis_plasma"],
  bagTypes: ["single", "double", "triple", "quadruple"],
  screeningOutcomes: ["eligible", "deferred_temporary", "deferred_permanent"],
  driveStatuses: ["planned", "ongoing", "completed", "cancelled"],
  ttiTests: ["hiv", "hbsag", "hcv", "syphilis", "malaria"],
  ttiResults: ["non_reactive", "reactive", "indeterminate"],
  ttiMethods: ["rapid", "elisa", "clia", "pcr", "other"],
  ttiStatuses: ["pending", "cleared", "reactive", "indeterminate"],
  groupingMethods: ["tube", "gel_card", "slide", "automated"],
  antibodyScreens: ["negative", "positive", "not_done"],
  discardReasons: [
    "expired",
    "tti_reactive",
    "hemolysed",
    "clotted",
    "lipaemic",
    "bag_leak_damaged",
    "incomplete_collection",
    "temperature_excursion",
    "returned_out_of_cold_chain",
    "grouping_discrepancy",
    "transfusion_reaction_investigation",
    "other",
  ],
  discardMethods: ["autoclave", "incineration", "other"],
  storageTypes: ["refrigerator", "freezer", "platelet_agitator", "other"],
  storageStatuses: ["operational", "maintenance", "out_of_service"],
  requestStatuses: [
    "pending",
    "sample_received",
    "crossmatching",
    "ready",
    "partially_issued",
    "issued",
    "completed",
    "rejected",
    "cancelled",
  ],
  urgencies: ["routine", "urgent", "emergency"],
  crossmatchMethods: ["electronic", "immediate_spin", "antiglobulin"],
  crossmatchResults: ["compatible", "incompatible"],
  crossmatchStatuses: ["active", "used", "voided", "expired"],
  issueStatuses: ["issued", "transfusing", "transfused", "returned"],
  transfusionStatuses: ["in_progress", "completed", "stopped"],
  reactionTypes: [
    "febrile_non_hemolytic",
    "mild_allergic",
    "anaphylactic",
    "acute_hemolytic",
    "delayed_hemolytic",
    "taco",
    "trali",
    "septic",
    "other",
  ],
  severities: ["mild", "moderate", "severe", "life_threatening"],
  reactionStatuses: ["reported", "investigating", "closed"],
  reactionOutcomes: ["resolved", "ongoing", "sequelae", "death"],
  imputability: [
    "definite",
    "probable",
    "possible",
    "unlikely",
    "excluded",
    "not_assessable",
  ],
  adverseTypes: [
    "vasovagal",
    "hematoma",
    "nausea",
    "citrate_reaction",
    "other",
  ],
  adverseSeverities: ["mild", "moderate", "severe"],
  testResults3: ["negative", "positive", "not_done"],
  consistency: ["consistent", "discrepant", "not_done"],
};

export const DEFAULT_TEMP: Record<string, { min: number; max: number }> = {
  refrigerator: { min: 2, max: 6 },
  freezer: { min: -40, max: -25 },
  platelet_agitator: { min: 20, max: 24 },
  other: { min: -80, max: 30 },
};

export const RISKS: { key: string; label: string; hint: string }[] = [
  {
    key: "recent_illness_fever",
    label: "Recent illness / fever",
    hint: "14 days",
  },
  {
    key: "antibiotics_last_14_days",
    label: "On antibiotics in the last 14 days",
    hint: "14 days",
  },
  {
    key: "recent_vaccination",
    label: "Vaccination in the last 4 weeks",
    hint: "28 days",
  },
  {
    key: "malaria_treated_3_months",
    label: "Treated for malaria in the last 3 months",
    hint: "90 days",
  },
  {
    key: "recent_surgery_6_months",
    label: "Surgery in the last 6 months",
    hint: "180 days",
  },
  {
    key: "tattoo_piercing_12_months",
    label: "Tattoo / piercing / scarification in the last 12 months",
    hint: "365 days",
  },
  {
    key: "recent_transfusion_12_months",
    label: "Transfused in the last 12 months",
    hint: "365 days",
  },
  {
    key: "new_sexual_partner_12_months",
    label: "New / multiple sexual partners in the last 12 months",
    hint: "365 days",
  },
  {
    key: "pregnant_or_recent_delivery",
    label: "Pregnant or delivered in the last 6 months",
    hint: "180 days",
  },
  { key: "breastfeeding", label: "Currently breastfeeding", hint: "180 days" },
  {
    key: "alcohol_last_24h",
    label: "Alcohol in the last 24 hours",
    hint: "1 day",
  },
  {
    key: "iv_drug_use",
    label: "Injected non-prescribed drugs",
    hint: "permanent",
  },
  {
    key: "known_hiv_hbv_hcv",
    label: "Known HIV / hepatitis B / hepatitis C",
    hint: "permanent",
  },
  {
    key: "chronic_disease_uncontrolled",
    label: "Uncontrolled chronic disease (cardiac, epilepsy, cancer…)",
    hint: "permanent",
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const ACRONYMS: Record<string, string> = {
  tti: "TTI",
  hiv: "HIV",
  hbsag: "HBsAg",
  hcv: "HCV",
  taco: "TACO",
  trali: "TRALI",
  pcr: "PCR",
  elisa: "ELISA",
  clia: "CLIA",
  inr: "INR",
  spo2: "SpO₂",
};

export const label = (s?: string | null) => {
  if (!s) return "—";
  if (ACRONYMS[s]) return ACRONYMS[s];
  const t = String(s).replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const toOpts = (a: readonly string[]) =>
  a.map((v) => ({ value: v, label: label(v) }));

export const GROUP_OPTS = GROUPS.map((g) => ({ value: g, label: g }));
export const PRODUCT_OPTS = PRODUCTS.map((p) => ({
  value: p.value as string,
  label: p.label as string,
}));

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString() : "—";
export const fmtDateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString() : "—";

const pad = (n: number) => String(n).padStart(2, "0");
export const toLocalInput = (d: Date | string = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(
    x.getHours()
  )}:${pad(x.getMinutes())}`;
};
export const toIso = (v?: string) =>
  v ? new Date(v).toISOString() : undefined;
export const toDateInput = (d?: string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";
export const daysLeft = (d?: string | null) =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
export const minutesBetween = (a?: string, b?: string | Date) =>
  a
    ? Math.max(
        0,
        Math.round(
          ((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) /
            60000
        )
      )
    : 0;
export const fmtDuration = (mins?: number) => {
  if (mins === undefined || mins === null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

/** "" / undefined / NaN -> undefined, otherwise Number(v) */
export const num = (v: unknown) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v))
    ? undefined
    : Number(v);

/** drop undefined / "" values so optional zod fields are not sent as empty strings */
export const clean = <T extends Record<string, any>>(o: T): T => {
  const out: any = {};
  Object.entries(o).forEach(([k, v]) => {
    if (v === undefined || v === "" || v === null) return;
    out[k] = v;
  });
  return out;
};

export const idOf = (x: any): string =>
  !x ? "" : typeof x === "string" ? x : x._id || x.id || "";

export const nameOf = (x: any): string => personLabel(x);

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export const itemsSummary = (
  items?: Array<{ product: string; units: number }>
) =>
  (items || [])
    .map((i) => `${i.units}× ${PRODUCT_CODE[i.product] || i.product}`)
    .join(", ") || "—";

export const useDebounced = <T,>(value: T, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Status tones                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

const TONES = {
  ok: "#10b981",
  warn: "#f59e0b",
  bad: "#ef4444",
  info: "#3b82f6",
  mute: "#94a3b8",
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  // good
  available: "ok",
  active: "ok",
  compatible: "ok",
  completed: "ok",
  cleared: "ok",
  non_reactive: "ok",
  confirmed: "ok",
  eligible: "ok",
  transfused: "ok",
  operational: "ok",
  closed: "ok",
  resolved: "ok",
  complete: "ok",
  released: "ok",
  restocked: "ok",
  consistent: "ok",
  negative: "ok",
  // attention
  quarantine: "warn",
  pending: "warn",
  reserved: "warn",
  urgent: "warn",
  recorded: "warn",
  planned: "warn",
  investigating: "warn",
  deferred_temporary: "warn",
  sample_received: "warn",
  crossmatching: "warn",
  indeterminate: "warn",
  maintenance: "warn",
  moderate: "warn",
  incomplete: "warn",
  reported: "warn",
  collected: "warn",
  used: "mute",
  expired: "bad",
  // bad
  emergency: "bad",
  reactive: "bad",
  incompatible: "bad",
  discrepancy: "bad",
  discarded: "bad",
  rejected: "bad",
  deferred_permanent: "bad",
  out_of_service: "bad",
  life_threatening: "bad",
  severe: "bad",
  voided: "bad",
  positive: "bad",
  discrepant: "bad",
  death: "bad",
  sequelae: "bad",
  // in flight
  ongoing: "info",
  in_progress: "info",
  issued: "info",
  transfusing: "info",
  ready: "info",
  processed: "info",
  partially_issued: "info",
  stopped: "bad",
  routine: "mute",
  mild: "mute",
  cancelled: "mute",
  inactive: "mute",
  returned: "mute",
};

export const toneColor = (s?: string) => TONES[STATUS_TONE[s || ""] || "mute"];

export function Pill({
  value,
  tone,
  children,
}: {
  value?: string;
  tone?: keyof typeof TONES;
  children?: ReactNode;
}) {
  const c = tone ? TONES[tone] : toneColor(value);
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${c}1f`, color: c }}
    >
      {children ?? label(value)}
    </span>
  );
}

export function GroupBadge({
  group,
  size = "md",
}: {
  group?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg"
      ? "h-14 min-w-14 text-xl"
      : size === "sm"
      ? "h-6 min-w-8 text-[11px]"
      : "h-9 min-w-11 text-sm";
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-xl px-2 font-mono font-bold`}
      style={{
        backgroundColor: group ? `${PRIMARY_COLOR}18` : "transparent",
        color: group ? PRIMARY_COLOR : undefined,
        border: group ? undefined : "1px dashed currentColor",
        opacity: group ? 1 : 0.35,
      }}
    >
      {group || "?"}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Hooks                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export function useUI() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);
  const softShadow = undefined;
  return { ui, isDark, colors, softShadow };
}

export function useBB() {
  const bb = useBloodBank();
  const router = useRouter();
  const u = useUI();
  return { ...bb, router, ...u };
}

/** Loads something that has no slice state (single drive, inventory, queues…). */
export function useLoad<T = any>(
  bb: { facilityId: string; act: (a: any, m?: string | false) => Promise<any> },
  fetcher: (facilityId: string) => any,
  deps: unknown[] = []
) {
  const { facilityId, act } = bb;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const ref = useRef(fetcher);
  ref.current = fetcher;

  const reload = useCallback(
    async (silent = false) => {
      if (!facilityId) return null;
      if (!silent) setStatus("loading");
      const action = ref.current(facilityId);
      if (!action) {
        setData(null);
        setStatus("ready");
        return null;
      }
      const res = await act(action, false);
      if (res === null) {
        setStatus("error");
        return null;
      }
      const d = (res === true ? null : res) as T | null;
      setData(d);
      setStatus("ready");
      return d;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [facilityId, act, ...deps]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    data,
    status,
    loading: status === "loading",
    error: status === "error",
    reload,
  };
}

export function useForm<T extends Record<string, any>>(initial: T) {
  const [v, setV] = useState<T>(initial);
  const set = useCallback(
    (k: string, val: any) => setV((p) => ({ ...p, [k]: val })),
    []
  );
  const patch = useCallback(
    (p: Partial<T>) => setV((x) => ({ ...x, ...p })),
    []
  );
  return { v, set, patch, setV };
}
export type Form = ReturnType<typeof useForm>;

/** Confirmation / warning dialog only – never used for data entry. */
export function useConfirm() {
  const { ui } = useUI();
  const [state, setState] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);
  const node = (
    <ConfirmModal
      state={state}
      busy={busy}
      ui={ui}
      onCancel={() => !busy && setState(null)}
      onConfirm={async () => {
        if (!state) return;
        setBusy(true);
        try {
          await state.onConfirm();
        } finally {
          setBusy(false);
          setState(null);
        }
      }}
    />
  );
  return { ask: setState, node };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Layout primitives (identical look to the wards pages)                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export function Loader({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-sm opacity-55">
      <Loader2 className="h-5 w-5 animate-spin" />
      {text}
    </div>
  );
}

export function NoFacility() {
  const { colors } = useUI();
  return (
    <div
      className="mx-auto max-w-lg px-4 py-20 text-center"
      style={{ color: colors.text }}
    >
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
      >
        <Building2 size={28} style={{ color: PRIMARY_COLOR }} />
      </div>
      <p className="text-lg font-semibold">Select a facility first</p>
      <p className="mt-1 text-sm opacity-60">
        Choose a facility to manage its blood bank
      </p>
    </div>
  );
}

export function Page({
  children,
  narrow,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  const dispatch = useAppDispatch();
  const { ui } = useUI();
  const { hasFacility, initialized } = useFacilityId();
  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);
  if (!hasFacility) return initialized ? <NoFacility /> : <Loader />;
  return (
    <div
      className={`relative mx-auto ${
        narrow ? "max-w-2xl" : "max-w-6xl"
      } space-y-6 px-4 py-6 sm:px-6 sm:py-8`}
      style={{ color: ui.text }}
    >
      {children}
    </div>
  );
}

export function Header({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${PRIMARY_COLOR}18`,
            color: PRIMARY_COLOR,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm opacity-55">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}

export function BackHeader({
  href,
  title,
  subtitle,
  right,
}: {
  href: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  const { ui } = useUI();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={href}
          aria-label="Back"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition hover:opacity-80"
          style={{ borderColor: ui.border }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle && <div className="text-xs opacity-60">{subtitle}</div>}
        </div>
      </div>
      {right && (
        <div className="flex flex-wrap items-center gap-2">{right}</div>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  const { ui } = useUI();
  return (
    <section
      className={`rounded-3xl ${pad ? "p-5 sm:p-6" : ""} ${className}`}
      style={{ backgroundColor: ui.card }}
    >
      {children}
    </section>
  );
}

export function SectionCard({
  title,
  count,
  right,
  children,
}: {
  title: string;
  count?: number;
  right?: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useUI();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {count !== undefined && (
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: colors.shadeBg }}
            >
              {count}
            </span>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Stat({
  label: l,
  value,
  sub,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  href?: string;
  tone?: "bad" | "warn" | "ok";
}) {
  const { ui } = useUI();
  const body = (
    <div
      className="h-full rounded-3xl p-5 transition-all hover:opacity-95"
      style={{ backgroundColor: ui.card }}
    >
      <p className="text-xs font-medium opacity-55">{l}</p>
      <p
        className="mt-1 text-3xl font-semibold tracking-tight"
        style={tone ? { color: TONES[tone] } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] opacity-45">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Btn({
  href,
  onClick,
  tone = "primary",
  disabled,
  children,
  type = "button",
  full,
}: {
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "ghost" | "danger" | "card";
  disabled?: boolean;
  children: ReactNode;
  type?: "button" | "submit";
  full?: boolean;
}) {
  const { ui, colors } = useUI();
  const base = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 ${
    full ? "w-full" : ""
  }`;
  const style =
    tone === "primary"
      ? { backgroundColor: PRIMARY_COLOR, color: "#fff" }
      : tone === "danger"
      ? { backgroundColor: "#dc2626", color: "#fff" }
      : tone === "card"
      ? { backgroundColor: ui.card }
      : { backgroundColor: colors.shadeBg };
  if (href && !disabled)
    return (
      <Link href={href} className={base} style={style}>
        {children}
      </Link>
    );
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      style={style}
    >
      {children}
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  onCard = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onCard?: boolean;
}) {
  const { ui, colors } = useUI();
  return (
    <div
      className="flex min-w-[240px] max-w-sm flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5"
      style={{
        backgroundColor: onCard ? colors.shadeBg : ui.card,
      }}
    >
      <Search size={16} className="shrink-0 opacity-40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:opacity-40"
        style={{ color: ui.text }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg p-0.5 opacity-50 hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Pills({
  options,
  value,
  onChange,
  onCard = true,
}: {
  options: Array<{ value: string; label: string; count?: number }>;
  value: string;
  onChange: (v: string) => void;
  onCard?: boolean;
}) {
  const { ui, colors } = useUI();
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all"
            style={{
              backgroundColor: active
                ? PRIMARY_COLOR
                : onCard
                ? colors.shadeBg
                : ui.card,
              color: active ? "#FFFFFF" : ui.text,
            }}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={`ml-1.5 ${active ? "opacity-80" : "opacity-45"}`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  const { colors } = useUI();
  return (
    <div
      className="rounded-2xl py-14 text-center text-sm opacity-60"
      style={{ backgroundColor: colors.shadeBg }}
    >
      {children}
    </div>
  );
}

export function Banner({
  tone = "warn",
  href,
  children,
  cta = "Review",
}: {
  tone?: "warn" | "bad" | "info";
  href?: string;
  children: ReactNode;
  cta?: string;
}) {
  const c =
    tone === "bad" ? TONES.bad : tone === "info" ? TONES.info : PRIMARY_COLOR;
  const inner = (
    <div
      className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-all hover:opacity-95"
      style={{ backgroundColor: `${c}0C`, border: `1px solid ${c}33` }}
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        {children}
      </span>
      {href && (
        <span
          className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: c }}
        >
          {cta}
          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/** Whole row is a link to the record's own page. */
export function RowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { colors } = useUI();
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:opacity-90"
      style={{ backgroundColor: colors.shadeBg }}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight size={16} className="shrink-0 opacity-40" />
    </Link>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ backgroundColor: `${PRIMARY_COLOR}20`, color: PRIMARY_COLOR }}
    >
      {initialsOf(name)}
    </span>
  );
}

export function Bar({ pct, danger }: { pct: number; danger?: boolean }) {
  const { colors } = useUI();
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: colors.shadeBg }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          backgroundColor: danger ? TONES.bad : PRIMARY_COLOR,
        }}
      />
    </div>
  );
}

export function Ring({
  pct,
  size = 72,
  stroke = 6,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="opacity-15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={PRIMARY_COLOR}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: PRIMARY_COLOR }}
        >
          {Math.round(pct)}
          <span className="text-xs opacity-70">%</span>
        </span>
      </div>
    </div>
  );
}

export function KV({
  label: l,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider opacity-50">
        {l}
      </p>
      <div className="break-words text-sm">
        {children === undefined || children === null || children === ""
          ? "—"
          : children}
      </div>
    </div>
  );
}

export function KVGrid({
  children,
  cols = 3,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}) {
  const c =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-x-6 gap-y-4 ${c}`}>{children}</div>
  );
}

export function DataTable({
  head,
  rows,
  empty = "Nothing recorded yet.",
}: {
  head: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  const { ui, colors } = useUI();
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div
      className="overflow-x-auto rounded-2xl"
      style={{ backgroundColor: colors.shadeBg }}
    >
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider opacity-55">
            {head.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t" style={{ borderColor: ui.border }}>
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Pickers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export function PatientSelect({
  label: l,
  value,
  onChange,
  onPick,
  placeholder = "Search patient…",
}: {
  label?: string;
  value: string;
  onChange: (id: string) => void;
  onPick?: (p: any) => void;
  placeholder?: string;
}) {
  const dispatch = useAppDispatch();
  const { facilityId } = useFacilityId();
  const { ui, isDark, colors } = useUI();
  const patients = useAppSelector((s) => s.patients.list) as any[];
  useEffect(() => {
    if (facilityId) dispatch(fetchPatients({ facilityId, limit: 300 }));
  }, [dispatch, facilityId]);
  return (
    <CustomDropdown
      label={l}
      value={value}
      placeholder={placeholder}
      searchable
      options={patients.map((p) => ({
        label: `${p.mrn || ""} · ${p.firstName} ${p.lastName}${
          p.gender ? ` (${p.gender})` : ""
        }`,
        value: p._id,
      }))}
      onChange={(id) => {
        onChange(id);
        onPick?.(patients.find((p) => p._id === id));
      }}
      isDark={isDark}
      colors={colors}
      border={ui.border}
    />
  );
}

export function useMembers() {
  const dispatch = useAppDispatch();
  const { facilityId } = useFacilityId();
  const members = useAppSelector((s) => s.facilities.members) as any[];
  useEffect(() => {
    if (facilityId) dispatch(fetchFacilityMembers(facilityId));
  }, [dispatch, facilityId]);
  return members || [];
}

export function StaffSelect({
  label: l,
  value,
  onChange,
  placeholder = "Select staff…",
}: {
  label?: string;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const members = useMembers();
  const { ui, isDark, colors } = useUI();
  return (
    <CustomDropdown
      label={l}
      value={value}
      placeholder={placeholder}
      searchable
      options={members.map((m) => ({
        label: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email,
        value: m.id,
      }))}
      onChange={onChange}
      isDark={isDark}
      colors={colors}
      border={ui.border}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Spec-driven forms – every create / edit / action is its own page           */
/* ─────────────────────────────────────────────────────────────────────────── */

export type FieldSpec = {
  key: string;
  label?: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "tel"
    | "textarea"
    | "select"
    | "toggle"
    | "datetime"
    | "date"
    | "chips"
    | "patient"
    | "staff"
    | "custom";
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** numbers for number fields; "YYYY-MM-DD" (or datetime) strings for date / datetime fields */
  min?: number | string;
  max?: number | string;
  step?: number | string;
  span?: 1 | 2 | 3;
  rows?: number;
  searchable?: boolean;
  show?: (v: any) => boolean;
  onPick?: (p: any, form: Form) => void;
  render?: (
    v: any,
    set: (k: string, val: any) => void,
    form: Form
  ) => ReactNode;
};
export type SectionSpec = {
  title?: string;
  desc?: string;
  cols?: 1 | 2 | 3;
  fields: FieldSpec[];
};

const fieldCls =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none bg-transparent placeholder:opacity-40 focus:ring-1";

/** Every field gets a placeholder, even when the page did not supply one. */
const defaultPlaceholder = (f: FieldSpec) => {
  if (f.placeholder) return f.placeholder;
  const l = (f.label || "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  switch (f.type) {
    case "textarea":
      return l ? `Write ${l}…` : "Write here…";
    case "select":
      return l ? `Select ${l}…` : "Select…";
    case "patient":
      return "Search patient by name or MRN…";
    case "staff":
      return "Search and select staff…";
    case "number":
      return l ? `Enter ${l}` : "Enter a number";
    case "email":
      return "name@example.com";
    case "tel":
      return "e.g. 0803 000 0000";
    case "datetime":
    case "date":
      return undefined;
    default:
      return l ? `Enter ${l}` : "Type here…";
  }
};

function FieldBox({ f, form }: { f: FieldSpec; form: Form }) {
  const { ui, isDark, colors } = useUI();
  const v = form.v[f.key];
  const set = form.set;
  const ph = defaultPlaceholder(f);
  const lbl = f.label ? `${f.label}${f.required ? " *" : ""}` : undefined;
  const style = {
    borderColor: ui.border,
    color: ui.text,
    colorScheme: isDark ? ("dark" as const) : ("light" as const),
  };

  let body: ReactNode = null;
  switch (f.type) {
    case "textarea":
      body = (
        <textarea
          rows={f.rows || 3}
          value={v ?? ""}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={ph}
          className={`${fieldCls} resize-y leading-relaxed`}
          style={style}
        />
      );
      break;
    case "select":
      body = (
        <CustomDropdown
          value={v ?? ""}
          options={f.options || []}
          onChange={(x) => set(f.key, x)}
          placeholder={ph || "Select…"}
          searchable={f.searchable}
          isDark={isDark}
          colors={colors}
          border={ui.border}
        />
      );
      break;
    case "date":
    case "datetime":
      body = (
        <CustomPopupDatePicker
          value={v ?? ""}
          onChange={(x) => set(f.key, x)}
          minDate={f.min as string | undefined}
          maxDate={f.max as string | undefined}
          placeholder={
            f.placeholder ||
            (f.type === "date" ? "Select date…" : "Select date & time…")
          }
          isDark={isDark}
          colors={{ ...colors, shadeBgSecond: "transparent" }}
          border={ui.border}
        />
      );
      break;
    case "toggle":
      return (
        <div
          className="rounded-xl border px-3.5 py-1.5"
          style={{ borderColor: ui.border }}
        >
          <ToggleSwitch
            checked={!!v}
            onChange={(c) => set(f.key, c)}
            label={lbl}
            description={f.hint}
          />
        </div>
      );
    case "chips":
      body = (
        <div className="flex flex-wrap gap-1.5">
          {(f.options || []).map((o) => {
            const on = (v || []).includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  set(
                    f.key,
                    on
                      ? (v || []).filter((x: string) => x !== o.value)
                      : [...(v || []), o.value]
                  )
                }
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: on ? PRIMARY_COLOR : colors.shadeBg,
                  color: on ? "#fff" : ui.text,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;
    case "patient":
      return (
        <div>
          <PatientSelect
            label={lbl}
            value={v ?? ""}
            onChange={(id) => set(f.key, id)}
            placeholder={ph}
            onPick={(p) => f.onPick?.(p, form)}
          />
          {f.hint && <p className="mt-1 text-[10px] opacity-50">{f.hint}</p>}
        </div>
      );
    case "staff":
      return (
        <div>
          <StaffSelect
            label={lbl}
            value={v ?? ""}
            onChange={(id) => set(f.key, id)}
            placeholder={ph}
          />
          {f.hint && <p className="mt-1 text-[10px] opacity-50">{f.hint}</p>}
        </div>
      );
    case "custom":
      return (
        <div className="space-y-1.5">
          {lbl && (
            <label className="block text-xs font-semibold opacity-70">
              {lbl}
            </label>
          )}
          {f.render?.(form.v, set, form)}
          {f.hint && <p className="text-[10px] opacity-50">{f.hint}</p>}
        </div>
      );
    default:
      body = (
        <input
          type={f.type === "number" ? "number" : f.type || "text"}
          inputMode={f.type === "number" ? "decimal" : undefined}
          value={v ?? ""}
          min={f.min}
          max={f.max}
          step={f.step ?? (f.type === "number" ? "any" : undefined)}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={ph}
          className={fieldCls}
          style={style}
        />
      );
  }
  return (
    <div className="space-y-1.5">
      {lbl && (
        <label className="block text-xs font-semibold opacity-70">{lbl}</label>
      )}
      {body}
      {f.hint && <p className="text-[10px] opacity-50">{f.hint}</p>}
    </div>
  );
}

const filled = (f: FieldSpec, v: any) => {
  const x = v[f.key];
  if (f.type === "toggle") return x === true;
  if (f.type === "chips") return Array.isArray(x) && x.length > 0;
  return String(x ?? "").trim() !== "";
};

export type ConfirmSpec = {
  title: string;
  message: string;
  label?: string;
  tone?: "danger" | "primary";
};

export function SpecForm({
  form,
  sections,
  onSubmit,
  submitLabel = "Save",
  saving,
  savingText,
  backHref,
  title,
  subtitle,
  headerRight,
  top,
  bottom,
  canSubmit = true,
  confirm,
  danger,
  narrow = true,
}: {
  form: Form;
  sections: SectionSpec[];
  onSubmit: (v: any) => Promise<unknown> | unknown;
  submitLabel?: string;
  saving?: boolean;
  savingText?: string;
  backHref: string;
  title: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  top?: ReactNode;
  bottom?: ReactNode;
  canSubmit?: boolean;
  confirm?: ConfirmSpec | ((v: any) => ConfirmSpec | null | undefined);
  danger?: boolean;
  narrow?: boolean;
}) {
  const { ui } = useUI();
  const { ask, node } = useConfirm();

  const missing = sections.some((s) =>
    s.fields.some(
      (f) => f.required && (!f.show || f.show(form.v)) && !filled(f, form.v)
    )
  );

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const c = typeof confirm === "function" ? confirm(form.v) : confirm;
    const run = async () => {
      await onSubmit(form.v);
    };
    if (c)
      ask({
        title: c.title,
        message: c.message,
        confirmLabel: c.label || "Confirm",
        tone: c.tone || "primary",
        onConfirm: run,
      });
    else run();
  };

  return (
    <Page narrow={narrow}>
      {saving && <DarkBlurOverlayLoader text={savingText || "Saving…"} />}
      <BackHeader
        href={backHref}
        title={title}
        subtitle={subtitle}
        right={headerRight}
      />
      {top}
      <form onSubmit={handle} className="space-y-5">
        {sections.map((s, i) => (
          <Card key={i} className="space-y-4">
            {(s.title || s.desc) && (
              <div>
                {s.title && (
                  <h2 className="text-sm font-semibold tracking-tight">
                    {s.title}
                  </h2>
                )}
                {s.desc && (
                  <p className="mt-0.5 text-xs opacity-55">{s.desc}</p>
                )}
              </div>
            )}
            <div
              className={`grid grid-cols-1 gap-4 ${
                (s.cols || 2) === 3
                  ? "sm:grid-cols-2 lg:grid-cols-3"
                  : (s.cols || 2) === 2
                  ? "sm:grid-cols-2"
                  : ""
              }`}
            >
              {s.fields
                .filter((f) => !f.show || f.show(form.v))
                .map((f) => (
                  <div
                    key={f.key}
                    className={
                      f.span === 3
                        ? "sm:col-span-2 lg:col-span-3"
                        : f.span === 2
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <FieldBox f={f} form={form} />
                  </div>
                ))}
            </div>
          </Card>
        ))}
        {bottom}
        <div className="flex justify-end gap-2.5">
          <Link
            href={backHref}
            className="rounded-2xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: ui.card }}
          >
            Cancel
          </Link>
          <Btn
            type="submit"
            tone={danger ? "danger" : "primary"}
            disabled={saving || missing || !canSubmit}
          >
            {saving ? "Saving…" : submitLabel}
          </Btn>
        </div>
      </form>
      {node}
    </Page>
  );
}

/** Small read-only context card shown above an action form. */
export function Context({ children }: { children: ReactNode }) {
  return <Card className="space-y-3">{children}</Card>;
}

export const NotFound = ({ what, href }: { what: string; href: string }) => (
  <div className="py-16 text-center text-sm opacity-60">
    {what} not found.{" "}
    <Link href={href} className="underline">
      Go back
    </Link>
  </div>
);

export const vitalsFields = (prefix = ""): FieldSpec[] => [
  {
    key: `${prefix}temperatureC`,
    label: "Temperature (°C)",
    type: "number",
    min: 30,
    max: 45,
    step: 0.1,
  },
  {
    key: `${prefix}pulse`,
    label: "Pulse (bpm)",
    type: "number",
    min: 20,
    max: 250,
  },
  {
    key: `${prefix}systolic`,
    label: "Systolic BP",
    type: "number",
    min: 40,
    max: 280,
  },
  {
    key: `${prefix}diastolic`,
    label: "Diastolic BP",
    type: "number",
    min: 20,
    max: 180,
  },
  {
    key: `${prefix}respRate`,
    label: "Resp. rate",
    type: "number",
    min: 4,
    max: 80,
  },
  {
    key: `${prefix}spo2`,
    label: "SpO₂ (%)",
    type: "number",
    min: 40,
    max: 100,
  },
];

export const pickVitals = (v: any, prefix = "") => {
  const out: Record<string, number> = {};
  [
    "temperatureC",
    "pulse",
    "systolic",
    "diastolic",
    "respRate",
    "spo2",
  ].forEach((k) => {
    const n = num(v[`${prefix}${k}`]);
    if (n !== undefined) out[k] = n;
  });
  return out;
};
