"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  Sparkles,
  Siren,
  Search,
  BellRing,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  dismissNotifications,
  fetchNotifications,
  fetchMoreNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  selectNotifications,
  selectUnreadTotal,
  type AppNotification,
  type NotificationModule,
  type NotificationSeverity,
} from "@/api/slices/notificationsSlice";
import { T, useT } from "@/i18n/provider";
import { ToggleSwitch } from "@/components/ui/items";

const MODULES: { id: NotificationModule | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "patients", label: "Patients" },
  { id: "clinical", label: "Clinical" },
  { id: "labs", label: "Labs" },
  { id: "radiology", label: "Radiology" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "emergency", label: "Emergency" },
  { id: "wards", label: "Wards" },
  { id: "maternity", label: "Maternity" },
  { id: "theater", label: "Theater" },
  { id: "blood_bank", label: "Blood Bank" },
  { id: "tasks", label: "Tasks" },
  { id: "telemedicine", label: "Telemedicine" },
  { id: "company", label: "Company" },
  { id: "system", label: "System" },
];

function severityIcon(sev: NotificationSeverity) {
  switch (sev) {
    case "critical":
      return <Siren size={15} className="animate-pulse" />;
    case "warning":
      return <AlertTriangle size={15} />;
    case "success":
      return <Sparkles size={15} />;
    default:
      return <Info size={15} />;
  }
}

function severityColor(sev: NotificationSeverity, primary: string) {
  switch (sev) {
    case "critical":
      return "#EF4444";
    case "warning":
      return "#F59E0B";
    case "success":
      return "#22C55E";
    default:
      return primary;
  }
}

function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function deepLink(n: AppNotification): string | null {
  const patientId = n.entity?.patientId;
  if (patientId) return `/dashboard/patients/${patientId}`;
  if (n.module === "labs") return "/dashboard/labs";
  if (n.module === "radiology") return "/dashboard/radiology/requests";
  if (n.module === "pharmacy") return "/dashboard/pharmacy";
  if (n.module === "emergency") return "/dashboard/emergency";
  if (n.module === "wards") return "/dashboard/wards";
  if (n.module === "tasks") return "/dashboard/tasks";
  if (n.module === "telemedicine") return "/dashboard/telemedicine";
  return null;
}

