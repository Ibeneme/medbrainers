"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Info, RefreshCw, Search } from "lucide-react";
import { PRIMARY_COLOR, getUI, type UI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";
import {
  DEFAULT_CURRENCY,
  currencySymbol,
  formatMoney,
  getActiveCurrency,
  setActiveCurrency,
} from "@/constants/currencies";
import { useAppSelector } from "@/api/hooks";

/* -------------------------------------------------------------------------- */
/*  Theme + formatting helpers                                                */
/* -------------------------------------------------------------------------- */

export function usePharmacyUI() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui: UI = getUI(isDark, colors, border);
  const currency =
    useAppSelector((s) => s.pharmacy.setup?.settings?.currency) ||
    DEFAULT_CURRENCY;
  setActiveCurrency(currency);
  const softShadow = isDark
    ? "0 4px 24px rgba(0,0,0,0.25)"
    : "0 4px 24px rgba(0,0,0,0.04)";
  return {
    ui,
    isDark,
    colors,
    border,
    currency,
    currencySymbol: currencySymbol(currency),
    softShadow,
  };
}

/** Formats in the facility's selling currency (Pharmacy → Setup). */
export const money = (n?: number) => formatMoney(n, getActiveCurrency());

export const fmtDate = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtDateTime = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function daysUntil(d?: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export function patientName(p: any) {
  if (!p) return "—";
  if (typeof p === "string") return p.slice(-6);
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.mrn || "—";
}

export function personName(p: any) {
  if (!p) return "—";
  if (typeof p === "string") return p.slice(-6);
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "—";
}

export function refName(v: any, key = "name") {
  if (!v) return "—";
  return typeof v === "string" ? v.slice(-6) : v[key] ?? "—";
}

export const STATUS_COLORS: Record<string, string> = {
  pending: "#3b82f6",
  verified: "#8b5cf6",
  partially_dispensed: "#f59e0b",
  dispensed: "#059669",
  cancelled: "#ef4444",
  partial: "#f59e0b",
  out_of_stock: "#ef4444",
  draft: "#6b7280",
  ordered: "#3b82f6",
  partially_received: "#f59e0b",
  received: "#059669",
  active: "#059669",
  quarantined: "#d97706",
  depleted: "#6b7280",
  ok: "#059669",
  low: "#d97706",
  routine: "#6b7280",
  urgent: "#d97706",
  stat: "#dc2626",
  received_: "#059669",
  dispense: "#059669",
  refill: "#8b5cf6",
  dispensed_: "#ef4444",
  adjusted: "#d97706",
};

export function Pill({
  status,
  label,
  color,
}: {
  status?: string;
  label?: string;
  color?: string;
}) {
  const c = color || STATUS_COLORS[status || ""] || "#6b7280";
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: `${c}18`, color: c }}
    >
      {(label ?? status ?? "—").replace(/_/g, " ")}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page frame: back button · icon tile header · optional guide               */
/* -------------------------------------------------------------------------- */

export interface Crumb {
  label: string;
  href?: string;
}

