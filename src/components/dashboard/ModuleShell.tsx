"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppSelector } from "@/api/hooks";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

export type ModuleUI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

export function useModuleUI(): ModuleUI {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  return {
    isDark,
    page: isDark ? "rgba(255,255,255,0.03)" : "#eef2f7",
    card: isDark ? colors.shadeBg : "#ffffff",
    inner: isDark ? colors.shadeBgSecond : "#f3f5f9",
    text: colors.text,
    border,
  };
}

export function personLabel(p: unknown) {
  if (!p) return "—";
  if (typeof p === "string") return p.slice(-6);
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return [x.firstName, x.lastName].filter(Boolean).join(" ") || x.mrn || "—";
}

export function ModuleShell({
  title,
  subtitle,
  icon: Icon,
  loading,
  loadingText,
  actions,
  children,
  requireFacility = true,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  loading?: boolean;
  loadingText?: string;
  actions?: ReactNode;
  children: ReactNode;
  requireFacility?: boolean;
}) {
  const ui = useModuleUI();
  const { activeFacilityId, activeFacility } = useAppSelector((s) => s.facilities);
  const { colors } = useTheme();

  if (requireFacility && !activeFacilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {loading && <DarkBlurOverlayLoader text={loadingText || "Loading..."} />}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{ backgroundColor: ui.card, borderColor: ui.border, color: PRIMARY_COLOR }}
              >
                <Icon size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">{title}</h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name}
              {subtitle ? ` · ${subtitle}` : ""}
            </p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
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
    <div>
      <label className="mb-1.5 block text-xs font-semibold opacity-70">{label}</label>
      {children}
    </div>
  );
}

export function useInputStyles() {
  const ui = useModuleUI();
  return {
    ui,
    inputStyle: {
      backgroundColor: ui.inner,
      color: ui.text,
      borderColor: "transparent",
    } as React.CSSProperties,
    inputCls:
      "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/25",
    cardCls: "rounded-[28px] border p-5 sm:p-6 space-y-4",
  };
}

export function StatusPill({ status, map }: { status?: string; map?: Record<string, string> }) {
  const color = map?.[status || ""] || "#6b7280";
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {(status || "—").replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm opacity-50 py-8 text-center">{text}</p>;
}

export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  const ui = useModuleUI();
  return (
    <Link
      href={href}
      className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80"
      style={{ backgroundColor: ui.card, borderColor: ui.border }}
    >
      {children}
    </Link>
  );
}
