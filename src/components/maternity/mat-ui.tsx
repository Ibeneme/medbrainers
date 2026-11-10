"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchPatients } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { CustomDropdown, CustomPopupDatePicker } from "@/components/ui/items";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useMaternity } from "@/hooks/useMaternity";
import {
  Loader,
  Page,
  Pill,
  toDateInput,
  toLocalInput,
  useUI,
} from "@/components/blood-bank/bb-ui";
import type { FieldSpec } from "@/components/blood-bank/bb-ui";

/* Same look as the blood bank / wards pages — re-use the shared kit. */
export {
  Avatar,
  Banner,
  Bar,
  BackHeader,
  Btn,
  Card,
  Context,
  DataTable,
  Empty,
  Header,
  KV,
  KVGrid,
  Loader,
  NotFound,
  Page,
  Pills,
  Ring,
  RowLink,
  SearchBox,
  SectionCard,
  SpecForm,
  Stat,
  clean,
  fmtDate,
  fmtDateTime,
  fmtDuration,
  idOf,
  initialsOf,
  minutesBetween,
  num,
  toDateInput,
  toIso,
  toLocalInput,
  useConfirm,
  useDebounced,
  useForm,
  useUI,
} from "@/components/blood-bank/bb-ui";
export type {
  FieldSpec,
  Form,
  SectionSpec,
} from "@/components/blood-bank/bb-ui";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Constants (mirror the server enums in modules/maternity/schemas)            */
/* ─────────────────────────────────────────────────────────────────────────── */

export const BASE = "/dashboard/maternal";

export const ENUMS = {
  riskLevels: ["low", "moderate", "high", "very-high"],
  pregnancyStatuses: ["active", "delivered", "aborted", "ectopic", "closed"],
  labourStatuses: [
    "admitted",
    "active-labour",
    "delivered",
    "transferred",
    "discharged",
  ],
  deliveryModes: ["svd", "assisted", "caesarean", "breech", "other"],
  urgencies: ["elective", "urgent", "emergency"],
  investigationTypes: ["ultrasound", "lab", "other"],
  fpMethods: [
    "pill",
    "injectable",
    "implant",
    "iud",
    "condom",
    "sterilisation",
    "natural",
    "other",
  ],
  newbornStatuses: [
    "well",
    "nicu",
    "scbu",
    "transferred",
    "deceased",
    "discharged",
  ],
  sexes: ["male", "female", "unknown"],
  immunizationStatuses: ["scheduled", "given", "missed", "contraindicated"],
  nutritionStatuses: ["active", "completed", "defaulted", "transferred"],
} as const;

export const MODE_LABEL: Record<string, string> = {
  svd: "Spontaneous vaginal (SVD)",
  assisted: "Assisted (vacuum / forceps)",
  caesarean: "Caesarean section",
  breech: "Breech",
  other: "Other",
};

export const NOT_RECORDED = "Not recorded";
export const BLOOD_GROUPS = ["A", "B", "AB", "O"];
export const RHESUS = ["positive", "negative"];

export const RISK_FACTORS = [
  "Previous caesarean section",
  "Hypertension / pre-eclampsia",
  "Gestational diabetes",
  "Anaemia",
  "Multiple pregnancy",
  "Age under 18",
  "Age over 35",
  "Grand multipara (5+)",
  "Previous stillbirth",
  "Previous postpartum haemorrhage",
  "Malpresentation",
  "Antepartum haemorrhage",
  "HIV positive",
  "Sickle cell disease",
  "Rhesus negative",
  "Short birth interval",
];

export const INVESTIGATION_PRESETS: Record<string, string[]> = {
  ultrasound: [
    "Dating scan",
    "Anomaly scan (18–22 wks)",
    "Growth scan",
    "Obstetric Doppler",
    "Biophysical profile",
  ],
  lab: [
    "Haemoglobin / PCV",
    "Blood group & Rhesus",
    "Genotype",
    "HIV",
    "Hepatitis B (HBsAg)",
    "VDRL / syphilis",
    "Malaria parasite",
    "Urinalysis",
    "Random blood sugar",
    "OGTT",
  ],
  other: ["CTG", "Cervical length", "Amniocentesis"],
};