export function PharmacyPage({
  routes,
  title,
  description,
  icon: Icon,
  actions,
  guide,
  loading,
  loadingText,
  onRefresh,
  children,
  narrow,
}: {
  routes: Crumb[];
  title: string;
  description?: string;
  icon: any;
  actions?: ReactNode;
  guide?: {
    title: string;
    summary: string;
    columns?: Array<{ heading: string; points: ReactNode[] }>;
  };
  loading?: boolean;
  loadingText?: string;
  onRefresh?: () => void;
  children: ReactNode;
  narrow?: boolean;
}) {
  const { ui, isDark, softShadow } = usePharmacyUI();
  const { hasFacility } = useFacilityId();
  const [showGuide, setShowGuide] = useState(false);

  if (!hasFacility) {
    return (
      <div
        className="mx-auto max-w-md py-20 text-center text-sm opacity-55"
        style={{ color: ui.text }}
      >
        Select a facility to open the Pharmacy module.
      </div>
    );
  }

  // Back button points at the parent crumb (the one before the current page)
  const parent = routes.length > 1 ? routes[routes.length - 2] : undefined;

  return (
    <div
      className={`relative mx-auto w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 ${
        narrow ? "max-w-5xl" : "max-w-6xl"
      }`}
      style={{ color: ui.text }}
    >
      {loading && (
        <DarkBlurOverlayLoader
          text={loadingText || "Loading pharmacy records..."}
        />
      )}

      {/* Breadcrumb + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap opacity-60">
          {routes.map((r, i) => (
            <div key={i} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && (
                <ChevronRight size={12} className="shrink-0 opacity-50" />
              )}
              {r.href ? (
                <Link href={r.href} className="hover:opacity-100">
                  {r.label}
                </Link>
              ) : (
                <span className="font-semibold">{r.label}</span>
              )}
            </div>
          ))}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-80"
            style={{
              backgroundColor: ui.card,
              boxShadow: softShadow,
              color: ui.text,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        {parent?.href && (
          <Link
            href={parent.href}
            aria-label={`Back to ${parent.label}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80"
            style={{ backgroundColor: ui.card, boxShadow: softShadow }}
          >
            <ArrowLeft size={16} />
          </Link>
        )}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${PRIMARY_COLOR}18`,
            color: PRIMARY_COLOR,
          }}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs leading-relaxed opacity-55">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Guide */}
      {guide && (
        <div
          className="space-y-3 rounded-3xl p-5 text-xs transition-all"
          style={{
            backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
            color: isDark ? "#fca5a5" : "#991b1b",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Info
                size={15}
                style={{ color: isDark ? "#f87171" : "#dc2626" }}
              />
              <span>{guide.title}</span>
            </div>
            {guide.columns && (
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] font-medium underline opacity-80 transition hover:opacity-100"
              >
                {showGuide ? "Hide Guide" : "Show Guide"}
              </button>
            )}
          </div>
          <p className="leading-relaxed opacity-90">{guide.summary}</p>
          {showGuide && guide.columns && (
            <div
              className="grid grid-cols-1 gap-3 border-t pt-3 text-[11px] sm:grid-cols-2"
              style={{
                borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
              }}
            >
              {guide.columns.map((c) => (
                <div key={c.heading} className="space-y-1.5">
                  <p className="font-semibold">{c.heading}</p>
                  <ul className="list-inside list-disc space-y-1 opacity-90">
                    {c.points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  hint,
  href,
}: {
  icon: any;
  label: string;
  value: ReactNode;
  color: string;
  hint?: string;
  href?: string;
}) {
  const { ui, softShadow } = usePharmacyUI();
  const body = (
    <div
      className="h-full rounded-3xl p-5 transition-all hover:opacity-90"
      style={{ backgroundColor: ui.card, boxShadow: softShadow }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium opacity-55">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight">
            {value}
          </p>
          {hint && <p className="truncate text-[11px] opacity-45">{hint}</p>}
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { ui, softShadow } = usePharmacyUI();
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ backgroundColor: ui.card, boxShadow: softShadow }}
    >
      <Search size={16} className="shrink-0 opacity-40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs outline-none placeholder:opacity-50"
        style={{ color: ui.text }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-xs opacity-40 hover:opacity-100"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function Chips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ id: T; label: string; count?: number }>;
}) {
  const { ui } = usePharmacyUI();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="mr-1 text-[11px] font-medium opacity-55">{label}</span>
      )}
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="rounded-2xl px-3.5 py-1.5 text-[11px] font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: active ? PRIMARY_COLOR : ui.card,
              color: active ? "#fff" : ui.text,
              boxShadow: active ? `0 4px 14px ${PRIMARY_COLOR}40` : undefined,
            }}
          >
            {o.label}
            {o.count !== undefined ? ` (${o.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyBox({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: any;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  const { ui, softShadow } = usePharmacyUI();
  return (
    <div
      className="space-y-2 rounded-3xl p-12 text-center sm:p-16"
      style={{ backgroundColor: ui.card, boxShadow: softShadow }}
    >
      <span
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${PRIMARY_COLOR}18`, color: PRIMARY_COLOR }}
      >
        <Icon size={24} />
      </span>
      <p className="pt-2 text-sm font-medium opacity-80">{title}</p>
      {hint && <p className="text-xs opacity-50">{hint}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function TableCard({
  children,
  minWidth = 650,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  const { ui, softShadow } = usePharmacyUI();
  return (
    <div
      className="w-full overflow-x-auto rounded-3xl p-3 sm:p-5"
      style={{ backgroundColor: ui.card, boxShadow: softShadow }}
    >
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 pb-3 text-xs font-medium opacity-55 ${className}`}>
      {children}
    </th>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  type = "button",
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: any;
}) {
  const cls =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
  const style = {
    backgroundColor: PRIMARY_COLOR,
    boxShadow: `0 8px 20px ${PRIMARY_COLOR}35`,
  };
  const inner = (
    <>
      {Icon && <Icon size={14} />}
      {children}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} style={style}>
        {inner}
      </Link>
    );
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={style}
    >
      {inner}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  disabled,
  icon: Icon,
  danger,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: any;
  danger?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const { ui } = usePharmacyUI();
  const cls =
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40";
  const style = {
    backgroundColor: ui.inner,
    color: danger ? "#ef4444" : ui.text,
  };
  const inner = (
    <>
      {Icon && <Icon size={13} />}
      {children}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} style={style}>
        {inner}
      </Link>
    );
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={style}
    >
      {inner}
    </button>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: "danger" | "warning" | "info";
  children: ReactNode;
}) {
  const c =
    tone === "danger" ? "#dc2626" : tone === "warning" ? "#d97706" : "#2563eb";
  return (
    <div
      className="rounded-2xl px-4 py-3 text-xs leading-relaxed"
      style={{ backgroundColor: `${c}18`, color: c }}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form inputs (rounded-2xl, inner background, visible placeholders)         */
/* -------------------------------------------------------------------------- */

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium opacity-55">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] opacity-45">{hint}</p>}
    </div>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { upper?: boolean }
) {
  const { ui } = usePharmacyUI();
  const { upper, className = "", style, onChange, ...rest } = props;
  return (
    <input
      {...rest}
      onChange={(e) => {
        if (upper) e.target.value = e.target.value.toUpperCase();
        onChange?.(e);
      }}
      className={`w-full rounded-2xl px-4 py-2.5 text-sm outline-none transition-shadow placeholder:opacity-40 ${className}`}
      style={{ backgroundColor: ui.inner, color: ui.text, ...style }}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { ui } = usePharmacyUI();
  const { className = "", style, ...rest } = props;
  return (
    <textarea
      rows={3}
      {...rest}
      className={`w-full resize-none rounded-2xl px-4 py-2.5 text-sm leading-relaxed outline-none transition-shadow placeholder:opacity-40 ${className}`}
      style={{ backgroundColor: ui.inner, color: ui.text, ...style }}
    />
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  const { ui, softShadow } = usePharmacyUI();
  return (
    <div
      className="space-y-5 rounded-3xl p-5 sm:p-6"
      style={{ backgroundColor: ui.card, boxShadow: softShadow }}
    >
      {(title || right) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-base font-semibold tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-xs opacity-55">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function PatientAvatar({ p }: { p: any }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: `${PRIMARY_COLOR}18`, color: PRIMARY_COLOR }}
    >
      {p?.firstName?.[0] || "P"}
      {p?.lastName?.[0] || ""}
    </div>
  );
}
