"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Clock,
  Layers,
  Activity,
  FileText,
  ShieldCheck,
  ChevronRight,
  Building2,
  Settings,
  FlaskConical,
  GripVertical,
  LayoutDashboard,
  FolderTree,
  Info,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchLaboratory,
  fetchLabCatalog,
  fetchLabRequests,
  updateRequestKanbanStatus,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

import { Can } from "@/components/access/can";
type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  ui,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  ui: UI;
}) {
  return (
    <div
      className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-2.5 sm:space-y-3 border border-black/5 dark:border-white/5"
      style={{ backgroundColor: ui.card }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl shrink-0"
          style={{ backgroundColor: ui.inner, color }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs opacity-60 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-medium leading-tight tracking-tight mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LabHomePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const facilityId =
    String(params.facilityId || "") ||
    activeFacilityId ||
    activeFacility?._id ||
    "";

  const { laboratory, catalog, requests, listLoading, error } = useAppSelector(
    (s) => s.labs
  );

  const [activeTab, setActiveTab] = useState<"home" | "departments">("home");
  const [showGuide, setShowGuide] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchLaboratory({ facilityId }));
    dispatch(fetchLabCatalog({ facilityId, includeInactive: true }));
    dispatch(fetchLabRequests({ facilityId }));
  }, [dispatch, facilityId]);

  const companyDisplayName =
    activeFacility?.name || laboratory?.name || "Company Laboratory";

  const statusCounts = useMemo(() => {
    const counts = {
      ordered: 0,
      collecting_sample: 0,
      collected: 0,
      processing: 0,
      resulted: 0,
      verified: 0,
      cancelled: 0,
    };
    requests.forEach((req) => {
      const s = (req.status || "ordered") as keyof typeof counts;
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [requests]);

  return (
    <div className="w-full px-0 py-0">
      <div className="grid grid-cols-1 gap-6">
        <div
          className="relative rounded-none sm:rounded-[32px] p-3 sm:p-6 space-y-6 overflow-hidden"
          style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
        >
          {listLoading && catalog.length === 0 && (
            <DarkBlurOverlayLoader text="Loading laboratory module..." />
          )}

          {(msg || err || error) && (
            <div
              className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 z-50 border border-black/10 dark:border-white/10"
              style={{
                backgroundColor: ui.card,
                color: err || error ? "#ef4444" : "#059669",
              }}
              role="status"
            >
              {msg || err || error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <Link
                href="/dashboard"
                className="opacity-60 hover:opacity-100 shrink-0"
              >
                Dashboard
              </Link>
              <ChevronRight size={12} className="opacity-40 shrink-0" />
              <span className="font-semibold truncate">
                {companyDisplayName} Laboratory
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Can path={`/dashboard/labs/setup`}><button
                type="button"
                onClick={() => router.push(`/dashboard/labs/setup`)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-95 outline-none focus:outline-none"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Settings size={13} /> Lab Setup & Depts
              </button></Can>
            </div>
          </div>

          <div
            className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-black/5 dark:border-white/5"
            style={{ backgroundColor: ui.card }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shrink-0 border border-black/5 dark:border-white/5"
                style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
              >
                <FlaskConical size={24} />
              </span>
              <div className="space-y-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                  {companyDisplayName} Laboratory Suite
                </h1>
                <p className="text-xs opacity-60 truncate">
                  {laboratory?.departments?.length
                    ? `${laboratory.departments.length} departments active`
                    : "Laboratory setup configured for this company."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
              <div
                className="rounded-2xl px-3.5 sm:px-4 py-2.5 text-center flex-1 sm:flex-none border border-black/5 dark:border-white/5"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="text-[10px] opacity-50 block uppercase font-bold tracking-wider">
                  Total Requests
                </span>
                <span className="text-base sm:text-lg font-bold">
                  {requests.length}
                </span>
              </div>
            </div>
          </div>

          {/* Guide & Tips Box with Faint Red Theme */}
          <div
            className="rounded-[24px] p-4 border text-xs space-y-3 transition-all"
            style={{
              backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
              borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
              color: isDark ? "#fca5a5" : "#991b1b",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Info
                  size={15}
                  style={{ color: isDark ? "#f87171" : "#dc2626" }}
                />
                <span>Laboratory Suite Guide & Workflow Tips</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] font-medium opacity-80 hover:opacity-100 transition underline"
              >
                {showGuide ? "Hide Guide" : "Show Guide"}
              </button>
            </div>

            <p className="opacity-90 leading-relaxed">
              Monitor real-time status progressions across patient requests,
              drag cards across Kanban stages, and manage active clinical
              departments.
            </p>

            {showGuide && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-[11px]"
                style={{
                  borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                }}
              >
                <div className="space-y-1.5">
                  <p className="font-semibold opacity-100">Kanban Workflow</p>
                  <ul className="list-disc list-inside opacity-90 space-y-1">
                    <li>
                      Drag and drop patient requests across workflow stages.
                    </li>
                    <li>
                      Click any request card to inspect detailed test items.
                    </li>
                    <li>
                      Search requests instantly by patient name, MRN, or test.
                    </li>
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold opacity-100">
                    Departments & Setup
                  </p>
                  <ul className="list-disc list-inside opacity-90 space-y-1">
                    <li>
                      Switch to the Departments tab to view active clinical
                      units.
                    </li>
                    <li>
                      Click <strong>Lab Setup & Depts</strong> to configure
                      units and names.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Button Between Home and Departments */}
          <div className="flex items-center justify-center sm:justify-start">
            <div
              className="inline-flex p-1.5 rounded-full border border-black/10 dark:border-white/10 gap-1"
              style={{ backgroundColor: ui.card }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition outline-none focus:outline-none"
                style={{
                  backgroundColor:
                    activeTab === "home" ? PRIMARY_COLOR : "transparent",
                  color: activeTab === "home" ? "#fff" : ui.text,
                }}
              >
                <LayoutDashboard size={14} /> Home & Requests
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("departments")}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition outline-none focus:outline-none"
                style={{
                  backgroundColor:
                    activeTab === "departments" ? PRIMARY_COLOR : "transparent",
                  color: activeTab === "departments" ? "#fff" : ui.text,
                }}
              >
                <FolderTree size={14} /> Departments (
                {laboratory?.departments?.length || 0})
              </button>
            </div>
          </div>

          {activeTab === "home" ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Status Count Cards */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">
                    Test Counts by Status ({companyDisplayName})
                  </h3>
                  <span className="text-xs opacity-60">
                    Real-time metrics across all patient requests
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                  <StatCard
                    icon={Clock}
                    label="Ordered"
                    value={statusCounts.ordered}
                    color="#3b82f6"
                    ui={ui}
                  />
                  <StatCard
                    icon={Layers}
                    label="Collecting Sample"
                    value={statusCounts.collecting_sample}
                    color="#ec4899"
                    ui={ui}
                  />
                  <StatCard
                    icon={Layers}
                    label="Collected"
                    value={statusCounts.collected}
                    color="#8b5cf6"
                    ui={ui}
                  />
                  <StatCard
                    icon={Activity}
                    label="Processing"
                    value={statusCounts.processing}
                    color="#f59e0b"
                    ui={ui}
                  />
                  <StatCard
                    icon={FileText}
                    label="Resulted"
                    value={statusCounts.resulted}
                    color="#10b981"
                    ui={ui}
                  />
                  <StatCard
                    icon={ShieldCheck}
                    label="Verified"
                    value={statusCounts.verified}
                    color="#059669"
                    ui={ui}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Redesigned Departments View Layout */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-black/5 dark:border-white/5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">
                    Lab Departments & Units
                  </h3>
                  <p className="text-xs opacity-60">
                    Specialized clinical sections configured for{" "}
                    {companyDisplayName}
                  </p>
                </div>
                <Can path={`/dashboard/labs/setup`}><button
                  type="button"
                  onClick={() => router.push(`/dashboard/labs/setup`)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 self-start sm:self-auto"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <Settings size={13} /> Manage Departments
                </button></Can>
              </div>

              {!laboratory?.departments ||
              laboratory.departments.length === 0 ? (
                <div
                  className="rounded-[28px] p-16 text-center text-xs opacity-60 border border-dashed border-black/10 dark:border-white/10"
                  style={{ backgroundColor: ui.card }}
                >
                  No departments configured for this company yet. Click
                  &apos;Manage Departments&apos; to add units like Haematology,
                  Microbiology, etc.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {laboratory.departments.map((dept, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-[26px] p-5 space-y-3 transition-all hover:scale-[1.01] border border-black/5 dark:border-white/15 flex flex-col justify-between"
                      style={{ backgroundColor: ui.card }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 font-bold text-xs border border-black/5 dark:border-white/10"
                            style={{
                              backgroundColor: `${PRIMARY_COLOR}15`,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            <Building2 size={20} />
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold truncate group-hover:opacity-90">
                              {dept.name}
                            </h4>
                            <p className="text-[11px] opacity-50 font-mono mt-0.5">
                              Code: {dept.code}
                            </p>
                          </div>
                        </div>
                        <span
                          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 border border-black/5 dark:border-white/10"
                          style={{
                            backgroundColor: `${PRIMARY_COLOR}18`,
                            color: PRIMARY_COLOR,
                          }}
                        >
                          Active Unit
                        </span>
                      </div>

                      {dept.description ? (
                        <p className="text-xs opacity-75 leading-relaxed pt-2 border-t border-black/5 dark:border-white/5">
                          {dept.description}
                        </p>
                      ) : (
                        <p className="text-xs opacity-40 italic pt-2 border-t border-black/5 dark:border-white/5">
                          No description provided for this department unit.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
