"use client";

import React, { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  BadgePercent, ChevronLeft, ChevronRight, FileText, KeyRound, LayoutGrid, Receipt, RefreshCw, ScrollText,
  Search, Settings2, ShoppingCart, Tags, TrendingUp, Wallet,
} from "lucide-react";
import Link from "@/components/access/guarded-link";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { PRIMARY_COLOR, getUI, type UI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useFacilityId } from "@/hooks/useFacilityId";
import type { BillingInvoiceStatus, BillingPaymentStatus } from "@/api/slices";

/* ───────────────────────── theme + formatting ───────────────────────── */

export function useBillingUI() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui: UI = getUI(isDark, colors, border);
  const softShadow = isDark ? "0 4px 24px rgba(0,0,0,0.25)" : "0 4px 24px rgba(0,0,0,0.04)";
  return { ui, isDark, colors, border, softShadow };
}

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

/** YYYY-MM-DD in the browser's local time (what <input type="date"> uses). */
export const toDateInput = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
/** Start / end of a local calendar day as ISO strings for the API. */
export const dayStartIso = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00`).toISOString();
export const dayEndIso = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T23:59:59.999`).toISOString();

export { round2 } from "@/lib/billing/helpers";

export const INVOICE_STATUS_COLORS: Record<BillingInvoiceStatus, string> = {
  draft: "#6b7280",
  issued: "#2563eb",
  partially_paid: "#d97706",
  paid: "#16a34a",
  void: "#dc2626",
};
export const PAYMENT_STATUS_COLORS: Record<BillingPaymentStatus, string> = {
  pending: "#d97706",
  success: "#16a34a",
  failed: "#dc2626",
};

/* ───────────────────────── navigation between billing pages ───────────────────────── */

const TABS = [
  { href: "/dashboard/billing", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/billing/pos", label: "New sale", icon: ShoppingCart },
  { href: "/dashboard/billing/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/billing/catalog", label: "Price catalog", icon: Tags },
  { href: "/dashboard/billing/discounts", label: "Discounts", icon: BadgePercent },
  { href: "/dashboard/billing/payments", label: "Payments", icon: Wallet },
  { href: "/dashboard/billing/reports", label: "Reports", icon: TrendingUp },
  { href: "/dashboard/billing/audit", label: "Audit log", icon: ScrollText },
  { href: "/dashboard/billing/settings", label: "Settings", icon: Settings2 },
  { href: "/dashboard/billing/gateway", label: "Paystack", icon: KeyRound },
] as const;

/**
 * Tab bar across the billing area. Each tab is a GuardedLink, so a tab the person's role can't open
 * (e.g. Paystack for a cashier, New sale for a read-only Financial Manager) simply isn't rendered.
 */
export function BillingTabs() {
  const pathname = usePathname() || "";
  const { ui } = useBillingUI();
  const path = pathname.replace(/^\/[a-z]{2}(?=\/dashboard)/, "");
  const isActive = (t: (typeof TABS)[number]) =>
    "exact" in t && t.exact ? path === t.href : path === t.href || path.startsWith(`${t.href}/`);
  return (
    <nav aria-label="Billing sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const active = isActive(t);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[11px] font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: active ? PRIMARY_COLOR : ui.card,
              color: active ? "#fff" : ui.text,
              boxShadow: active ? `0 4px 14px ${PRIMARY_COLOR}40` : undefined,
            }}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={13} /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ───────────────────────── page shell ───────────────────────── */

export function BillingPage({
  title,
  description,
  icon: Icon = FileText,
  actions,
  loading,
  loadingText,
  onRefresh,
  children,
  narrow,
  hideTabs,
}: {
  title: string;
  description?: string;
  icon?: any;
  actions?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  onRefresh?: () => void;
  children: ReactNode;
  narrow?: boolean;
  hideTabs?: boolean;
}) {
  const { ui, softShadow } = useBillingUI();
  const { hasFacility, activeFacility } = useFacilityId();

  if (!hasFacility) {
    return (
      <div className="mx-auto max-w-md py-20 text-center text-sm opacity-55" style={{ color: ui.text }}>
        Select a facility to open Billing.
      </div>
    );
  }

  return (
    <div
      className={`relative mx-auto w-full space-y-5 px-4 py-6 sm:px-6 sm:py-8 ${narrow ? "max-w-5xl" : "max-w-6xl"}`}
      style={{ color: ui.text }}
    >
      {loading && <DarkBlurOverlayLoader text={loadingText || "Loading billing records..."} />}

      {!hideTabs && <BillingTabs />}

      <div className="flex flex-wrap items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${PRIMARY_COLOR}18`, color: PRIMARY_COLOR }}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-xs leading-relaxed opacity-55">
            {activeFacility?.name}
            {description ? ` · ${description}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: ui.card, boxShadow: softShadow, color: ui.text }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          )}
          {actions}
        </div>
      </div>

      {children}
    </div>
  );
}

/* ───────────────────────── building blocks ───────────────────────── */

export function StatCard({
  icon: Icon,
  label,
  value,
  color = PRIMARY_COLOR,
  hint,
}: {
  icon: any;
  label: string;
  value: ReactNode;
  color?: string;
  hint?: string;
}) {
  const { ui, softShadow } = useBillingUI();
  return (
    <div className="h-full rounded-3xl p-5" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}18`, color }}>
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium opacity-55">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="truncate text-[11px] opacity-45">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function Pill({ label, color = "#6b7280" }: { label?: string; color?: string }) {
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {(label || "—").replace(/_/g, " ")}
    </span>
  );
}
export const InvoiceStatusPill = ({ status }: { status?: BillingInvoiceStatus }) => (
  <Pill label={status} color={status ? INVOICE_STATUS_COLORS[status] : undefined} />
);
export const PaymentStatusPill = ({ status }: { status?: BillingPaymentStatus }) => (
  <Pill label={status} color={status ? PAYMENT_STATUS_COLORS[status] : undefined} />
);

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { ui, softShadow } = useBillingUI();
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
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
        <button type="button" onClick={() => onChange("")} className="shrink-0 text-xs opacity-40 hover:opacity-100">
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
  const { ui } = useBillingUI();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="mr-1 text-[11px] font-medium opacity-55">{label}</span>}
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

