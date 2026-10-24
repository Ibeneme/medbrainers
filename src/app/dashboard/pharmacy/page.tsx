"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Pill,
  Plus,
  Search,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchPrescriptions } from "@/api/slices";
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

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending: { color: "#ca8a04", bg: "rgba(202,138,4,0.16)" },
  dispensed: { color: "#059669", bg: "rgba(16,185,129,0.14)" },
  partial: { color: "#2563eb", bg: "rgba(37,99,235,0.14)" },
  cancelled: { color: "#6b7280", bg: "rgba(107,114,128,0.16)" },
  expired: { color: "#dc2626", bg: "rgba(220,38,38,0.16)" },
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

export default function PharmacyPage() {
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
  const { prescriptions, listLoading } = useAppSelector((s) => s.pharmacy);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(
      fetchPrescriptions({
        facilityId: activeFacilityId,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    );
  }, [dispatch, activeFacilityId, statusFilter]);

  const filtered = prescriptions.filter((p) => {
    if (!search.trim()) return true;
    return patientLabel(p.patientId).toLowerCase().includes(search.toLowerCase());
  });

  if (!activeFacilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const pending = prescriptions.filter((p) => p.status === "pending").length;
  const dispensed = prescriptions.filter((p) => p.status === "dispensed").length;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {listLoading && <DarkBlurOverlayLoader text="Loading prescriptions..." />}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs opacity-60">{activeFacility?.name}</p>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
              e-Prescriptions queue
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={14} /> New prescription
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={Pill} label="Prescriptions" value={prescriptions.length} color={PRIMARY_COLOR} ui={ui} />
          <SummaryCard icon={Pill} label="Pending" value={pending} color="#ca8a04" ui={ui} />
          <SummaryCard icon={Pill} label="Dispensed" value={dispensed} color="#10b981" ui={ui} />
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
              { label: "Pending", value: "pending" },
              { label: "Dispensed", value: "dispensed" },
              { label: "Partial", value: "partial" },
              { label: "Cancelled", value: "cancelled" },
            ]}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Filter by status..."
            isDark={isDark}
            colors={colors}
            border={border}
          />
        </div>

        <div className="rounded-[28px] p-3 sm:p-4" style={{ backgroundColor: ui.card }}>
          {listLoading && prescriptions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm opacity-60">No prescriptions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs opacity-50">
                    <th className="px-3 pb-3 font-medium">Patient</th>
                    <th className="px-3 pb-3 font-medium">Items</th>
                    <th className="px-3 pb-3 font-medium">Status</th>
                    <th className="px-3 pb-3 font-medium hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const st = STATUS_STYLE[p.status || ""] || STATUS_STYLE.pending;
                    return (
                      <tr
                        key={p._id}
                        className="border-t transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                        style={{ borderColor: ui.border }}
                      >
                        <td className="px-3 py-3 font-semibold">{patientLabel(p.patientId)}</td>
                        <td className="px-3 py-3 opacity-80">
                          {p.items?.length || 0} item{(p.items?.length || 0) === 1 ? "" : "s"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                            style={{ color: st.color, backgroundColor: st.bg }}
                          >
                            {p.status || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell text-xs opacity-60">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
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
