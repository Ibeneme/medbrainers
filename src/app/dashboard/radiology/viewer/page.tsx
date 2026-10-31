"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { MonitorPlay, Search, RefreshCw } from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import RequestRow from "@/components/dashboard/radiology/RequestRow";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

const LINKS = [
  { href: "/dashboard/radiology/viewer/ohif", label: "OHIF / Cornerstone" },
  { href: "/dashboard/radiology/viewer/mpr-3d", label: "MPR & 3D" },
  { href: "/dashboard/radiology/viewer/tools", label: "W/L Zoom Pan Measure" },
  { href: "/dashboard/radiology/viewer/backblaze-b2", label: "B2 Streaming" },
  { href: "/dashboard/radiology/viewer/templates", label: "Report templates" },
  { href: "/dashboard/radiology/viewer/dictation", label: "Voice dictation" },
  { href: "/dashboard/radiology/viewer/workflow", label: "Sign-off workflow" },
];

const STATUS_TABS = [
  { id: "completed", label: "Completed" },
  { id: "reported", label: "Reported" },
  { id: "in_acquisition", label: "In Acquisition" },
];

export default function ViewerHomePage() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { requests, listLoading, hasFacility, loadRequests } = useRadiology({
    autoRequests: true,
  });

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("completed");

  const relevantRequests = requests.filter((r) =>
    ["completed", "reported", "in_acquisition"].includes(r.status)
  );

  const filteredRequests = useMemo(() => {
    let list = relevantRequests.filter((item) => item.status === activeTab);
    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter((item) => {
      const patientName =
        typeof item.patient === "object" && item.patient
          ? `${item.patient.firstName || ""} ${
              item.patient.lastName || ""
            }`.toLowerCase()
          : "";
      const accession = (item.accessionNumber || "").toLowerCase();
      const procedure = (item.procedureName || "").toLowerCase();
      return (
        patientName.includes(q) ||
        accession.includes(q) ||
        procedure.includes(q)
      );
    });
  }, [relevantRequests, search, activeTab]);

  if (!hasFacility)
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );

  return (
    <div className="mx-auto max-w-6xl w-full">
      {listLoading && (
        <DarkBlurOverlayLoader text="Loading viewer studies..." />
      )}

      <div
        className="space-y-6 w-full min-h-screen p-4 sm:p-6"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 opacity-70 overflow-hidden text-ellipsis whitespace-nowrap">
            <Link href="/dashboard/radiology" className="hover:opacity-100">
              Radiology & PACS
            </Link>
            <span className="opacity-40">/</span>
            <span className="font-semibold">DICOM Viewer & Reports</span>
          </div>
          <button
            type="button"
            onClick={() => loadRequests()}
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

        {/* Header Banner */}
        <div
          className="rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <span
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <MonitorPlay size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                DICOM Viewer & Reports
              </h1>
              <p className="text-xs opacity-60 mt-0.5 leading-relaxed">
                Studies, B2 streaming, structured reports & sign-off workflows
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
            <div className="text-left md:text-right">
              <p className="text-xs font-bold">
                {relevantRequests.length} Active Studies
              </p>
              <p className="text-[10px] opacity-50">
                Ready for visualization & reports
              </p>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border px-4 py-2 text-xs font-semibold transition hover:opacity-95"
              style={{ borderColor: ui.border, backgroundColor: ui.card }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <div
          className="rounded-[20px] sm:rounded-[22px] px-4 py-3 flex items-center gap-3 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <Search size={16} className="opacity-40 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search studies by patient name, accession number, or procedure..."
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: ui.text }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="opacity-40 hover:opacity-100 text-xs shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Toggle Buttons */}
        <div
          className="flex items-center gap-2 border-b pb-4"
          style={{ borderColor: ui.border }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = relevantRequests.filter(
              (r) => r.status === tab.id
            ).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border transition"
                style={{
                  backgroundColor: isActive ? PRIMARY_COLOR : ui.card,
                  color: isActive ? "#fff" : ui.text,
                  borderColor: isActive ? PRIMARY_COLOR : ui.border,
                }}
              >
                <span>{tab.label}</span>
                <span
                  className="rounded-full px-1.5 py-0.2 text-[10px]"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.2)"
                      : ui.inner,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Studies List */}
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-tight opacity-80 px-1 capitalize">
            {activeTab.replace(/_/g, " ")} Studies ({filteredRequests.length})
          </p>
          {filteredRequests.length === 0 ? (
            <div
              className="rounded-[24px] border p-12 text-center text-xs opacity-50"
              style={{ borderColor: ui.border, backgroundColor: ui.card }}
            >
              No studies found in this section.
            </div>
          ) : (
            filteredRequests.map((item) => (
              <RequestRow
                key={item._id}
                item={item}
                ui={ui}
                href={`/dashboard/radiology/viewer/ohif?requestId=${item._id}`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