export function EmptyBox({ icon: Icon, title, hint, action }: { icon: any; title: string; hint?: string; action?: ReactNode }) {
  const { ui, softShadow } = useBillingUI();
  return (
    <div className="space-y-2 rounded-3xl p-12 text-center sm:p-16" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${PRIMARY_COLOR}18`, color: PRIMARY_COLOR }}>
        <Icon size={24} />
      </span>
      <p className="pt-2 text-sm font-medium opacity-80">{title}</p>
      {hint && <p className="text-xs opacity-50">{hint}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function TableCard({ children, minWidth = 650 }: { children: ReactNode; minWidth?: number }) {
  const { ui, softShadow } = useBillingUI();
  return (
    <div className="w-full overflow-x-auto rounded-3xl p-3 sm:p-5" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-3 pb-3 text-xs font-medium opacity-55 ${className}`}>{children}</th>;
}

export function PrimaryButton({
  children, onClick, href, disabled, type = "button", icon: Icon,
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
  const style = { backgroundColor: PRIMARY_COLOR, boxShadow: `0 8px 20px ${PRIMARY_COLOR}35` };
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
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {inner}
    </button>
  );
}

export function GhostButton({
  children, onClick, href, disabled, icon: Icon, danger, type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: any;
  danger?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const { ui } = useBillingUI();
  const cls =
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40";
  const style = { backgroundColor: ui.inner, color: danger ? "#ef4444" : ui.text };
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
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {inner}
    </button>
  );
}

export function Alert({ tone, children }: { tone: "danger" | "warning" | "info" | "success"; children: ReactNode }) {
  const c = tone === "danger" ? "#dc2626" : tone === "warning" ? "#d97706" : tone === "success" ? "#16a34a" : "#2563eb";
  return (
    <div className="rounded-2xl px-4 py-3 text-xs leading-relaxed" style={{ backgroundColor: `${c}18`, color: c }} role={tone === "danger" ? "alert" : undefined}>
      {children}
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium opacity-55">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] opacity-45">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { upper?: boolean }) {
  const { ui } = useBillingUI();
  const { upper, className = "", style, onChange, ...rest } = props;
  return (
    <input
      {...rest}
      onChange={(e) => {
        if (upper) e.target.value = e.target.value.toUpperCase();
        onChange?.(e);
      }}
      className={`w-full rounded-2xl px-4 py-2.5 text-sm outline-none transition-shadow placeholder:opacity-40 disabled:opacity-50 ${className}`}
      style={{ backgroundColor: ui.inner, color: ui.text, ...style }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { ui } = useBillingUI();
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

export function SelectInput({
  value, onChange, options, disabled, className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  className?: string;
}) {
  const { ui } = useBillingUI();
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-2xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 ${className}`}
      style={{ backgroundColor: ui.inner, color: ui.text }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SectionCard({ title, subtitle, children, right }: { title?: string; subtitle?: string; children: ReactNode; right?: ReactNode }) {
  const { ui, softShadow } = useBillingUI();
  return (
    <div className="space-y-5 rounded-3xl p-5 sm:p-6" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs opacity-55">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** Label/value row used in totals and detail cards. */
export function Row({ label, value, strong, muted }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 text-sm ${strong ? "text-base font-semibold" : ""} ${muted ? "opacity-60" : ""}`}>
      <span className={strong ? "" : "opacity-65"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function Pager({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;
  const btn = "inline-flex h-8 w-8 items-center justify-center rounded-xl transition hover:opacity-80 disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-xs">
      <span className="opacity-55">
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex gap-1.5">
        <button type="button" className={btn} style={{ backgroundColor: "rgba(127,127,127,0.15)" }} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        <button type="button" className={btn} style={{ backgroundColor: "rgba(127,127,127,0.15)" }} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/** Small inline read-only notice for people who can see a page but not change it (e.g. Financial Manager). */
export function ReadOnlyNotice({ what = "this page" }: { what?: string }) {
  return (
    <Alert tone="info">
      You have <b>read-only</b> access to {what}. You can view everything here but cannot change it.
    </Alert>
  );
}