export const VACCINES = [
  "BCG",
  "OPV 0",
  "Hepatitis B (birth)",
  "OPV",
  "Pentavalent",
  "PCV",
  "Rotavirus",
  "IPV",
  "Measles",
  "Yellow fever",
  "Meningitis A",
  "Vitamin A",
  "Tetanus toxoid (Td)",
];
export const INJECTION_SITES = [
  "Left thigh",
  "Right thigh",
  "Left upper arm",
  "Right upper arm",
  "Oral",
  "Other",
];
export const NUTRITION_PROGRAMMES = [
  "SAM – outpatient therapeutic (OTP)",
  "SAM – inpatient stabilisation",
  "MAM – supplementary feeding",
  "Infant & young child feeding counselling",
  "Maternal nutrition support",
];
export const INCISIONS = ["Pfannenstiel", "Low midline", "Joel-Cohen"];
export const SCREENING_TESTS = [
  "Newborn physical exam",
  "Pulse oximetry (critical CHD)",
  "Hearing (OAE)",
  "Blood glucose",
  "Bilirubin",
  "Sickle cell",
  "G6PD",
  "Congenital hypothyroidism (TSH)",
  "HIV exposure (EID / PCR)",
];
export const SCREENING_STATUSES = ["pending", "normal", "abnormal", "referred"];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Formatting helpers                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const ACRONYMS: Record<string, string> = {
  svd: "SVD",
  nicu: "NICU",
  scbu: "SCBU",
  anc: "ANC",
  iud: "IUD",
  muac: "MUAC",
  lab: "Lab",
  ultrasound: "Ultrasound",
};

