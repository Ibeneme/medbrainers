"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Baby,
  Building2,
  Heart,
  Loader2,
  Plus,
  Search,
  Syringe,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchAntenatal } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui/items";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const RISK_STYLE: Record<string, { color: string; bg: string }> = {
  low: { color: "#059669", bg: "rgba(16,185,129,0.14)" },
  medium: { color: "#ca8a04", bg: "rgba(202,138,4,0.16)" },
  high: { color: "#dc2626", bg: "rgba(220,38,38,0.16)" },
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  ui,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  ui: UI;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] p-5" style={{ backgroundColor: ui.card }}>
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: ui.inner, color }}
      >
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs opacity-60">{label}</p>
        <p className="text-3xl font-medium leading-tight tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function patientLabel(p: any) {
  if (!p) return "—";
  if (typeof p === "string") return p.slice(-6);
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.mrn || "—";
}

export default function MaternalPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const ui: UI = {
    isDark,
    page: isDark ? "rgba(255,255,255,0.03)" : "#eef2f7",
    card: isDark ? colors.shadeBg : "#ffffff",
    inner: isDark ? colors.shadeBgSecond : "#f3f5f9",
    text: colors.text,
    border,
  };

  const { activeFacilityId, activeFacility } = useAppSelector((s) => s.facilities);
  const { antenatal, listLoading } = useAppSelector((s) => s.maternal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(
      fetchAntenatal({
        facilityId: activeFacilityId,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    );
  }, [dispatch, activeFacilityId, statusFilter]);

  const filtered = antenatal.filter((r) => {
    if (!search.trim()) return true;
    return patientLabel(r.patientId).toLowerCase().includes(search.toLowerCase());
  });

  if (!activeFacilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const active = antenatal.filter((r) => r.status === "active").length;
  const highRisk = antenatal.filter((r) => r.riskLevel === "high").length;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {listLoading && <DarkBlurOverlayLoader text="Loading antenatal records..." />}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs opacity-60">{activeFacility?.name}</p>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
              Maternal &amp; child health
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/maternal/antenatal"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: ui.card }}
            >
              <Heart size={14} /> ANC
            </Link>
            <Link
              href="/dashboard/maternal/delivery"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: ui.card }}
            >
              <Baby size={14} /> Delivery
            </Link>
            <Link
              href="/dashboard/maternal/immunization"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: ui.card }}
            >
              <Syringe size={14} /> Immunization
            </Link>
            <Link
              href="/dashboard/maternal/pediatrics"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: ui.card }}
            >
              Pediatrics
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} /> New ANC
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={Heart} label="ANC records" value={antenatal.length} color={PRIMARY_COLOR} ui={ui} />
          <SummaryCard icon={Baby} label="Active" value={active} color="#10b981" ui={ui} />
          <SummaryCard icon={Heart} label="High risk" value={highRisk} color="#dc2626" ui={ui} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="flex items-center gap-2.5 rounded-full px-4 py-3"
            style={{ backgroundColor: ui.card }}
          >
            <Search size={15} className="opacity-50 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient…"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: ui.text }}
            />
          </div>
          <CustomDropdown
            value={statusFilter}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Delivered", value: "delivered" },
              { label: "Transferred", value: "transferred" },
            ]}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Filter by status..."
            isDark={isDark}
            colors={colors}
            border={border}
          />
        </div>

        <div className="rounded-[28px] p-3 sm:p-4" style={{ backgroundColor: ui.card }}>
          {listLoading && antenatal.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm opacity-60">No antenatal records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs opacity-50">
                    <th className="px-3 pb-3 font-medium">Patient</th>
                    <th className="px-3 pb-3 font-medium hidden sm:table-cell">G/P</th>
                    <th className="px-3 pb-3 font-medium hidden md:table-cell">EDD</th>
                    <th className="px-3 pb-3 font-medium">Risk</th>
                    <th className="px-3 pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const risk = RISK_STYLE[r.riskLevel || ""] || RISK_STYLE.low;
                    return (
                      <tr
                        key={r._id}
                        className="border-t transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                        style={{ borderColor: ui.border }}
                      >
                        <td className="px-3 py-3 font-semibold">{patientLabel(r.patientId)}</td>
                        <td className="px-3 py-3 hidden sm:table-cell opacity-80">
                          G{r.gravida ?? "—"} / P{r.para ?? "—"}
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell text-xs opacity-60">
                          {r.edd ? new Date(r.edd).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                            style={{ color: risk.color, backgroundColor: risk.bg }}
                          >
                            {r.riskLevel || "low"}
                          </span>
                        </td>
                        <td className="px-3 py-3 capitalize opacity-80">
                          {(r.status || "—").replace(/_/g, " ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
