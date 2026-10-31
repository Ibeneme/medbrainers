"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileScan,
  ClipboardList,
  Columns3,
  MonitorPlay,
  ChevronRight,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Search,
  ExternalLink,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

export interface BreadcrumbRoute {
  label: string;
  href?: string;
}

interface RadiologyHomePageProps {
  title?: string;
  description?: string;
  routes?: BreadcrumbRoute[];
  destinationPath?: string;
}

export default function RadiologyHomePage({
  title = "Radiology & PACS",
  description = "Manage orders, live worklists, DICOM viewer streams, and structured reports.",
  routes = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Radiology & PACS" },
  ],
  destinationPath = "/dashboard/radiology/requests",
}: RadiologyHomePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const {
    worklist,
    triageStats,
    preAuthPending,
    needsContrastScreening,
    worklistLoading,
    hasFacility,
  } = useRadiology({ autoWorklist: true, autoRequests: true });

  const [searchQuery, setSearchQuery] = useState("");

  if (!hasFacility) {
    return (
      <div className="p-6 text-sm opacity-70" style={{ color: ui.text }}>
        Select a facility to open Radiology & PACS.
      </div>
    );
  }

  // Filter worklist items dynamically if search query is provided
  const filteredWorklist = useMemo(() => {
    if (!worklist) return [];
    if (!searchQuery.trim()) return worklist;

    const q = searchQuery.toLowerCase();
    return worklist.filter((item: any) => {
      const patientName = `${item.patient?.firstName || ""} ${
        item.patient?.lastName || ""
      }`.toLowerCase();
      const accessionNumber = (item.accessionNumber || "").toLowerCase();
      const procedureName = (
        item.procedure?.name ||
        item.examName ||
        ""
      ).toLowerCase();

      return (
        patientName.includes(q) ||
        accessionNumber.includes(q) ||
        procedureName.includes(q)
      );
    });
  }, [worklist, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl w-full">
      {worklistLoading && (
        <DarkBlurOverlayLoader text="Loading radiology records..." />
      )}

      <div
        className="space-y-6 w-full"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 opacity-70 overflow-hidden text-ellipsis whitespace-nowrap">
            {routes.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && (
                  <ChevronRight size={12} className="shrink-0 opacity-40" />
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
          <button
            type="button"
            onClick={() => {
              // Reload functionality if needed via hook
              window.location.reload();
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-90 border shrink-0"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Header & Quick Action Banner */}
        <div
          className="rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <span
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <FileScan size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                {title}
              </h1>
              <p className="text-xs opacity-60 mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
            <div className="text-left md:text-right">
              <p className="text-xs font-bold">
                {worklist.length} Total Orders
              </p>
              <p className="text-[10px] opacity-50">Active worklist queue</p>
            </div>
            <Link
              href={destinationPath}
              className="inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-xs font-bold text-white transition hover:opacity-90 shrink-0"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              New Request <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "On worklist",
              value: worklist.length,
              icon: Activity,
              color: PRIMARY_COLOR,
            },
            {
              label: "STAT",
              value: triageStats.stat,
              icon: AlertTriangle,
              color: "#dc2626",
            },
            {
              label: "Urgent",
              value: triageStats.urgent,
              icon: AlertTriangle,
              color: "#d97706",
            },
            {
              label: "Pre-auth pending",
              value: preAuthPending.length,
              icon: ShieldCheck,
              color: "#ca8a04",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[24px] p-4 border"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: ui.inner, color: s.color }}
                >
                  <s.icon size={18} />
                </span>
                <div>
                  <p className="text-[11px] opacity-60">{s.label}</p>
                  <p className="text-xl font-medium">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contrast Screening Alert Banner */}
        {needsContrastScreening.length > 0 && (
          <Link
            href="/dashboard/radiology/requests/contrast-screening"
            className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition hover:opacity-95"
            style={{
              backgroundColor: "rgba(217,119,6,0.12)",
              borderColor: "rgba(217,119,6,0.35)",
              color: ui.text,
            }}
          >
            <span>
              <strong>{needsContrastScreening.length}</strong> request(s) need
              contrast / allergy screening
            </span>
            <ChevronRight size={16} />
          </Link>
        )}

        {/* Section Cards */}
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              title: "X-Ray / MRI Requests",
              href: "/dashboard/radiology/requests",
              icon: ClipboardList,
              desc: "Order entry, ICD-10, triage, contrast & pre-auth",
            },
            {
              title: "Imaging Worklist",
              href: "/dashboard/radiology/worklist",
              icon: Columns3,
              desc: "Live queues, tech assignment, arrival & prep",
            },
            {
              title: "DICOM Viewer & Reports",
              href: "/dashboard/radiology/viewer",
              icon: MonitorPlay,
              desc: "OHIF viewer, B2 streaming, structured reports & sign-off",
            },
          ].map((sec) => (
            <Link
              key={sec.href}
              href={sec.href}
              className="rounded-[24px] border p-5 space-y-3 transition hover:opacity-95"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
              >
                <sec.icon size={20} />
              </span>
              <div>
                <p className="font-medium">{sec.title}</p>
                <p className="text-xs opacity-60 mt-1">{sec.desc}</p>
              </div>
              <span
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: PRIMARY_COLOR }}
              >
                Open <ChevronRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        {/* Search Bar for Live Worklist / Quick Records */}
        <div
          className="rounded-[20px] sm:rounded-[22px] px-4 py-3 flex items-center gap-3 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <Search size={16} className="opacity-40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search radiology orders by patient name, accession number, or procedure..."
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: ui.text }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="opacity-40 hover:opacity-100 text-xs shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Worklist Table Summary */}
        {filteredWorklist.length === 0 ? (
          <div
            className="rounded-[24px] sm:rounded-[28px] p-12 sm:p-16 text-center border space-y-2"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <FileScan size={36} className="mx-auto opacity-30" />
            <p className="text-sm font-medium opacity-80">
              No active radiology records found.
            </p>
            <p className="text-xs opacity-50">
              Try modifying your search query or create a new request.
            </p>
          </div>
        ) : (
          <div
            className="rounded-[24px] sm:rounded-[28px] p-2 sm:p-4 border overflow-x-auto w-full"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <table className="w-full text-left text-sm min-w-[650px]">
              <thead>
                <tr
                  className="text-xs opacity-50 border-b"
                  style={{ borderColor: ui.border }}
                >
                  <th className="px-3 pb-3 font-medium">Patient Name</th>
                  <th className="px-3 pb-3 font-medium">Accession #</th>
                  <th className="px-3 pb-3 font-medium hidden sm:table-cell">
                    Procedure
                  </th>
                  <th className="px-3 pb-3 font-medium hidden md:table-cell">
                    Priority
                  </th>
                  <th className="px-3 pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorklist.slice(0, 10).map((item: any) => (
                  <tr
                    key={item._id || item.id}
                    className="transition border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    style={{ borderColor: ui.border }}
                  >
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shrink-0 text-white"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                          {item.patient?.firstName?.[0] || "P"}
                          {item.patient?.lastName?.[0] || ""}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">
                            {item.patient?.firstName || "Unknown"}{" "}
                            {item.patient?.lastName || ""}
                          </p>
                          {item.patient?.mrn && (
                            <p className="text-[11px] opacity-50 truncate">
                              MRN: {item.patient.mrn}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1 font-mono text-[11px] inline-block"
                        style={{ backgroundColor: ui.inner }}
                      >
                        {item.accessionNumber || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs capitalize hidden sm:table-cell opacity-70">
                      {item.procedure?.name ||
                        item.examName ||
                        "General Imaging"}
                    </td>
                    <td className="px-3 py-3.5 text-xs font-semibold uppercase hidden md:table-cell">
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px]"
                        style={{
                          backgroundColor:
                            item.priority === "stat"
                              ? "rgba(220,38,38,0.14)"
                              : item.priority === "urgent"
                              ? "rgba(217,119,6,0.14)"
                              : ui.inner,
                          color:
                            item.priority === "stat"
                              ? "#dc2626"
                              : item.priority === "urgent"
                              ? "#d97706"
                              : ui.text,
                        }}
                      >
                        {item.priority || "routine"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Link
                        href={`/dashboard/radiology/viewer?id=${
                          item._id || item.id
                        }`}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition hover:opacity-85 whitespace-nowrap"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: ui.border,
                        }}
                      >
                        View Study <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
