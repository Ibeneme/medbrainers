"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { ChevronRight, Info, Search } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { currencySymbol, formatMoney, getActiveCurrency, setActiveCurrency } from "@/constants/currencies";

export function usePharmacyUi() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);
  const facility = useFacilityId();
  const dispatch = useAppDispatch();
  const pharmacy = useAppSelector((s) => s.pharmacy);
  setActiveCurrency(pharmacy.setup?.settings?.currency);
  return { ui, isDark, colors, dispatch, pharmacy, currencySymbol: currencySymbol(pharmacy.setup?.settings?.currency), ...facility };
}

export function naira(n?: number) {
  return formatMoney(n, getActiveCurrency());
}

export function personName(p: unknown) {
  if (!p) return "—";
  if (typeof p === "string") return p.slice(-6);
  const x = p as {
    firstName?: string;
    lastName?: string;
    mrn?: string;
    name?: string;
    genericName?: string;
  };
  return (
    [x.firstName, x.lastName].filter(Boolean).join(" ") ||
    x.name ||
    x.genericName ||
    x.mrn ||
    "—"
  );
}

export function drugLabel(drug: unknown) {
  if (!drug || typeof drug === "string") return "—";
  const d = drug as {
    genericName?: string;
    brandName?: string;
    strength?: string;
    code?: string;
  };
  const name = [d.genericName, d.strength].filter(Boolean).join(" ");
  return d.brandName ? `${name} (${d.brandName})` : name || d.code || "—";
}

export function fmtDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#d97706",
  partial: "#2563eb",
  dispensed: "#059669",
  on_hold: "#6b7280",
  cancelled: "#dc2626",
  active: "#059669",
  expired: "#dc2626",
  depleted: "#6b7280",
  quarantine: "#d97706",
  recalled: "#dc2626",
  draft: "#6b7280",
  sent: "#2563eb",
  received: "#059669",
  routine: "#6b7280",
  urgent: "#d97706",
  stat: "#dc2626",
  controlled: "#7c3aed",
  pom: "#2563eb",
  otc: "#059669",
};

export function StatusPill({ value }: { value?: string }) {
  const key = (value || "").toLowerCase();
  const color = STATUS_COLOR[key] || "#6b7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={{ color, backgroundColor: `${color}22` }}
    >
      {(value || "—").replaceAll("_", " ")}
    </span>
  );
}

export function PharmacyFrame({
  crumbs,
  title,
  subtitle,
  icon: Icon,
  actions,
  loading,
  loadingText,
  guide,
  children,
}: {
  crumbs: Array<{ label: string; href?: string }>;
  title?: string;
  subtitle?: string;
  icon?: any;
  actions?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  guide?: { title: string; body: string; extra?: ReactNode };
  children: ReactNode;
}) {
  const { ui, pharmacy, hasFacility } = usePharmacyUi();
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  useEffect(() => {
    if (pharmacy.message) {
      setToast(pharmacy.message);
      setToastErr(false);
    } else if (pharmacy.error) {
      setToast(pharmacy.error);
      setToastErr(true);
    }
  }, [pharmacy.message, pharmacy.error]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!hasFacility) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-16 text-center text-sm opacity-70"
        style={{ color: ui.text }}
      >
        Select a facility to open Pharmacy.
      </div>
    );
  }

  return (
    <div
      className="w-full px-3 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto"
      style={{ color: ui.text }}
    >
      {loading && (
        <DarkBlurOverlayLoader text={loadingText || "Loading pharmacy..."} />
      )}
      {toast && (
        <div
          className="fixed right-4 top-4 z-50 rounded-2xl px-4 py-3 text-xs font-semibold shadow-lg"
          style={{
            backgroundColor: ui.card,
            color: toastErr ? "#ef4444" : "#059669",
          }}
        >
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight size={12} className="opacity-40" />}
              {c.href ? (
                <Link href={c.href} className="opacity-60 hover:opacity-100">
                  {c.label}
                </Link>
              ) : (
                <span className="font-semibold">{c.label}</span>
              )}
            </span>
          ))}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {title && (
        <div
          className="rounded-[28px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-black/5 dark:border-white/5"
          style={{ backgroundColor: ui.card }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {Icon && (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
              >
                <Icon size={22} />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs opacity-60 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {guide && (
        <div
          className="rounded-[24px] p-4 border text-xs space-y-3"
          style={{
            backgroundColor: ui.isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
            borderColor: ui.isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
            color: ui.isDark ? "#fca5a5" : "#991b1b",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <Info size={15} />
              <span>{guide.title}</span>
            </div>
            {guide.extra && (
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                className="text-[11px] underline opacity-80"
              >
                {showGuide ? "Hide guide" : "Show guide"}
              </button>
            )}
          </div>
          <p className="opacity-90 leading-relaxed">{guide.body}</p>
          {showGuide && guide.extra}
        </div>
      )}

      {children}
    </div>
  );
}

export function inputStyle(ui: { inner: string; text: string; card?: string }) {
  return {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
  } as const;
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { ui: any }
) {
  const { ui, className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
        className || ""
      }`}
      style={inputStyle(ui)}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold opacity-70">{label}</span>
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50 ${
        className || ""
      }`}
      style={{ backgroundColor: PRIMARY_COLOR }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ui,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { ui: any }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold border transition hover:opacity-90 ${
        className || ""
      }`}
      style={{
        backgroundColor: ui.card,
        borderColor: ui.border,
        color: ui.text,
      }}
    >
      {children}
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  ui,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ui: any;
}) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search"}
        className="w-full rounded-full border pl-9 pr-4 py-2.5 text-xs outline-none"
        style={{
          backgroundColor: ui.card,
          color: ui.text,
          borderColor: ui.border,
        }}
      />
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  ui,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  ui: any;
}) {
  return (
    <div
      className="rounded-[24px] p-4 sm:p-5 border border-black/5 dark:border-white/5"
      style={{ backgroundColor: ui.card }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
          style={{ backgroundColor: ui.inner, color }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] opacity-60 truncate">{label}</p>
          <p className="text-xl font-medium tracking-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl border border-dashed p-8 text-center text-xs opacity-60"
      style={{ borderColor: "rgba(127,127,127,0.35)" }}
    >
      {text}
    </div>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  const { ui } = usePharmacyUi();
  return (
    <div
      className="rounded-[28px] overflow-hidden border border-black/5 dark:border-white/5"
      style={{ backgroundColor: ui.card }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ backgroundColor: ui.inner }}>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold opacity-60 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 align-middle border-t border-black/5 dark:border-white/5 ${
        className || ""
      }`}
    >
      {children}
    </td>
  );
}
