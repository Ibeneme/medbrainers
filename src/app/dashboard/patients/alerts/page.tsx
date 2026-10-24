"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Building2, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchVitalAlerts } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";

export default function VitalAlertsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { alerts, listLoading } = useAppSelector((s) => s.patients);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) dispatch(fetchVitalAlerts(activeFacilityId));
  }, [dispatch, activeFacilityId]);

  if (!activeFacilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-5" style={{ color: colors.text }}>
      <div className="flex justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <AlertTriangle size={20} style={{ color: PRIMARY_COLOR }} /> Allergies & Vital Alerts
        </h1>
        <Link href="/dashboard/patients" className="text-xs opacity-70 underline">
          Directory
        </Link>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: border, backgroundColor: colors.shadeBg }}>
        {listLoading ? (
          <div className="flex justify-center gap-2 p-12 text-xs opacity-60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (alerts as any[]).length === 0 ? (
          <div className="p-12 text-center text-sm opacity-60">No active vital alerts.</div>
        ) : (
          <ul className="divide-y" style={{ borderColor: border }}>
            {(alerts as any[]).map((a, i) => (
              <li key={i} className="px-5 py-4">
                <p className="text-sm font-bold">
                  {a.name} · {a.mrn}
                </p>
                <p className="text-xs text-red-500 mt-1">{a.vital?.alertReason || "Alert"}</p>
                <p className="text-[11px] opacity-50 mt-0.5">
                  {a.vital?.recordedAt ? new Date(a.vital.recordedAt).toLocaleString() : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
