"use client";

import { useEffect, type ReactNode } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  ChevronRight,
  FileText,
  Layers,
  Pencil,
  ShieldCheck,
  Tags,
  Trash2,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchComplianceRule,
  type ComplianceCategory,
  type ComplianceFrequency,
  type ComplianceModule,
  type ComplianceRule,
  type ComplianceRulePayload,
  type ComplianceRuleUpdatePayload,
  type ComplianceSeverity,
  type ComplianceStatus,
} from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomDropdown } from "@/components/ui";
import { CustomPopupDatePicker, Modal } from "@/components/ui/items";
import {
  Section,
  inputCls,
  labelCls,
  useInputStyle,
  usePageUI,
} from "@/components/dashboard/PageFrame";

import { useAccess } from "@/hooks/useAccess";
/* -------------------------------------------------------------------------- */
/*  Options & labels                                                          */
/* -------------------------------------------------------------------------- */

const opt = <T extends string>(value: T, label: string) => ({ value, label });

export const CATEGORY_OPTIONS = [
  opt<ComplianceCategory>("licensing", "Licensing & accreditation"),
  opt<ComplianceCategory>("data_privacy", "Data privacy"),
  opt<ComplianceCategory>("clinical_safety", "Clinical safety"),
  opt<ComplianceCategory>("infection_control", "Infection control"),
  opt<ComplianceCategory>(
    "pharmacy_controlled_drugs",
    "Pharmacy & controlled drugs"
  ),
  opt<ComplianceCategory>("blood_safety", "Blood safety"),
  opt<ComplianceCategory>("radiation_safety", "Radiation safety"),
  opt<ComplianceCategory>("staff_credentials", "Staff credentials"),
  opt<ComplianceCategory>("documentation", "Documentation & records"),
  opt<ComplianceCategory>("billing_finance", "Billing & finance"),
  opt<ComplianceCategory>("environmental_health", "Environmental health"),
  opt<ComplianceCategory>("emergency_preparedness", "Emergency preparedness"),
  opt<ComplianceCategory>("other", "Other"),
];

export const SEVERITY_OPTIONS = [
  opt<ComplianceSeverity>("low", "Low"),
  opt<ComplianceSeverity>("medium", "Medium"),
  opt<ComplianceSeverity>("high", "High"),
  opt<ComplianceSeverity>("critical", "Critical"),
];

export const FREQUENCY_OPTIONS = [
  opt<ComplianceFrequency>("continuous", "Continuous"),
  opt<ComplianceFrequency>("one_time", "One-time"),
  opt<ComplianceFrequency>("daily", "Daily"),
  opt<ComplianceFrequency>("weekly", "Weekly"),
  opt<ComplianceFrequency>("monthly", "Monthly"),
  opt<ComplianceFrequency>("quarterly", "Quarterly"),
  opt<ComplianceFrequency>("biannual", "Every 6 months"),
  opt<ComplianceFrequency>("annual", "Annual"),
];

export const STATUS_OPTIONS = [
  opt<ComplianceStatus>("active", "Active"),
  opt<ComplianceStatus>("draft", "Draft"),
  opt<ComplianceStatus>("suspended", "Suspended"),
  opt<ComplianceStatus>("retired", "Retired"),
];

export const MODULE_OPTIONS = [
  opt<ComplianceModule>("all", "Whole facility"),
  opt<ComplianceModule>("patients", "Patients"),
  opt<ComplianceModule>("wards", "Wards"),
  opt<ComplianceModule>("appointments", "Appointments"),
  opt<ComplianceModule>("labs", "Laboratory"),
  opt<ComplianceModule>("radiology", "Radiology"),
  opt<ComplianceModule>("pharmacy", "Pharmacy"),
  opt<ComplianceModule>("blood_bank", "Blood bank"),
  opt<ComplianceModule>("maternity", "Maternity"),
  opt<ComplianceModule>("emergency", "Emergency"),
  opt<ComplianceModule>("theater", "Theatre"),
  opt<ComplianceModule>("staff", "Staff"),
  opt<ComplianceModule>("finance", "Finance"),
];

const labelOf = (list: { value: string; label: string }[], v?: string) =>
  list.find((o) => o.value === v)?.label || (v ? v.replace(/_/g, " ") : "—");

