"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "@/components/access/guarded-link";
import { ArrowLeft, Building2, HelpCircle, type LucideIcon } from "lucide-react";
import { PRIMARY_COLOR, getUI, type UI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useAppDispatch } from "@/api/hooks";
import { fetchMyFacilities } from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import PageGuide, { type GuideItem } from "@/components/ui/PageGuide";

/** Theme tokens every page in this style needs (same maths as the Departments page). */
export function usePageUI() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui: UI = getUI(isDark, colors, border);
  return { ui, colors, isDark, border };
}

const WIDTH = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
} as const;

type Props = {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  /** Right-aligned header actions (buttons / links) */
  actions?: ReactNode;
  guideTitle?: string;
  guideItems?: GuideItem[];
  guideLabel?: string;
  /** Page width when the guide is closed (the guide always widens to 7xl) */
  width?: keyof typeof WIDTH;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

/**
 * The Departments-page shell: rounded tinted panel, "Back to…" link, "Need help?" toggle,
 * light title, optional primary action, and the slide-in PageGuide on the right.
 */
export default function PageFrame({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  guideTitle = "Quick Guide",
  guideItems = [],
  guideLabel = "Need help?",
  width = "5xl",
  loading,
  loadingText = "Loading...",
  children,
}: Props) {
  const dispatch = useAppDispatch();
  const { ui, colors } = usePageUI();
  const { facilityId } = useFacilityId();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  if (!facilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const hasGuide = guideItems.length > 0;

  return (
    <div
      className={`mx-auto transition-all duration-300 px-3 sm:px-6 py-4 sm:py-6 ${
        showGuide ? "max-w-7xl" : WIDTH[width]
      }`}
    >
      <div className={`grid grid-cols-1 ${showGuide ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-6`}>
        <div
          className={`relative rounded-[32px] p-4 sm:p-6 space-y-6 ${
            showGuide ? "lg:col-span-2" : "lg:col-span-1"
          }`}
          style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
        >
          {loading && <DarkBlurOverlayLoader text={loadingText} />}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={14} /> {backLabel}
            </Link>

            {hasGuide && (
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80"
                style={{ color: PRIMARY_COLOR }}
              >
                <HelpCircle size={13} />
                {showGuide ? "Hide helper" : guideLabel}
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-normal tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs opacity-60 mt-0.5">{subtitle}</p>}
            </div>
            {actions}
          </div>

          {children}
        </div>

        {hasGuide && (
          <PageGuide
            title={guideTitle}
            items={guideItems}
            isOpen={showGuide}
            onClose={() => setShowGuide(false)}
            ui={ui}
          />
        )}
      </div>
    </div>
  );
}

/** The pill primary action used in page headers ("Add Department" style). */
export function PrimaryLink({ href, icon, children }: { href: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 shadow-sm"
      style={{ backgroundColor: PRIMARY_COLOR }}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/** Rounded section with the icon tile heading used on the create form. */
export function Section({
  icon: Icon,
  title,
  hint,
  right,
  grid = true,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  right?: ReactNode;
  /** two-column field grid (forms) vs free content (results) */
  grid?: boolean;
  children: ReactNode;
}) {
  const { ui } = usePageUI();
  return (
    <section className="rounded-[28px] p-5 sm:p-6 space-y-4" style={{ backgroundColor: ui.card }}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          {hint && <p className="text-xs opacity-55">{hint}</p>}
        </div>
        {right}
      </div>
      {grid ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div> : <div className="space-y-3">{children}</div>}
    </section>
  );
}

/** Shared input look (matches the create-department form). */
export const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";
export const labelCls = "mb-1.5 block text-xs font-medium opacity-60";

export function useInputStyle() {
  const { ui } = usePageUI();
  return { backgroundColor: ui.inner, color: ui.text, borderColor: "transparent", boxShadow: "none" } as React.CSSProperties;
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-2xl px-4 py-3 text-xs font-semibold text-red-500"
      style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
      role="alert"
    >
      {message}
    </p>
  );
}