/** "very-high" -> "Very high", "active-labour" -> "Active labour". */
export const label = (s?: string | null) => {
  if (!s) return "—";
  if (ACRONYMS[s]) return ACRONYMS[s];
  const t = String(s).replace(/[_-]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const toOpts = (a: readonly string[]) =>
  a.map((v) => ({ value: v, label: label(v) }));
export const MODE_OPTS = ENUMS.deliveryModes.map((v) => ({
  value: v as string,
  label: MODE_LABEL[v],
}));

export const nameOf = (p: any): string => {
  if (!p) return "—";
  if (typeof p === "string") return `…${p.slice(-6)}`;
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.mrn || "—";
};
export const mrnOf = (p: any): string | undefined =>
  p && typeof p === "object" ? p.mrn : undefined;
export const matchesPatient = (p: any, q: string) => {
  if (!q.trim()) return true;
  return `${nameOf(p)} ${mrnOf(p) || ""}`
    .toLowerCase()
    .includes(q.trim().toLowerCase());
};

export const todayLocal = () => toLocalInput().slice(0, 10);
export const addDays = (d: Date | string, n: number) =>
  new Date(new Date(d).getTime() + n * 86400000);
export const daysBetween = (a: string | Date, b: string | Date) =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
export const ageYears = (dob?: string | null, at: Date = new Date()) =>
  dob
    ? Math.floor((at.getTime() - new Date(dob).getTime()) / 31557600000)
    : undefined;
export const ageMonthsAt = (dob?: string | null, at: Date = new Date()) => {
  if (!dob) return undefined;
  const d = new Date(dob);
  let m =
    (at.getFullYear() - d.getFullYear()) * 12 + (at.getMonth() - d.getMonth());
  if (at.getDate() < d.getDate()) m -= 1;
  return Math.max(0, m);
};

/* ---- obstetric maths ---- */
/** Naegele's rule: EDD = LMP + 280 days. */
export const eddFromLmp = (lmp: string) =>
  toDateInput(addDays(lmp, 280).toISOString());

/** Gestational age in days from LMP, or from EDD (EDD − 280 d) when LMP is unknown. */
export const gestationDays = (
  r: { lmp?: string; edd?: string },
  at: Date = new Date()
): number | undefined => {
  const start = r.lmp ? new Date(r.lmp) : r.edd ? addDays(r.edd, -280) : null;
  if (!start || Number.isNaN(start.getTime())) return undefined;
  return Math.floor((at.getTime() - start.getTime()) / 86400000);
};
export const gaLabel = (days?: number) =>
  days === undefined || days < 0
    ? "—"
    : `${Math.floor(days / 7)}w ${days % 7}d`;
export const trimester = (days?: number) =>
  days === undefined || days < 0
    ? undefined
    : days < 91
    ? 1
    : days < 196
    ? 2
    : 3;
export const daysToEdd = (edd?: string) =>
  edd
    ? Math.ceil((new Date(edd).getTime() - Date.now()) / 86400000)
    : undefined;

export const bmi = (kg?: number, cm?: number) =>
  kg && cm ? Math.round((kg / Math.pow(cm / 100, 2)) * 10) / 10 : undefined;

/* ---- clinical flags ---- */
export type Tone = "ok" | "warn" | "bad" | "info" | "mute";

/** Birth-weight class (WHO): ELBW <1000 g, VLBW <1500 g, LBW <2500 g. */
export const bwClass = (g?: number): { key: string; tone: Tone } | undefined =>
  g === undefined || g === null
    ? undefined
    : g < 1000
    ? { key: "ELBW", tone: "bad" }
    : g < 1500
    ? { key: "VLBW", tone: "bad" }
    : g < 2500
    ? { key: "LBW", tone: "warn" }
    : g >= 4000
    ? { key: "Macrosomia", tone: "warn" }
    : { key: "Normal", tone: "ok" };

/** MUAC for children 6–59 months: <11.5 cm SAM, 11.5–<12.5 cm MAM. */
export const muacClass = (
  cm?: number
): { key: string; tone: Tone } | undefined =>
  cm === undefined || cm === null
    ? undefined
    : cm < 11.5
    ? { key: "SAM", tone: "bad" }
    : cm < 12.5
    ? { key: "MAM", tone: "warn" }
    : { key: "Normal", tone: "ok" };

/** Hypertension in pregnancy: ≥140/90; severe ≥160/110. */
export const bpFlag = (sys?: number, dia?: number): Tone | undefined => {
  if (sys === undefined && dia === undefined) return undefined;
  if ((sys ?? 0) >= 160 || (dia ?? 0) >= 110) return "bad";
  if ((sys ?? 0) >= 140 || (dia ?? 0) >= 90) return "warn";
  return undefined;
};

export const isOverdue = (date?: string, status?: string) =>
  status === "scheduled" &&
  !!date &&
  new Date(date).getTime() <
    new Date(new Date().setHours(0, 0, 0, 0)).getTime();

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Status pill (tones for maternity statuses the blood-bank kit doesn't know)  */
/* ─────────────────────────────────────────────────────────────────────────── */

const TONE: Record<string, Tone> = {
  // risk
  low: "ok",
  moderate: "warn",
  high: "bad",
  "very-high": "bad",
  // pregnancy / labour
  active: "info",
  delivered: "ok",
  aborted: "bad",
  ectopic: "bad",
  closed: "mute",
  admitted: "warn",
  "active-labour": "info",
  transferred: "mute",
  discharged: "ok",
  // delivery mode / urgency
  svd: "ok",
  assisted: "warn",
  caesarean: "info",
  breech: "warn",
  other: "mute",
  elective: "mute",
  urgent: "warn",
  emergency: "bad",
  // newborn
  well: "ok",
  nicu: "bad",
  scbu: "warn",
  deceased: "bad",
  // child health
  scheduled: "warn",
  given: "ok",
  missed: "bad",
  contraindicated: "mute",
  completed: "ok",
  defaulted: "bad",
  // screening
  pending: "warn",
  normal: "ok",
  abnormal: "bad",
  referred: "warn",
  // investigations
  lab: "info",
  ultrasound: "info",
};

export function MPill({
  value,
  tone,
  children,
}: {
  value?: string;
  tone?: Tone;
  children?: ReactNode;
}) {
  return (
    <Pill tone={tone ?? TONE[value || ""] ?? "mute"}>
      {children ?? label(value)}
    </Pill>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Pickers & small building blocks                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export function PatientPicker({
  value,
  onChange,
  onPick,
  female,
  placeholder = "Search patient by name or MRN…",
}: {
  value: string;
  onChange: (id: string) => void;
  onPick?: (p: any) => void;
  /** Hide patients recorded as male (mothers). Unknown / unspecified stay visible. */
  female?: boolean;
  placeholder?: string;
}) {
  const dispatch = useAppDispatch();
  const { facilityId } = useFacilityId();
  const { ui, isDark, colors } = useUI();
  const patients = useAppSelector((s) => s.patients.list) as any[];

  useEffect(() => {
    if (facilityId) dispatch(fetchPatients({ facilityId, limit: 300 }));
  }, [dispatch, facilityId]);

  const list = female ? patients.filter((p) => p.gender !== "male") : patients;
  const options = list.map((p) => ({
    value: p._id as string,
    label: `${p.mrn || ""} · ${p.firstName} ${p.lastName}${
      p.gender ? ` (${p.gender})` : ""
    }`,
  }));
  if (value && !options.some((o) => o.value === value))
    options.unshift({ value, label: `Patient …${value.slice(-6)}` });

  return (
    <CustomDropdown
      value={value}
      options={options}
      placeholder={placeholder}
      searchable
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

/** SpecForm field that renders a PatientPicker. */
export const patientField = (
  key: string,
  lbl: string,
  o: {
    female?: boolean;
    required?: boolean;
    onPick?: (p: any) => void;
    hint?: string;
    span?: 1 | 2 | 3;
  } = {}
): FieldSpec => ({
  key,
  label: lbl,
  type: "custom",
  required: o.required ?? true,
  hint: o.hint,
  span: o.span,
  render: (v, set) => (
    <PatientPicker
      value={v[key] ?? ""}
      onChange={(id) => set(key, id)}
      onPick={o.onPick}
      female={o.female}
    />
  ),
});

/** Free-text input with one-tap presets (vaccine, programme, incision, test name…). */
export function SuggestInput({
  value,
  onChange,
  presets,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  presets: string[];
  placeholder?: string;
}) {
  const { ui } = useUI();
  return (
    <div className="space-y-2">
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:opacity-40 focus:ring-1"
        style={{ borderColor: ui.border, color: ui.text }}
      />
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const on = value === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
              style={{
                backgroundColor: on ? PRIMARY_COLOR : ui.inner,
                color: on ? "#fff" : ui.text,
              }}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const suggestField = (
  key: string,
  lbl: string,
  presets: string[] | ((v: any) => string[]),
  o: {
    required?: boolean;
    hint?: string;
    placeholder?: string;
    span?: 1 | 2 | 3;
  } = {}
): FieldSpec => ({
  key,
  label: lbl,
  type: "custom",
  required: o.required,
  hint: o.hint,
  span: o.span,
  render: (v, set) => (
    <SuggestInput
      value={v[key] ?? ""}
      onChange={(x) => set(key, x)}
      presets={typeof presets === "function" ? presets(v) : presets}
      placeholder={o.placeholder}
    />
  ),
});

/** Name + MRN cell for tables. */
export function PatientCell({ p, sub }: { p: any; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{nameOf(p)}</p>
      <p className="truncate font-mono text-[11px] opacity-50">
        {mrnOf(p) || ""}
        {sub}
      </p>
    </div>
  );
}

/** Context for every maternity page: facility, slice, router, theme. */
export function useMat() {
  const m = useMaternity();
  const router = useRouter();
  const u = useUI();
  return { ...m, router, ...u };
}

/** Pages that read ?query params need a Suspense boundary (Next.js requirement). */
export function Suspended({
  children,
  narrow = true,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <Page narrow={narrow}>
          <Loader />
        </Page>
      }
    >
      {children}
    </Suspense>
  );
}

export const TONE_COLOR: Record<Tone, string> = {
  ok: "#10b981",
  warn: "#f59e0b",
  bad: "#ef4444",
  info: "#3b82f6",
  mute: "#94a3b8",
};

/** Inline value coloured by clinical tone (no tone = plain). */
export function Flag({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      style={tone ? { color: TONE_COLOR[tone], fontWeight: 600 } : undefined}
    >
      {children}
    </span>
  );
}

/** Date input with one-tap offsets from a start date (next visit / follow-up / next appointment). */
export const quickDateField = (
  key: string,
  lbl: string,
  quick: Array<[string, number]>,
  o: {
    from?: (v: any) => string | undefined;
    hint?: string;
    span?: 1 | 2 | 3;
  } = {}
): FieldSpec => ({
  key,
  label: lbl,
  type: "custom",
  hint: o.hint,
  span: o.span,
  render: (v, set) => (
    <QuickDate
      value={v[key] ?? ""}
      onChange={(x) => set(key, x)}
      quick={quick}
      from={o.from?.(v)}
    />
  ),
});

function QuickDate({
  value,
  onChange,
  quick,
  from,
}: {
  value: string;
  onChange: (v: string) => void;
  quick: Array<[string, number]>;
  from?: string;
}) {
  const { ui, isDark, colors } = useUI();
  // `from` may be a datetime string; offsets are counted from its calendar day
  const start = from ? new Date(from) : new Date();
  return (
    <div className="space-y-2">
      <CustomPopupDatePicker
        value={value}
        onChange={onChange}
        placeholder="Select date…"
        isDark={isDark}
        colors={{ ...colors, shadeBgSecond: "transparent" }}
        border={ui.border}
      />
      <div className="flex flex-wrap gap-1.5">
        {quick.map(([text, days]) => (
          <button
            key={text}
            type="button"
            onClick={() =>
              onChange(toLocalInput(addDays(start, days)).slice(0, 10))
            }
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: ui.inner, color: ui.text }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