export const categoryLabel = (v?: string) => labelOf(CATEGORY_OPTIONS, v);
export const severityLabel = (v?: string) => labelOf(SEVERITY_OPTIONS, v);
export const frequencyLabel = (v?: string) => labelOf(FREQUENCY_OPTIONS, v);
export const statusLabel = (v?: string) => labelOf(STATUS_OPTIONS, v);
export const moduleLabel = (v?: string) => labelOf(MODULE_OPTIONS, v);

export const SEVERITY_COLOR: Record<ComplianceSeverity, string> = {
  low: "#64748b",
  medium: "#d97706",
  high: "#ea580c",
  critical: "#dc2626",
};

export const STATUS_COLOR: Record<ComplianceStatus, string> = {
  active: "#10b981",
  draft: "#64748b",
  suspended: "#d97706",
  retired: "#9ca3af",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

export const RULES_HREF = "/dashboard/workspace/compliance/rules";
export const NEW_HREF = `${RULES_HREF}/new`;
export const editHref = (id?: string) =>
  id ? `${RULES_HREF}/edit?id=${id}` : `${RULES_HREF}/edit`;
export const deleteHref = (id?: string) =>
  id ? `${RULES_HREF}/delete?id=${id}` : `${RULES_HREF}/delete`;

/** Permission-based: compliance.manage (the API enforces this too). */
export function useCanManageCompliance(): boolean {
  const { can } = useAccess();
  return can("compliance.manage");
}

export const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";

export const personName = (p: unknown): string => {
  if (!p || typeof p === "string") return "";
  const u = p as { firstName?: string; lastName?: string; email?: string };
  return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "";
};

const DAY = 86_400_000;

/** Whether a live rule's expiry / review date needs attention. */
export function dueState(
  rule: ComplianceRule
): { kind: "expired" | "overdue" | "soon"; label: string } | null {
  if (rule.status === "retired" || rule.status === "draft") return null;
  const now = Date.now();
  if (rule.expiryDate && new Date(rule.expiryDate).getTime() < now)
    return { kind: "expired", label: "Expired" };
  if (rule.nextReviewDate && new Date(rule.nextReviewDate).getTime() < now)
    return { kind: "overdue", label: "Review overdue" };
  const soon = (d?: string | null) =>
    d && new Date(d).getTime() - now <= 30 * DAY;
  if (soon(rule.expiryDate)) return { kind: "soon", label: "Expires soon" };
  if (soon(rule.nextReviewDate))
    return { kind: "soon", label: "Review due soon" };
  return null;
}

const DUE_COLOR = {
  expired: "#dc2626",
  overdue: "#ea580c",
  soon: "#d97706",
} as const;

/* -------------------------------------------------------------------------- */
/*  Small display pieces                                                      */
/* -------------------------------------------------------------------------- */

export function Pill({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

export const SeverityPill = ({
  severity,
}: {
  severity: ComplianceSeverity;
}) => (
  <Pill color={SEVERITY_COLOR[severity] || "#64748b"}>
    {severityLabel(severity)}
  </Pill>
);

export const StatusPill = ({ status }: { status: ComplianceStatus }) => (
  <Pill color={STATUS_COLOR[status] || "#64748b"}>{statusLabel(status)}</Pill>
);

/** Card / row for one rule — matches the Departments grid + list look. */
export function RuleCard({
  rule,
  view = "grid",
  onClick,
  trailing,
}: {
  rule: ComplianceRule;
  view?: "grid" | "list";
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const { ui, border } = usePageUI();
  const due = dueState(rule);
  const clickable = Boolean(onClick);

  const codeBadge = (
    <span
      className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
      style={{ backgroundColor: `${PRIMARY_COLOR}15`, color: PRIMARY_COLOR }}
    >
      {rule.code}
    </span>
  );

  if (view === "list") {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition group ${
          clickable
            ? "hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            : ""
        }`}
      >
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {codeBadge}
            <h3 className="text-sm font-semibold">{rule.title}</h3>
            <SeverityPill severity={rule.severity} />
            {due && <Pill color={DUE_COLOR[due.kind]}>{due.label}</Pill>}
          </div>
          <p className="text-xs opacity-60">
            {categoryLabel(rule.category)}
            {rule.regulatoryBody ? ` · ${rule.regulatoryBody}` : ""} ·{" "}
            {frequencyLabel(rule.frequency)}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <StatusPill status={rule.status} />
          {trailing ||
            (clickable && (
              <ChevronRight
                size={16}
                className="opacity-40 group-hover:opacity-100 transition"
              />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-[28px] p-5 space-y-4 border transition flex flex-col justify-between group ${
        clickable ? "hover:shadow-lg cursor-pointer" : ""
      }`}
      style={{ backgroundColor: ui.card, borderColor: border }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {codeBadge}
              <SeverityPill severity={rule.severity} />
            </div>
            <h3 className="text-base font-semibold tracking-tight flex items-center gap-1">
              {rule.title}
              {clickable && (
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              )}
            </h3>
          </div>
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_COLOR[rule.status] || "#9ca3af" }}
            title={statusLabel(rule.status)}
          />
        </div>
        <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">
          {rule.description || rule.requirement || "No description provided."}
        </p>
      </div>

      <div className="pt-3 border-t space-y-2" style={{ borderColor: border }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-70">
          <span>{categoryLabel(rule.category)}</span>
          {rule.regulatoryBody && <span>· {rule.regulatoryBody}</span>}
          <span>· {frequencyLabel(rule.frequency)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={rule.status} />
            {!rule.isMandatory && <Pill color="#64748b">Recommended</Pill>}
            {due && <Pill color={DUE_COLOR[due.kind]}>{due.label}</Pill>}
          </div>
          {trailing}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rule detail modal (with revision history)                                 */
/* -------------------------------------------------------------------------- */

function Row({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === "" || value === "—")
    return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
        {label}
      </p>
      <p className="text-sm mt-0.5 leading-relaxed whitespace-pre-line">
        {value}
      </p>
    </div>
  );
}

export function RuleDetailModal({
  rule,
  onClose,
  canManage,
}: {
  rule: ComplianceRule | null;
  onClose: () => void;
  canManage: boolean;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { ui } = usePageUI();
  const { facilityId } = useFacilityId();
  const detail = useAppSelector((s) => s.compliance.active);
  const loading = useAppSelector((s) => s.compliance.detailLoading);

  useEffect(() => {
    if (rule && facilityId)
      dispatch(fetchComplianceRule({ facilityId, ruleId: rule._id }));
  }, [dispatch, facilityId, rule]);

  if (!rule) return null;
  const r: ComplianceRule =
    detail && detail._id === rule._id ? { ...rule, ...detail } : rule;
  const due = dueState(r);
  const revisions = [...(r.revisions || [])].reverse();

  return (
    <Modal open title={r.title} onClose={onClose} ui={ui} maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
            style={{
              backgroundColor: `${PRIMARY_COLOR}15`,
              color: PRIMARY_COLOR,
            }}
          >
            {r.code}
          </span>
          <SeverityPill severity={r.severity} />
          <StatusPill status={r.status} />
          <Pill color={r.isMandatory ? "#0ea5e9" : "#64748b"}>
            {r.isMandatory ? "Mandatory" : "Recommended"}
          </Pill>
          {due && <Pill color={DUE_COLOR[due.kind]}>{due.label}</Pill>}
        </div>

        <div className="space-y-4">
          <Row label="Description" value={r.description} />
          <Row label="What is required" value={r.requirement} />
          <Row
            label="Evidence an auditor will expect"
            value={r.evidenceRequired}
          />
        </div>

        <div
          className="grid grid-cols-2 gap-4 rounded-2xl p-4"
          style={{ backgroundColor: ui.inner }}
        >
          <Row label="Category" value={categoryLabel(r.category)} />
          <Row label="Frequency" value={frequencyLabel(r.frequency)} />
          <Row label="Regulator" value={r.regulatoryBody} />
          <Row label="Reference" value={r.reference} />
          <Row
            label="Applies to"
            value={(r.appliesTo || []).map(moduleLabel).join(", ")}
          />
          <Row label="Owner" value={personName(r.owner)} />
          <Row label="Effective" value={fmtDate(r.effectiveDate)} />
          <Row label="Expires" value={fmtDate(r.expiryDate)} />
          <Row label="Next review" value={fmtDate(r.nextReviewDate)} />
          <Row label="Version" value={`v${r.version}`} />
        </div>

        {r.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {r.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px]"
                style={{ backgroundColor: ui.inner }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50 mb-2">
            Change history
          </p>
          {loading && !revisions.length ? (
            <p className="text-xs opacity-50">Loading history…</p>
          ) : revisions.length === 0 ? (
            <p className="text-xs opacity-50">
              No edits yet. This is the original version.
            </p>
          ) : (
            <ul className="space-y-2">
              {revisions.slice(0, 8).map((rev, i) => (
                <li
                  key={rev._id || i}
                  className="rounded-xl px-3 py-2 text-xs"
                  style={{ backgroundColor: ui.inner }}
                >
                  <span className="font-semibold">
                    v{rev.version} → v{rev.version + 1}
                  </span>
                  <span className="opacity-60">
                    {" "}
                    · {fmtDate(rev.at)}{" "}
                    {personName(rev.by) && `· ${personName(rev.by)}`}
                  </span>
                  <p className="opacity-70 mt-0.5">
                    Changed: {rev.changedFields.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canManage && (
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => router.push(deleteHref(r._id))}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-red-500"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <Trash2 size={14} /> Delete
            </button>
            <Link
              href={editHref(r._id)}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Pencil size={14} /> Edit rule
            </Link>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form                                                                      */
/* -------------------------------------------------------------------------- */

export type RuleFormValues = {
  code: string;
  title: string;
  category: ComplianceCategory | "";
  severity: ComplianceSeverity;
  appliesTo: ComplianceModule[];
  regulatoryBody: string;
  reference: string;
  frequency: ComplianceFrequency;
  isMandatory: boolean;
  status: ComplianceStatus;
  description: string;
  requirement: string;
  evidenceRequired: string;
  effectiveDate: string; // yyyy-mm-dd
  expiryDate: string;
  nextReviewDate: string;
  owner: string;
  tags: string; // comma separated
};

export const EMPTY_RULE_FORM: RuleFormValues = {
  code: "",
  title: "",
  category: "",
  severity: "medium",
  appliesTo: ["all"],
  regulatoryBody: "",
  reference: "",
  frequency: "continuous",
  isMandatory: true,
  status: "active",
  description: "",
  requirement: "",
  evidenceRequired: "",
  effectiveDate: "",
  expiryDate: "",
  nextReviewDate: "",
  owner: "",
  tags: "",
};

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function ruleToForm(r: ComplianceRule): RuleFormValues {
  return {
    code: r.code,
    title: r.title,
    category: r.category,
    severity: r.severity,
    appliesTo: r.appliesTo?.length ? r.appliesTo : ["all"],
    regulatoryBody: r.regulatoryBody || "",
    reference: r.reference || "",
    frequency: r.frequency,
    isMandatory: r.isMandatory,
    status: r.status,
    description: r.description || "",
    requirement: r.requirement || "",
    evidenceRequired: r.evidenceRequired || "",
    effectiveDate: day(r.effectiveDate),
    expiryDate: day(r.expiryDate),
    nextReviewDate: day(r.nextReviewDate),
    owner: typeof r.owner === "string" ? r.owner : r.owner?._id || "",
    tags: (r.tags || []).join(", "),
  };
}

export function validateRuleForm(v: RuleFormValues): string | null {
  if (v.code.trim().length < 2)
    return "Rule code must be at least 2 characters";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v.code.trim()))
    return "Rule code may only contain letters, numbers, dot, dash and underscore";
  if (v.title.trim().length < 3)
    return "Rule title must be at least 3 characters";
  if (!v.category) return "Choose a category";
  if (v.effectiveDate && v.expiryDate && v.expiryDate < v.effectiveDate)
    return "The expiry date cannot be before the effective date";
  return null;
}

const parseTags = (s: string) =>
  [
    ...new Set(
      s
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    ),
  ].slice(0, 20);

export function formToCreatePayload(v: RuleFormValues): ComplianceRulePayload {
  const t = (s: string) => s.trim() || undefined;
  return {
    code: v.code.trim().toUpperCase(),
    title: v.title.trim(),
    category: v.category as ComplianceCategory,
    severity: v.severity,
    appliesTo: v.appliesTo.length ? v.appliesTo : ["all"],
    frequency: v.frequency,
    isMandatory: v.isMandatory,
    status: v.status,
    description: t(v.description),
    regulatoryBody: t(v.regulatoryBody),
    reference: t(v.reference),
    requirement: t(v.requirement),
    evidenceRequired: t(v.evidenceRequired),
    effectiveDate: t(v.effectiveDate),
    expiryDate: t(v.expiryDate),
    nextReviewDate: t(v.nextReviewDate),
    owner: t(v.owner),
    tags: parseTags(v.tags),
  };
}

/** Only the fields that differ from the saved rule (the API's PATCH is strict & partial). */
export function formToUpdatePayload(
  v: RuleFormValues,
  o: ComplianceRule
): ComplianceRuleUpdatePayload {
  const out: ComplianceRuleUpdatePayload = {};
  const same = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
  const orig = ruleToForm(o);

  if (v.code.trim().toUpperCase() !== orig.code)
    out.code = v.code.trim().toUpperCase();
  if (v.title.trim() !== orig.title) out.title = v.title.trim();
  if (v.category !== orig.category)
    out.category = v.category as ComplianceCategory;
  if (v.severity !== orig.severity) out.severity = v.severity;
  if (v.frequency !== orig.frequency) out.frequency = v.frequency;
  if (v.status !== orig.status) out.status = v.status;
  if (v.isMandatory !== orig.isMandatory) out.isMandatory = v.isMandatory;
  if (!same([...v.appliesTo].sort(), [...orig.appliesTo].sort()))
    out.appliesTo = v.appliesTo.length ? v.appliesTo : ["all"];
  if (!same(parseTags(v.tags), parseTags(orig.tags)))
    out.tags = parseTags(v.tags);

  (
    [
      "description",
      "regulatoryBody",
      "reference",
      "requirement",
      "evidenceRequired",
    ] as const
  ).forEach((k) => {
    if (v[k].trim() !== orig[k]) out[k] = v[k].trim(); // "" clears the text
  });
  (["effectiveDate", "expiryDate", "nextReviewDate"] as const).forEach((k) => {
    if (v[k] !== orig[k]) out[k] = v[k] || null; // null clears the date
  });
  if (v.owner !== orig.owner) out.owner = v.owner || null;
  return out;
}

/**
 * Date field that uses the shared popup calendar.
 * The popup returns "yyyy-mm-ddThh:mm"; the rule form only stores the day, so we keep "yyyy-mm-dd".
 * The popup cannot blank a date by itself, so a Clear link is shown once a date is chosen.
 */
function DateField({
  label,
  value,
  onChange,
  minDate,
  placeholder = "Pick a date",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minDate?: string;
  placeholder?: string;
}) {
  const { isDark, border, colors } = usePageUI();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className={`${labelCls} !mb-0`}>{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] font-semibold opacity-60 underline transition hover:opacity-100"
          >
            Clear
          </button>
        )}
      </div>
      <CustomPopupDatePicker
        value={value}
        onChange={(v) => onChange(v.split("T")[0])}
        minDate={minDate || undefined}
        placeholder={placeholder}
        isDark={isDark}
        border={border}
        colors={colors}
      />
    </div>
  );
}

export function RuleForm({
  values,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  submitIcon,
  cancelHref = RULES_HREF,
}: {
  values: RuleFormValues;
  onChange: (v: RuleFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel: string;
  submitIcon?: ReactNode;
  cancelHref?: string;
}) {
  const { ui, isDark, border, colors } = usePageUI();
  const inputStyle = useInputStyle();
  const { members } = useFacilityId();

  const set = <K extends keyof RuleFormValues>(k: K, val: RuleFormValues[K]) =>
    onChange({ ...values, [k]: val });

  const toggleModule = (m: ComplianceModule) => {
    let next: ComplianceModule[];
    if (m === "all") next = ["all"];
    else {
      const cur = values.appliesTo.filter((x) => x !== "all");
      next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
      if (!next.length) next = ["all"];
    }
    set("appliesTo", next);
  };

  const memberOptions = [
    { label: "— No owner —", value: "" },
    ...(members || []).map((m: any) => ({
      label:
        `${m.firstName || m.user?.firstName || ""} ${
          m.lastName || m.user?.lastName || ""
        }`.trim() ||
        m.email ||
        "Member",
      value: String(m.id || m.user?._id || ""),
    })),
  ].filter((o) => o.value !== undefined);

  const dd = { isDark, colors, border };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <Section
        icon={ShieldCheck}
        title="Rule details"
        hint="Unique code, title and how serious a breach would be"
      >
        <div>
          <label className={labelCls}>Rule Code *</label>
          <input
            required
            maxLength={40}
            value={values.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="e.g. CTRL-001"
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelCls}>Rule Title *</label>
          <input
            required
            minLength={3}
            maxLength={200}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Controlled drugs register reconciled daily"
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <CustomDropdown
          label="Category *"
          value={values.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => set("category", v as ComplianceCategory)}
          placeholder="Select category"
          {...dd}
        />
        <CustomDropdown
          label="Severity"
          value={values.severity}
          options={SEVERITY_OPTIONS}
          onChange={(v) => set("severity", v as ComplianceSeverity)}
          {...dd}
        />
        <CustomDropdown
          label="Status"
          value={values.status}
          options={STATUS_OPTIONS}
          onChange={(v) => set("status", v as ComplianceStatus)}
          {...dd}
        />
        <div>
          <label className={labelCls}>Obligation</label>
          <div
            className="flex rounded-2xl p-1"
            style={{ backgroundColor: ui.inner }}
          >
            {[
              { v: true, l: "Mandatory" },
              { v: false, l: "Recommended" },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => set("isMandatory", o.v)}
                className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition"
                style={{
                  backgroundColor:
                    values.isMandatory === o.v ? PRIMARY_COLOR : "transparent",
                  color: values.isMandatory === o.v ? "#fff" : ui.text,
                }}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section
        icon={Building2}
        title="Regulation & scope"
        hint="Where the rule comes from and which areas it covers"
      >
        <div>
          <label className={labelCls}>Regulatory Body</label>
          <input
            maxLength={150}
            value={values.regulatoryBody}
            onChange={(e) => set("regulatoryBody", e.target.value)}
            placeholder="e.g. NAFDAC, MDCN, ISO 15189"
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelCls}>Reference / Clause</label>
          <input
            maxLength={300}
            value={values.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="e.g. Section 4.2 of the Act"
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <CustomDropdown
          label="How often"
          value={values.frequency}
          options={FREQUENCY_OPTIONS}
          onChange={(v) => set("frequency", v as ComplianceFrequency)}
          {...dd}
        />
        <div className="sm:col-span-2">
          <label className={labelCls}>Applies to</label>
          <div className="flex flex-wrap gap-2">
            {MODULE_OPTIONS.map((m) => {
              const on = values.appliesTo.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleModule(m.value)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium transition"
                  style={{
                    backgroundColor: on ? PRIMARY_COLOR : ui.inner,
                    color: on ? "#fff" : ui.text,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section
        icon={FileText}
        title="What must be done"
        hint="Plain-language requirement and the evidence auditors expect"
      >
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea
            rows={2}
            maxLength={4000}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short overview of the rule…"
            className={`${inputCls} resize-none`}
            style={inputStyle}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Requirement</label>
          <textarea
            rows={3}
            maxLength={4000}
            value={values.requirement}
            onChange={(e) => set("requirement", e.target.value)}
            placeholder="What staff must do to comply…"
            className={`${inputCls} resize-none`}
            style={inputStyle}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Evidence Required</label>
          <textarea
            rows={2}
            maxLength={2000}
            value={values.evidenceRequired}
            onChange={(e) => set("evidenceRequired", e.target.value)}
            placeholder="e.g. Signed daily register, stock count sheet…"
            className={`${inputCls} resize-none`}
            style={inputStyle}
          />
        </div>
      </Section>

      <Section
        icon={CalendarClock}
        title="Dates & ownership"
        hint="When the rule starts, lapses and is next reviewed"
      >
        <DateField
          label="Effective From"
          value={values.effectiveDate}
          onChange={(v) => set("effectiveDate", v)}
          placeholder="Pick a start date"
        />
        <DateField
          label="Expires On"
          value={values.expiryDate}
          onChange={(v) => set("expiryDate", v)}
          minDate={values.effectiveDate}
          placeholder="Pick an expiry date"
        />
        <DateField
          label="Next Review"
          value={values.nextReviewDate}
          onChange={(v) => set("nextReviewDate", v)}
          minDate={values.effectiveDate}
          placeholder="Pick a review date"
        />
        <CustomDropdown
          label="Rule Owner"
          value={values.owner}
          options={memberOptions}
          onChange={(v) => set("owner", v)}
          placeholder="Select owner"
          {...dd}
        />
      </Section>

      <Section
        icon={Tags}
        title="Tags"
        hint="Optional keywords, separated by commas"
      >
        <div className="sm:col-span-2">
          <input
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="e.g. audit, annual, nafdac"
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <Link
          href={cancelHref}
          className="rounded-full px-6 py-3 text-xs font-semibold"
          style={{ backgroundColor: ui.card }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {submitIcon}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}

/** Empty-list card (same as the Departments "No departments found" box). */
export function EmptyRules({ text, hint }: { text: string; hint?: string }) {
  const { ui } = usePageUI();
  return (
    <div
      className="rounded-[28px] p-12 text-center space-y-3"
      style={{ backgroundColor: ui.card }}
    >
      <Layers className="mx-auto opacity-30" size={36} />
      <p className="text-sm font-medium">{text}</p>
      {hint && <p className="text-xs opacity-50 max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}