export default function NotificationsPage() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors, primaryColor } = useTheme();
  const items = useAppSelector(selectNotifications);
  const unreadTotal = useAppSelector(selectUnreadTotal);
  const { listLoading, loadingMore, hasMore, saving, error } = useAppSelector(
    (s) => s.notifications
  );
  const activeFacilityId = useAppSelector((s) => s.facilities.activeFacilityId);

  const [module, setModule] = useState<NotificationModule | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const border =
    theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cardBg = colors.shadeBg
  const isDark = theme === "dark";

  const load = (opts?: {
    module?: NotificationModule | "all";
    unreadOnly?: boolean;
  }) => {
    const m = opts?.module ?? module;
    const u = opts?.unreadOnly ?? unreadOnly;
    dispatch(
      fetchNotifications({
        facilityId: activeFacilityId || null,
        module: m === "all" ? null : m,
        unreadOnly: u,
        limit: 40,
      })
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFacilityId]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.body && n.body.toLowerCase().includes(q)) ||
        n.module.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Derived metrics for the top cards
  const metrics = useMemo(() => {
    const total = items.length;
    const unread = items.filter((n) => !n.read).length;
    const critical = items.filter((n) => n.severity === "critical").length;
    const warning = items.filter((n) => n.severity === "warning").length;
    const success = items.filter((n) => n.severity === "success").length;

    return {
      total,
      unread,
      critical,
      warning,
      success,
      readRate: total > 0 ? Math.round(((total - unread) / total) * 100) : 100,
    };
  }, [items]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onMarkSelectedRead = async () => {
    if (!selected.size) return;
    await dispatch(markNotificationsRead({ ids: Array.from(selected) }));
    setSelected(new Set());
  };

  const onDismissSelected = async () => {
    if (!selected.size) return;
    await dispatch(dismissNotifications({ ids: Array.from(selected) }));
    setSelected(new Set());
  };

  const onMarkAll = async () => {
    await dispatch(
      markAllNotificationsRead({
        facilityId: activeFacilityId || null,
        module: module === "all" ? undefined : module,
      })
    );
  };

  const onViewDetails = async (n: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.read) {
      dispatch(markNotificationsRead({ ids: [n.id] }));
    }
    const href = deepLink(n);
    if (href) router.push(href);
  };

  const empty = !listLoading && filteredItems.length === 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-6 px-3 sm:px-0 pb-12">
      {/* ===== HEADER ===== */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Bell size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">
                <T>Notifications Hub</T>
              </h1>
              {unreadTotal > 0 && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {unreadTotal} new
                </span>
              )}
            </div>
            <p className="text-xs opacity-60 mt-1">
              {unreadTotal > 0 ? (
                <T>
                  You have active unread clinical alerts requiring attention
                </T>
              ) : (
                <T>All systems normal — you&apos;re completely caught up</T>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all hover:opacity-80"
            style={{
              borderColor: border,
              backgroundColor: colors.shadeBg,
            }}
          >
            <RefreshCw
              size={14}
              className={listLoading ? "animate-spin" : ""}
            />
            <T>Refresh</T>
          </button>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={saving || unreadTotal === 0}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <CheckCheck size={14} />
            <T>Mark all read</T>
          </button>
        </div>
      </div>

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          className="rounded-[28px] p-5 border flex flex-col gap-3"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-55 flex items-center gap-1.5">
                <Bell size={13} />
                Total
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.total}
              </p>
            </div>
            <div
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              <Bell size={16} style={{ color: primaryColor }} />
            </div>
          </div>
          <p className="text-[11px] opacity-50">All notifications loaded</p>
        </div>

        {/* Unread */}
        <div
          className="rounded-[28px] p-5 border flex flex-col gap-3"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-55 flex items-center gap-1.5">
                <BellRing size={13} />
                Unread
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.unread}
              </p>
            </div>
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-violet-500/15">
              <BellRing size={16} className="text-violet-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{
                  width: `${
                    metrics.total ? (metrics.unread / metrics.total) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-[11px] opacity-50">
              {metrics.readRate}% already read
            </p>
          </div>
        </div>

        {/* Critical */}
        <div
          className="rounded-[28px] p-5 border flex flex-col gap-3"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-55 flex items-center gap-1.5">
                <Siren size={13} />
                Critical
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.critical}
              </p>
            </div>
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-red-500/15">
              <Siren size={16} className="text-red-500" />
            </div>
          </div>
          <p className="text-[11px] opacity-50">Require immediate attention</p>
        </div>

        {/* Warning + Success summary */}
        <div
          className="rounded-[28px] p-5 border flex flex-col gap-3"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-55 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Alerts
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {metrics.warning + metrics.success}
              </p>
            </div>
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-amber-500/15">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="flex gap-3 text-[11px] opacity-60">
            <span>
              Warning <strong className="opacity-90">{metrics.warning}</strong>
            </span>
            <span>
              Success <strong className="opacity-90">{metrics.success}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div
        className="rounded-[28px] border p-4 sm:p-5 space-y-4"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm border bg-transparent outline-none transition-colors focus:ring-1"
              style={{ borderColor: border, color: colors.text }}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ToggleSwitch
              checked={unreadOnly}
              onChange={(checked) => {
                setUnreadOnly(checked);
                load({ unreadOnly: checked });
              }}
              label={t("Unread only")}
            />
          </div>
        </div>

        {/* Module pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="flex items-center gap-1 text-xs font-semibold opacity-50 mr-1 shrink-0">
            <Filter size={13} />
            <T>Module</T>
          </span>
          {MODULES.map((m) => {
            const active = module === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setModule(m.id);
                  load({ module: m.id });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0"
                style={{
                  borderColor: active ? primaryColor : border,
                  backgroundColor: active ? primaryColor : "transparent",
                  color: active ? "#fff" : colors.text,
                }}
              >
                {t(m.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== BATCH ACTIONS ===== */}
      {selected.size > 0 && (
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 rounded-[22px] border text-xs font-semibold"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[12px] font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {selected.size}
            </span>
            <span>
              <T>notifications selected</T>
            </span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onMarkSelectedRead}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-colors hover:opacity-80"
              style={{ borderColor: border, backgroundColor: cardBg }}
            >
              <Check size={13} /> <T>Mark read</T>
            </button>
            <button
              type="button"
              onClick={onDismissSelected}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-red-500 transition-colors hover:bg-red-500/10"
              style={{ borderColor: border, backgroundColor: cardBg }}
            >
              <Trash2 size={13} /> <T>Dismiss</T>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 px-1 font-medium">{error}</div>
      )}

      {/* ===== NOTIFICATIONS LIST / TABLE (Borderless Container & Rows) ===== */}
      <div
        className="rounded-[28px] border overflow-hidden"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <div
          className="flex items-center justify-between px-6 py-4.5 border-b"
          style={{ borderColor: border }}
        >
          <h3 className="font-semibold text-sm">Notification Overview</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectionMode((prev) => !prev);
                if (selectionMode) setSelected(new Set());
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{
                borderColor: selectionMode ? primaryColor : border,
                backgroundColor: selectionMode
                  ? `${primaryColor}15`
                  : "transparent",
                color: selectionMode ? primaryColor : colors.text,
              }}
            >
              {selectionMode ? "Cancel Select" : "Select"}
            </button>
            <span className="text-xs opacity-50">
              {filteredItems.length} result
              {filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {listLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60 gap-3 text-sm">
            <Loader2 size={26} className="animate-spin" />
            <T>Loading notifications…</T>
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-3 opacity-60">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: colors.shadeBg }}
            >
              <Bell size={32} />
            </div>
            <p className="text-base font-semibold">
              <T>No notifications found</T>
            </p>
            <p className="text-xs max-w-xs opacity-70">
              <T>
                Critical alerts from emergency, labs, and clinical care will
                appear here instantly.
              </T>
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredItems.map((n) => {
              const sev = severityColor(n.severity, primaryColor);
              const href = deepLink(n);
              const isSel = selected.has(n.id);

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(n.id);
                    }
                  }}
                  className="flex items-start gap-4 px-6 py-4 transition-all group hover:bg-black/[0.015] dark:hover:bg-white/[0.02] cursor-pointer"
                  style={{
                    backgroundColor: n.read
                      ? "transparent"
                      : isDark
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.015)",
                    borderLeft: !n.read
                      ? `4px solid ${primaryColor}`
                      : "4px solid transparent",
                  }}
                >
                  {selectionMode && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(n.id);
                      }}
                      className="relative flex items-center justify-center mt-1.5 shrink-0 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => {}}
                        className="peer sr-only"
                      />
                      <div
                        className={`h-4 w-4 rounded-md border transition-all flex items-center justify-center ${
                          isSel ? "text-white" : "bg-transparent"
                        }`}
                        style={{
                          borderColor: isSel ? primaryColor : border,
                          backgroundColor: isSel ? primaryColor : "transparent",
                        }}
                      >
                        {isSel && <Check size={11} strokeWidth={3} />}
                      </div>
                    </div>
                  )}

                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white mt-0.5"
                    style={{ backgroundColor: sev }}
                  >
                    {severityIcon(n.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                      <h2
                        className="text-sm tracking-tight"
                        style={{ fontWeight: n.read ? 500 : 700 }}
                      >
                        {n.title}
                      </h2>
                      <span className="text-[11px] opacity-45 shrink-0 font-medium">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>

                    {n.body && (
                      <p className="text-xs opacity-60 mt-1 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}

                    <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                          color: colors.text,
                        }}
                      >
                        {n.module.replace("_", " ")}
                      </span>

                      {!n.read && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                      )}

                      {href && (
                        <button
                          type="button"
                          onClick={(e) => onViewDetails(n, e)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold opacity-50 ml-auto hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0"
                          style={{ color: colors.text }}
                        >
                          <T>View details</T> <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="p-4 flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => dispatch(fetchMoreNotifications())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold border disabled:opacity-50 transition-all hover:opacity-80"
              style={{
                borderColor: border,
                backgroundColor: colors.shadeBg,
              }}
            >
              {loadingMore ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              <T>Load older notifications</T>
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs opacity-50 px-2 gap-2 text-center sm:text-left">
        <p>
          <T>
            Notifications are scoped to your active facilities. Critical
            clinical alerts surface first.
          </T>
        </p>
        <Link
          href="/dashboard/settings"
          className="underline font-medium hover:opacity-100 transition-opacity shrink-0"
        >
          <T>Notification preferences</T>
        </Link>
      </div>
    </div>
  );
}
